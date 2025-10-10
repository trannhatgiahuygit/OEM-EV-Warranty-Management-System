package com.ev.warranty.service;

import com.ev.warranty.exception.BadRequestException;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ClaimStatusRepository claimStatusRepository;
    private final ClaimStatusHistoryRepository claimStatusHistoryRepository;
    private final ClaimAttachmentRepository claimAttachmentRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    /**
     * Flow 1: Intake-first - SC Staff creates complete claim and can submit immediately
     */
    @Transactional
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN')")
    public ClaimResponseDto createClaimIntake(ClaimIntakeRequest request) {
        User currentUser = getCurrentUser();

        // Find or create customer
        Customer customer = findOrCreateCustomer(request, currentUser);

        // Find vehicle by VIN
        Vehicle vehicle = vehicleRepository.findByVin(request.getVin())
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + request.getVin()));

        // Generate unique claim number
        String claimNumber = generateClaimNumber();

        // Get initial status (OPEN)
        ClaimStatus openStatus = claimStatusRepository.findByCode("OPEN")
                .orElseThrow(() -> new NotFoundException("Status OPEN not found"));

        // Create claim
        Claim claim = Claim.builder()
                .claimNumber(claimNumber)
                .vehicle(vehicle)
                .customer(customer)
                .createdBy(currentUser)
                .reportedFailure(request.getReportedFailure())
                .initialDiagnosis(request.getClaimTitle()) // Use title as initial diagnosis
                .status(openStatus)
                .build();

        // Assign technician if provided
        if (request.getAssignedTechnicianId() != null) {
            User technician = userRepository.findById(request.getAssignedTechnicianId())
                    .orElseThrow(() -> new NotFoundException("Technician not found"));

            if (!"SC_TECHNICIAN".equals(technician.getRole().getName())) {
                throw new BadRequestException("Assigned user is not a technician");
            }
            claim.setAssignedTechnician(technician);
        }

        claim = claimRepository.save(claim);

        // Create status history
        createStatusHistory(claim, openStatus, currentUser, "Claim created via intake process");

        return mapToResponseDto(claim);
    }

    /**
     * Flow 2: Collaborative - SC Staff creates draft, technician completes diagnostic
     */
    @Transactional
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN')")
    public ClaimResponseDto saveDraftClaim(ClaimIntakeRequest request) {
        // Same as createClaimIntake but with different initial note
        ClaimResponseDto response = createClaimIntake(request);

        // Update status history note to indicate draft
        User currentUser = getCurrentUser();
        Claim claim = claimRepository.findById(response.getId()).orElseThrow();
        createStatusHistory(claim, claim.getStatus(), currentUser,
                "Draft claim created - awaiting technician diagnostic");

        return response;
    }

    /**
     * Technician adds diagnostic information
     */
    @Transactional
    @PreAuthorize("hasRole('SC_TECHNICIAN')")
    public ClaimResponseDto updateDiagnostic(ClaimDiagnosticRequest request) {
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Check if user is assigned technician or has permission to modify
        if (claim.getAssignedTechnician() != null &&
            !claim.getAssignedTechnician().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You are not assigned to this claim");
        }

        // Check if claim is in modifiable state
        validateClaimModifiable(claim);

        // Update diagnostic information
        if (request.getDiagnosticSummary() != null) {
            claim.setInitialDiagnosis(request.getDiagnosticSummary());
        }

        // Assign technician if not already assigned
        if (claim.getAssignedTechnician() == null) {
            claim.setAssignedTechnician(currentUser);
        }

        // Update status to IN_PROGRESS if still OPEN
        if ("OPEN".equals(claim.getStatus().getCode())) {
            ClaimStatus inProgressStatus = claimStatusRepository.findByCode("IN_PROGRESS")
                    .orElseThrow(() -> new NotFoundException("Status IN_PROGRESS not found"));
            claim.setStatus(inProgressStatus);
            createStatusHistory(claim, inProgressStatus, currentUser,
                    "Technician started diagnostic process");
        }

        claim = claimRepository.save(claim);

        // If marked as ready for submission, update status
        if (Boolean.TRUE.equals(request.getReadyForSubmission())) {
            return markReadyForSubmission(claim.getId());
        }

        return mapToResponseDto(claim);
    }

    /**
     * Mark claim as ready for EVM submission
     */
    @Transactional
    @PreAuthorize("hasRole('SC_TECHNICIAN') or hasRole('SC_STAFF')")
    public ClaimResponseDto markReadyForSubmission(Integer claimId) {
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Validate submission requirements
        ClaimValidationResult validation = validateForSubmission(claim);
        if (!validation.getCanSubmit()) {
            throw new ValidationException("Claim cannot be submitted: " +
                    String.join(", ", validation.getMissingRequirements()));
        }

        // Update status to PENDING_APPROVAL
        ClaimStatus pendingStatus = claimStatusRepository.findByCode("PENDING_APPROVAL")
                .orElseThrow(() -> new NotFoundException("Status PENDING_APPROVAL not found"));

        claim.setStatus(pendingStatus);
        claim = claimRepository.save(claim);

        createStatusHistory(claim, pendingStatus, currentUser,
                "Claim marked ready for EVM submission");

        return mapToResponseDto(claim);
    }

    /**
     * Submit claim to EVM (simulated)
     */
    @Transactional
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN')")
    public ClaimResponseDto submitToEvm(ClaimSubmissionRequest request) {
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Validate submission requirements unless force submit
        if (!Boolean.TRUE.equals(request.getForceSubmit())) {
            ClaimValidationResult validation = validateForSubmission(claim);
            if (!validation.getCanSubmit()) {
                throw new ValidationException("Claim cannot be submitted: " +
                        String.join(", ", validation.getMissingRequirements()));
            }
        }

        // Check current status allows submission
        String currentStatus = claim.getStatus().getCode();
        if (!"PENDING_APPROVAL".equals(currentStatus) && !"IN_PROGRESS".equals(currentStatus)) {
            throw new BadRequestException("Claim cannot be submitted in current status: " + currentStatus);
        }

        // Simulate EVM submission (in real implementation, this would call EVM API)
        // For now, we'll mark it as submitted and pending EVM response
        ClaimStatus submittedStatus = claimStatusRepository.findByCode("PENDING_APPROVAL")
                .orElseThrow(() -> new NotFoundException("Status PENDING_APPROVAL not found"));

        claim.setStatus(submittedStatus);
        claim = claimRepository.save(claim);

        String note = "Claim submitted to EVM";
        if (request.getSubmissionNotes() != null) {
            note += " - " + request.getSubmissionNotes();
        }

        createStatusHistory(claim, submittedStatus, currentUser, note);

        return mapToResponseDto(claim);
    }

    /**
     * Validate claim for EVM submission
     */
    public ClaimValidationResult validateForSubmission(Claim claim) {
        ClaimValidationResult result = new ClaimValidationResult(true);

        // Required fields validation
        if (claim.getVehicle() == null || claim.getVehicle().getVin() == null) {
            result.getMissingRequirements().add("Valid VIN required");
        }

        if (claim.getCustomer() == null ||
            (claim.getCustomer().getPhone() == null && claim.getCustomer().getEmail() == null)) {
            result.getMissingRequirements().add("Customer phone or email required");
        }

        if (claim.getReportedFailure() == null || claim.getReportedFailure().length() < 10) {
            result.getMissingRequirements().add("Detailed fault description required (min 10 characters)");
        }

        // Check for diagnostic data OR attachments OR initial diagnosis
        boolean hasDiagnosticInfo = claim.getInitialDiagnosis() != null &&
                                  claim.getInitialDiagnosis().length() > 10;

        List<ClaimAttachment> attachments = claimAttachmentRepository.findByClaimIdOrderByUploadedAtDesc(claim.getId());
        boolean hasAttachments = !attachments.isEmpty();

        if (!hasDiagnosticInfo && !hasAttachments) {
            result.getMissingRequirements().add("Diagnostic information or attachments required");
        }

        // Set final result
        result.setCanSubmit(result.getMissingRequirements().isEmpty());

        return result;
    }

    /**
     * Get claim by ID with full details
     */
    public ClaimResponseDto getClaimById(Integer claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));
        return mapToResponseDto(claim);
    }

    /**
     * Get claims by various filters
     */
    public List<ClaimResponseDto> getClaimsByTechnician(Integer technicianId) {
        return claimRepository.findActiveTechnicianClaims(technicianId).stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    public List<ClaimResponseDto> getClaimsByStatus(String statusCode) {
        return claimRepository.findByStatusCode(statusCode).stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    public List<ClaimResponseDto> getPendingApprovalClaims() {
        return claimRepository.findClaimsPendingApproval().stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    // Helper methods

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }

    private Customer findOrCreateCustomer(ClaimIntakeRequest request, User createdBy) {
        // Try to find existing customer by phone or email
        if (request.getCustomerPhone() != null) {
            List<Customer> existingCustomers = customerRepository.findAllByPhone(request.getCustomerPhone());
            if (!existingCustomers.isEmpty()) {
                return existingCustomers.getFirst();
            }
        }

        // Create new customer
        return customerRepository.save(Customer.builder()
                .name(request.getCustomerName())
                .phone(request.getCustomerPhone())
                .email(request.getCustomerEmail())
                .address(request.getCustomerAddress())
                .createdBy(createdBy)
                .build());
    }

    private String generateClaimNumber() {
        String prefix = "CLM-" + java.time.LocalDate.now().getYear() + "-";
        String suffix = String.format("%06d", System.currentTimeMillis() % 1000000);
        return prefix + suffix;
    }

    private void createStatusHistory(Claim claim, ClaimStatus status, User changedBy, String note) {
        ClaimStatusHistory history = ClaimStatusHistory.builder()
                .claim(claim)
                .status(status)
                .changedBy(changedBy)
                .note(note)
                .build();
        claimStatusHistoryRepository.save(history);
    }

    private void validateClaimModifiable(Claim claim) {
        String statusCode = claim.getStatus().getCode();
        List<String> modifiableStatuses = List.of("OPEN", "IN_PROGRESS", "PENDING_PARTS");

        if (!modifiableStatuses.contains(statusCode)) {
            throw new BadRequestException("Claim cannot be modified in status: " + statusCode);
        }
    }

    private ClaimResponseDto mapToResponseDto(Claim claim) {
        ClaimResponseDto dto = new ClaimResponseDto();
        dto.setId(claim.getId());
        dto.setClaimNumber(claim.getClaimNumber());
        dto.setStatus(claim.getStatus().getCode());
        dto.setStatusLabel(claim.getStatus().getLabel());
        dto.setReportedFailure(claim.getReportedFailure());
        dto.setInitialDiagnosis(claim.getInitialDiagnosis());
        dto.setCreatedAt(claim.getCreatedAt());
        dto.setApprovedAt(claim.getApprovedAt());
        dto.setWarrantyCost(claim.getWarrantyCost());

        // Map customer
        CustomerInfoDto customerDto = new CustomerInfoDto();
        customerDto.setId(claim.getCustomer().getId());
        customerDto.setName(claim.getCustomer().getName());
        customerDto.setPhone(claim.getCustomer().getPhone());
        customerDto.setEmail(claim.getCustomer().getEmail());
        customerDto.setAddress(claim.getCustomer().getAddress());
        dto.setCustomer(customerDto);

        // Map vehicle
        VehicleInfoDto vehicleDto = new VehicleInfoDto();
        vehicleDto.setId(claim.getVehicle().getId());
        vehicleDto.setVin(claim.getVehicle().getVin());
        vehicleDto.setModel(claim.getVehicle().getModel());
        vehicleDto.setYear(claim.getVehicle().getYear());
        dto.setVehicle(vehicleDto);

        // Map users
        dto.setCreatedBy(mapUserToDto(claim.getCreatedBy()));
        if (claim.getAssignedTechnician() != null) {
            dto.setAssignedTechnician(mapUserToDto(claim.getAssignedTechnician()));
        }
        if (claim.getApprovedBy() != null) {
            dto.setApprovedBy(mapUserToDto(claim.getApprovedBy()));
        }

        // Get attachments and status history
        dto.setAttachments(mapAttachments(claim.getId()));
        dto.setStatusHistory(mapStatusHistory(claim.getId()));

        // Add validation info
        ClaimValidationResult validation = validateForSubmission(claim);
        dto.setCanSubmitToEvm(validation.getCanSubmit());
        dto.setMissingRequirements(validation.getMissingRequirements());

        return dto;
    }

    private UserInfoDto mapUserToDto(User user) {
        if (user == null) return null;

        UserInfoDto dto = new UserInfoDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        dto.setRoleName(user.getRole().getName());
        return dto;
    }

    private List<ClaimAttachmentDto> mapAttachments(Integer claimId) {
        return claimAttachmentRepository.findByClaimIdOrderByUploadedAtDesc(claimId)
                .stream()
                .map(attachment -> {
                    ClaimAttachmentDto dto = new ClaimAttachmentDto();
                    dto.setId(attachment.getId());
                    dto.setFilePath(attachment.getFilePath());
                    dto.setFileType(attachment.getFileType());
                    dto.setUploadedAt(attachment.getUploadedAt());
                    dto.setUploadedBy(mapUserToDto(attachment.getUploadedBy()));
                    return dto;
                })
                .toList();
    }

    private List<ClaimStatusHistoryDto> mapStatusHistory(Integer claimId) {
        return claimStatusHistoryRepository.findByClaimIdOrderByChangedAtDesc(claimId)
                .stream()
                .map(history -> {
                    ClaimStatusHistoryDto dto = new ClaimStatusHistoryDto();
                    dto.setId(history.getId());
                    dto.setStatusCode(history.getStatus().getCode());
                    dto.setStatusLabel(history.getStatus().getLabel());
                    dto.setChangedAt(history.getChangedAt());
                    dto.setChangedBy(mapUserToDto(history.getChangedBy()));
                    dto.setNote(history.getNote());
                    return dto;
                })
                .toList();
    }
}
