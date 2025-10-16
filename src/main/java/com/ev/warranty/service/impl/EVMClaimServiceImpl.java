package com.ev.warranty.service.impl;


import com.ev.warranty.mapper.EVMClaimMapper;
import com.ev.warranty.model.dto.claim.EVMClaimSummaryDTO;
import com.ev.warranty.model.dto.claim.EVMClaimFilterRequestDTO;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.repository.ClaimRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EVMClaimServiceImpl implements EVMClaimService {

    private final ClaimRepository claimRepository;
    private final EVMClaimMapper evmClaimMapper;

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
}
