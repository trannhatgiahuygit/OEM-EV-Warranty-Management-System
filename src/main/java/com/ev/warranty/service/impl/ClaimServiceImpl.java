package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.ClaimDto;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.VehicleRepository;
import com.ev.warranty.service.ClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClaimServiceImpl implements ClaimService {

    private final ClaimRepository claimRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Override
    public ClaimDto createClaim(ClaimDto.CreateRequest request) {
        // Validate vehicle exists
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
            .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + request.getVehicleId()));

        // Validate customer exists
        User customer = userRepository.findById(request.getCustomerId())
            .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + request.getCustomerId()));

        // Get current SC Staff from security context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User scStaff = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("SC Staff not found: " + username));

        // Generate unique claim number
        String claimNumber = generateClaimNumber();

        // Create claim entity
        Claim claim = Claim.builder()
            .claimNumber(claimNumber)
            .vehicle(vehicle)
            .customer(customer)
            .scStaff(scStaff)
            .issueDescription(request.getIssueDescription())
            .symptomDescription(request.getSymptomDescription())
            .priority(request.getPriority())
            .failedPartNumber(request.getFailedPartNumber())
            .mileage(request.getMileage())
            .notes(request.getNotes())
            .status("SUBMITTED")
            .claimDate(LocalDateTime.now())
            .build();

        Claim savedClaim = claimRepository.save(claim);
        return convertToDto(savedClaim);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimDto> getAllClaims() {
        List<Claim> claims = claimRepository.findAll();
        return claims.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ClaimDto getClaimById(Integer claimId) {
        Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new RuntimeException("Claim not found with ID: " + claimId));
        return convertToDto(claim);
    }

    @Override
    @Transactional(readOnly = true)
    public ClaimDto getClaimByNumber(String claimNumber) {
        Claim claim = claimRepository.findByClaimNumber(claimNumber)
            .orElseThrow(() -> new RuntimeException("Claim not found with number: " + claimNumber));
        return convertToDto(claim);
    }

    @Override
    public ClaimDto updateClaim(Integer claimId, ClaimDto.UpdateRequest request) {
        Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new RuntimeException("Claim not found with ID: " + claimId));

        // Update fields if provided
        if (request.getDiagnosisResult() != null) {
            claim.setDiagnosisResult(request.getDiagnosisResult());
        }
        if (request.getStatus() != null) {
            claim.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            claim.setPriority(request.getPriority());
        }
        if (request.getReplacementPartNumber() != null) {
            claim.setReplacementPartNumber(request.getReplacementPartNumber());
        }
        if (request.getEstimatedCost() != null) {
            claim.setEstimatedCost(request.getEstimatedCost());
        }
        if (request.getActualCost() != null) {
            claim.setActualCost(request.getActualCost());
        }
        if (request.getLaborHours() != null) {
            claim.setLaborHours(request.getLaborHours());
        }
        if (request.getNotes() != null) {
            claim.setNotes(request.getNotes());
        }
        if (request.getOemResponse() != null) {
            claim.setOemResponse(request.getOemResponse());
        }
        if (request.getAssignedTechnicianId() != null) {
            User technician = userRepository.findById(request.getAssignedTechnicianId())
                .orElseThrow(() -> new RuntimeException("Technician not found with ID: " + request.getAssignedTechnicianId()));
            claim.setAssignedTechnician(technician);
        }

        Claim updatedClaim = claimRepository.save(claim);
        return convertToDto(updatedClaim);
    }

    @Override
    public ClaimDto assignTechnician(Integer claimId, ClaimDto.AssignTechnicianRequest request) {
        Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new RuntimeException("Claim not found with ID: " + claimId));

        User technician = userRepository.findById(request.getTechnicianId())
            .orElseThrow(() -> new RuntimeException("Technician not found with ID: " + request.getTechnicianId()));

        claim.setAssignedTechnician(technician);
        if (request.getNotes() != null) {
            claim.setNotes(claim.getNotes() + "\n" + request.getNotes());
        }

        Claim updatedClaim = claimRepository.save(claim);
        return convertToDto(updatedClaim);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimDto> getClaimsByStatus(String status) {
        List<Claim> claims = claimRepository.findByStatusOrderByClaimDateDesc(status);
        return claims.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimDto> getClaimsByPriority(String priority) {
        List<Claim> claims = claimRepository.findByPriorityOrderByClaimDateDesc(priority);
        return claims.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimDto> getClaimsByTechnician(Integer technicianId) {
        List<Claim> claims = claimRepository.findByAssignedTechnicianIdOrderByClaimDateDesc(technicianId);
        return claims.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimDto> getClaimsByVehicle(Integer vehicleId) {
        List<Claim> claims = claimRepository.findByVehicleIdOrderByClaimDateDesc(vehicleId);
        return claims.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimDto> getClaimsByCustomer(Integer customerId) {
        List<Claim> claims = claimRepository.findByCustomerIdOrderByClaimDateDesc(customerId);
        return claims.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimDto> getActiveClaimsInProgress() {
        List<Claim> claims = claimRepository.findActiveClaimsInProgress();
        return claims.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimDto> getClaimsRequiringParts() {
        List<Claim> claims = claimRepository.findClaimsRequiringParts();
        return claims.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public ClaimDto updateClaimStatus(Integer claimId, String status) {
        Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new RuntimeException("Claim not found with ID: " + claimId));

        claim.setStatus(status);

        // Set appropriate dates based on status
        if ("APPROVED".equals(status)) {
            claim.setApprovalDate(LocalDateTime.now());
        } else if ("COMPLETED".equals(status)) {
            claim.setCompletionDate(LocalDateTime.now());
        } else if ("CLOSED".equals(status)) {
            claim.setClosedDate(LocalDateTime.now());
        }

        Claim updatedClaim = claimRepository.save(claim);
        return convertToDto(updatedClaim);
    }

    @Override
    public ClaimDto completeClaim(Integer claimId, String notes) {
        Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new RuntimeException("Claim not found with ID: " + claimId));

        claim.setStatus("COMPLETED");
        claim.setCompletionDate(LocalDateTime.now());

        if (notes != null) {
            claim.setNotes(claim.getNotes() + "\n" + notes);
        }

        Claim updatedClaim = claimRepository.save(claim);
        return convertToDto(updatedClaim);
    }

    @Override
    public ClaimDto closeClaim(Integer claimId, String notes) {
        Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new RuntimeException("Claim not found with ID: " + claimId));

        claim.setStatus("CLOSED");
        claim.setClosedDate(LocalDateTime.now());

        if (notes != null) {
            claim.setNotes(claim.getNotes() + "\n" + notes);
        }

        Claim updatedClaim = claimRepository.save(claim);
        return convertToDto(updatedClaim);
    }

    private String generateClaimNumber() {
        String prefix = "CLM";
        String timestamp = String.valueOf(System.currentTimeMillis());
        String randomPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return prefix + "-" + timestamp + "-" + randomPart;
    }

    private ClaimDto convertToDto(Claim claim) {
        ClaimDto.ClaimDtoBuilder builder = ClaimDto.builder()
            .id(claim.getId())
            .claimNumber(claim.getClaimNumber())
            .vehicleId(claim.getVehicle().getId())
            .vehicleVin(claim.getVehicle().getVin())
            .vehicleModel(claim.getVehicle().getModel())
            .customerId(claim.getCustomer().getId())
            .customerName(claim.getCustomer().getFullname())
            .customerEmail(claim.getCustomer().getEmail())
            .customerPhone(claim.getCustomer().getPhone())
            .issueDescription(claim.getIssueDescription())
            .symptomDescription(claim.getSymptomDescription())
            .diagnosisResult(claim.getDiagnosisResult())
            .status(claim.getStatus())
            .priority(claim.getPriority())
            .failedPartNumber(claim.getFailedPartNumber())
            .replacementPartNumber(claim.getReplacementPartNumber())
            .estimatedCost(claim.getEstimatedCost())
            .actualCost(claim.getActualCost())
            .claimDate(claim.getClaimDate())
            .approvalDate(claim.getApprovalDate())
            .completionDate(claim.getCompletionDate())
            .closedDate(claim.getClosedDate())
            .mileage(claim.getMileage())
            .laborHours(claim.getLaborHours())
            .notes(claim.getNotes())
            .oemResponse(claim.getOemResponse())
            .createdAt(claim.getCreatedAt())
            .updatedAt(claim.getUpdatedAt());

        if (claim.getScStaff() != null) {
            builder.scStaffId(claim.getScStaff().getId())
                   .scStaffName(claim.getScStaff().getFullname());
        }

        if (claim.getAssignedTechnician() != null) {
            builder.assignedTechnicianId(claim.getAssignedTechnician().getId())
                   .assignedTechnicianName(claim.getAssignedTechnician().getFullname());
        }

        return builder.build();
    }
}
