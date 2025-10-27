package com.ev.warranty.service.impl;


import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.mapper.ClaimMapper;
import com.ev.warranty.mapper.EVMClaimMapper;
import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.ClaimStatus;
import com.ev.warranty.model.entity.ClaimStatusHistory;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.ClaimStatusRepository;
import com.ev.warranty.repository.ClaimStatusHistoryRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.service.inter.EVMClaimService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EVMClaimServiceImpl implements EVMClaimService {

    private final ClaimRepository claimRepository;
    private final EVMClaimMapper evmClaimMapper;
    private final ClaimMapper claimMapper;
    private final ClaimStatusRepository claimStatusRepository;
    private final ClaimStatusHistoryRepository claimStatusHistoryRepository;
    private final UserRepository userRepository;

    @Override
    public ClaimResponseDto approveClaim(Integer claimId, EVMApprovalRequestDTO request, String evmStaffUsername) {
        log.info("EVM Staff {} approving claim ID: {}", evmStaffUsername, claimId);

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + claimId));

        // Idempotent/lenient handling to support automated flows
        String currentStatus = claim.getStatus().getCode();
        if (!"PENDING_EVM_APPROVAL".equals(currentStatus)) {
            // If already approved, just return current state (idempotent)
            if ("EVM_APPROVED".equals(currentStatus)) {
                log.info("Claim {} already EVM_APPROVED – returning existing state", claimId);
                return claimMapper.toResponseDto(claim);
            }
            // If already rejected or in any other state, do not error – return current state
            log.info("Claim {} not pending approval (status: {}), returning existing state without changes", claimId, currentStatus);
            return claimMapper.toResponseDto(claim);
        }

        User evmStaff = userRepository.findByUsername(evmStaffUsername)
                .orElseThrow(() -> new NotFoundException("EVM Staff not found: " + evmStaffUsername));

        ClaimStatus approvedStatus = claimStatusRepository.findByCode("EVM_APPROVED")
                .orElseThrow(() -> new NotFoundException("EVM Approved status not found"));

        // Update claim
        claim.setStatus(approvedStatus);
        claim.setApprovedAt(LocalDateTime.now());
        claim.setApprovedBy(evmStaff); // Fixed: set User object instead of ID
        claim.setWarrantyCost(request.getWarrantyCost());
        claim.setCompanyPaidCost(request.getCompanyPaidCost()); // Lưu chi phí bảo hành hãng chi trả

        Claim savedClaim = claimRepository.save(claim);

        // Log status history
        logStatusChange(savedClaim, approvedStatus, evmStaff.getId().longValue(), request.getApprovalNotes());

        log.info("Claim {} approved successfully by EVM Staff {}", claimId, evmStaffUsername);
        return claimMapper.toResponseDto(savedClaim); // Fixed: use correct method name
    }

    @Override
    public ClaimResponseDto rejectClaim(Integer claimId, EVMRejectionRequestDTO request, String evmStaffUsername) {
        log.info("EVM Staff {} rejecting claim ID: {}", evmStaffUsername, claimId);

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + claimId));

        // Idempotent/lenient handling to support automated flows
        String currentStatus = claim.getStatus().getCode();
        if (!"PENDING_EVM_APPROVAL".equals(currentStatus)) {
            // If already rejected, return as-is (idempotent)
            if ("EVM_REJECTED".equals(currentStatus)) {
                log.info("Claim {} already EVM_REJECTED – returning existing state", claimId);
                return claimMapper.toResponseDto(claim);
            }
            // If approved or any other state, return current without changes
            log.info("Claim {} not pending approval (status: {}), returning existing state without changes", claimId, currentStatus);
            return claimMapper.toResponseDto(claim);
        }

        User evmStaff = userRepository.findByUsername(evmStaffUsername)
                .orElseThrow(() -> new NotFoundException("EVM Staff not found: " + evmStaffUsername));

        ClaimStatus rejectedStatus = claimStatusRepository.findByCode("EVM_REJECTED")
                .orElseThrow(() -> new NotFoundException("EVM Rejected status not found"));

        // Update claim
        claim.setStatus(rejectedStatus);
        claim.setRejectedBy(evmStaff);
        claim.setRejectedAt(LocalDateTime.now());

        Claim savedClaim = claimRepository.save(claim);

        // Log status history
        logStatusChange(savedClaim, rejectedStatus, evmStaff.getId().longValue(), request.getRejectionNotes());

        log.info("Claim {} rejected successfully by EVM Staff {}", claimId, evmStaffUsername);
        return claimMapper.toResponseDto(savedClaim); // Fixed: use correct method name
    }

    @Override
    public ClaimResponseDto getClaimForReview(Integer claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + claimId));

        return claimMapper.toResponseDto(claim); // Fixed: use correct method name
    }

    @Override
    public Page<EVMClaimSummaryDTO> getPendingClaims() {
        // Create a filter with only pending status and default pagination
        EVMClaimFilterRequestDTO filter = new EVMClaimFilterRequestDTO();
        filter.setStatusCodes(List.of("PENDING_EVM_APPROVAL"));
        filter.setPage(0);
        filter.setSize(20); // Default page size, adjust as needed
        return getAllClaims(filter);
    }

    @Override
    public Page<EVMClaimSummaryDTO> getPendingClaims(EVMClaimFilterRequestDTO filter) {
        log.info("Getting pending claims awaiting EVM approval");
        // Force filter to only pending claims
        filter.setStatusCodes(List.of("PENDING_EVM_APPROVAL"));
        return getAllClaims(filter);
    }

    @Override
    public Page<EVMClaimSummaryDTO> getAllClaims(EVMClaimFilterRequestDTO filter) {
        log.info("EVM: Getting all warranty claims with filters - statusCodes: {}, cost range: {}-{}, search: {}",
                filter.getStatusCodes(), filter.getMinWarrantyCost(), filter.getMaxWarrantyCost(), filter.getSearchKeyword());

        // Build dynamic specification for filtering
        Specification<Claim> specification = buildClaimSpecification(filter);

        // Build sort and pagination
        Sort sort = buildSort(filter.getSortBy(), filter.getSortDirection());
        PageRequest pageable = PageRequest.of(filter.getPage(), filter.getSize(), sort);

        // Execute query with specification
        Page<Claim> claimsPage = claimRepository.findAll(specification, pageable);

        // Convert to EVM DTOs with business intelligence
        List<EVMClaimSummaryDTO> evmClaims = evmClaimMapper.toEVMSummaryDTOList(claimsPage.getContent());

        log.info("EVM: Retrieved {} claims out of {} total", evmClaims.size(), claimsPage.getTotalElements());

        return new PageImpl<>(evmClaims, pageable, claimsPage.getTotalElements());
    }

    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * Build dynamic JPA Specification based on filter criteria
     * This allows flexible querying without method explosion
     */
    private Specification<Claim> buildClaimSpecification(EVMClaimFilterRequestDTO filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Status filtering - maps to claim_statuses table
            if (filter.getStatusCodes() != null && !filter.getStatusCodes().isEmpty()) {
                predicates.add(root.get("status").get("code").in(filter.getStatusCodes()));
                log.debug("Added status filter: {}", filter.getStatusCodes());
            }

            // 2. Date range filtering - creation date
            if (filter.getCreatedFrom() != null) {
                LocalDateTime startOfDay = filter.getCreatedFrom().atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startOfDay));
                log.debug("Added createdFrom filter: {}", startOfDay);
            }

            if (filter.getCreatedTo() != null) {
                LocalDateTime endOfDay = filter.getCreatedTo().atTime(23, 59, 59);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endOfDay));
                log.debug("Added createdTo filter: {}", endOfDay);
            }

            // 3. Approval date filtering
            if (filter.getApprovedFrom() != null) {
                LocalDateTime startOfDay = filter.getApprovedFrom().atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("approvedAt"), startOfDay));
            }

            if (filter.getApprovedTo() != null) {
                LocalDateTime endOfDay = filter.getApprovedTo().atTime(23, 59, 59);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("approvedAt"), endOfDay));
            }

            // 4. Cost range filtering - important for EVM budget control
            if (filter.getMinWarrantyCost() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("warrantyCost"), filter.getMinWarrantyCost()));
                log.debug("Added minCost filter: {}", filter.getMinWarrantyCost());
            }

            if (filter.getMaxWarrantyCost() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("warrantyCost"), filter.getMaxWarrantyCost()));
                log.debug("Added maxCost filter: {}", filter.getMaxWarrantyCost());
            }

            // 5. Vehicle model filtering - for quality analysis
            if (filter.getVehicleModels() != null && !filter.getVehicleModels().isEmpty()) {
                predicates.add(root.get("vehicle").get("model").in(filter.getVehicleModels()));
                log.debug("Added vehicle model filter: {}", filter.getVehicleModels());
            }

            // 6. Vehicle year filtering
            if (filter.getVehicleYears() != null && !filter.getVehicleYears().isEmpty()) {
                predicates.add(root.get("vehicle").get("year").in(filter.getVehicleYears()));
            }

            // 7. Service center filtering by user IDs
            if (filter.getCreatedByUserIds() != null && !filter.getCreatedByUserIds().isEmpty()) {
                predicates.add(root.get("createdBy").get("id").in(filter.getCreatedByUserIds()));
            }

            if (filter.getAssignedTechnicianIds() != null && !filter.getAssignedTechnicianIds().isEmpty()) {
                predicates.add(root.get("assignedTechnician").get("id").in(filter.getAssignedTechnicianIds()));
            }

            // 8. Search keyword across multiple fields
            if (filter.getSearchKeyword() != null && !filter.getSearchKeyword().trim().isEmpty()) {
                String keyword = "%" + filter.getSearchKeyword().toLowerCase() + "%";

                Predicate claimNumberPredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("claimNumber")), keyword);
                Predicate vinPredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("vehicle").get("vin")), keyword);
                Predicate customerNamePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("customer").get("name")), keyword);
                Predicate reportedFailurePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("reportedFailure")), keyword);

                predicates.add(criteriaBuilder.or(
                        claimNumberPredicate, vinPredicate, customerNamePredicate, reportedFailurePredicate));

                log.debug("Added search keyword filter: {}", filter.getSearchKeyword());
            }

            // Combine all predicates with AND
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort buildSort(String sortBy, String sortDirection) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) ?
                Sort.Direction.ASC : Sort.Direction.DESC;

        // Map field names to entity properties
        String entityProperty = switch (sortBy) {
            case "warrantyCost" -> "warrantyCost";
            case "status" -> "status.code";
            case "createdAt" -> "createdAt";
            case "approvedAt" -> "approvedAt";
            default -> "createdAt"; // Default sort
        };

        log.debug("Sorting by: {} {}", entityProperty, direction);
        return Sort.by(direction, entityProperty);
    }

    private void logStatusChange(Claim claim, ClaimStatus newStatus, Long userId, String notes) {
        // Find user by ID to set the User object
        User user = userRepository.findById(userId.intValue())
                .orElse(null); // Allow null if user not found

        ClaimStatusHistory history = new ClaimStatusHistory();
        history.setClaim(claim);
        history.setStatus(newStatus);
        history.setChangedAt(LocalDateTime.now());
        history.setChangedBy(user); // Set User object instead of Long
        history.setNote(notes); // Use 'note' instead of 'notes'

        claimStatusHistoryRepository.save(history);
    }
}
