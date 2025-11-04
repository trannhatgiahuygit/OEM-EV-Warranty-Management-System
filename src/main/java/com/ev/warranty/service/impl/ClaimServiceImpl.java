package com.ev.warranty.service.impl;

import com.ev.warranty.exception.BadRequestException;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.mapper.ClaimMapper;
import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import com.ev.warranty.service.inter.ClaimService;
import com.ev.warranty.service.inter.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClaimServiceImpl implements ClaimService {

    // Dependencies
    private final ClaimRepository claimRepository;
    private final ClaimStatusRepository claimStatusRepository;
    private final ClaimStatusHistoryRepository claimStatusHistoryRepository;
    private final ClaimAttachmentRepository claimAttachmentRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ClaimMapper claimMapper; // 🔧 Use mapper instead of manual mapping
    private final WorkOrderPartRepository workOrderPartRepository;
    private final ClaimItemRepository claimItemRepository;
    private final InventoryRepository inventoryRepository;
    private final NotificationService notificationService;

    // ==================== CLAIM CREATION ====================

    @Transactional
    public ClaimResponseDto createClaimIntake(ClaimIntakeRequest request) {
        User currentUser = getCurrentUser();

        // Find or create customer
        Customer customer = findOrCreateCustomer(request, currentUser);

        // Find vehicle by VIN
        Vehicle vehicle = vehicleRepository.findByVin(request.getVin())
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + request.getVin()));

        // Cập nhật số mile cho vehicle nếu có
        if (request.getMileageKm() != null) {
            vehicle.setMileageKm(request.getMileageKm());
        }

        // Create claim using mapper
        Claim claim = claimMapper.toEntity(request);

        // Set additional fields
        claim.setClaimNumber(generateClaimNumber());

        // Set status based on flow
        String statusCode = determineInitialStatus(request.getFlow());
        ClaimStatus initialStatus = claimStatusRepository.findByCode(statusCode)
                .orElseThrow(() -> new NotFoundException("Status " + statusCode + " not found"));

        // Use mapper to set relationships
        claimMapper.setRelationships(claim, customer, vehicle, currentUser, initialStatus);

        // Assign technician if provided
        if (request.getAssignedTechnicianId() != null) {
            User technician = findAndValidateTechnician(request.getAssignedTechnicianId());
            claimMapper.assignTechnician(claim, technician);
        }

        claim = claimRepository.save(claim);

        // Create status history
        createStatusHistory(claim, initialStatus, currentUser,
                "Claim created via " + statusCode.toLowerCase() + " process");

        return claimMapper.toResponseDto(claim);
    }

    @Transactional
    public ClaimResponseDto saveDraftClaim(ClaimIntakeRequest request) {
        request.setFlow("DRAFT");
        return createClaimIntake(request);
    }

    // ==================== DIAGNOSTIC UPDATES ====================

    @Transactional
    public ClaimResponseDto updateDiagnostic(ClaimDiagnosticRequest request) {
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Authorization check
        validateUserCanModifyClaim(currentUser, claim);

        // Status validation
        validateClaimModifiable(claim);

        // Update diagnostic using mapper
        claimMapper.updateEntityFromDiagnosticRequest(claim, request);

        // Auto-assign technician if needed
        if (claim.getAssignedTechnician() == null && "SC_TECHNICIAN".equals(currentUser.getRole().getRoleName())) {
            claimMapper.assignTechnician(claim, currentUser);
        }

        // Auto-progress status if needed
        autoProgressClaimStatus(claim, currentUser);

        claim = claimRepository.save(claim);

        // Handle ready for submission
        if (Boolean.TRUE.equals(request.getReadyForSubmission())) {
            return markReadyForSubmission(claim.getId());
        }

        return claimMapper.toResponseDto(claim);
    }

    // ==================== STATUS MANAGEMENT ====================

    /**
     * 🆕 NEW METHOD - Manual status update to fix workflow issues
     */
    @Transactional
    public ClaimResponseDto updateClaimStatus(Integer claimId, String statusCode) {
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Validate user can update status
        validateUserCanModifyStatus(currentUser, claim);

        // Find new status
        ClaimStatus newStatus = claimStatusRepository.findByCode(statusCode)
                .orElseThrow(() -> new NotFoundException("Status not found: " + statusCode));

        // Validate status transition
        validateStatusTransition(claim.getStatus().getCode(), statusCode);

        // Update status
        ClaimStatus oldStatus = claim.getStatus();
        claim.setStatus(newStatus);
        claim = claimRepository.save(claim);

        // Create status history
        createStatusHistory(claim, newStatus, currentUser,
                String.format("Status updated from %s to %s", oldStatus.getCode(), statusCode));

        return claimMapper.toResponseDto(claim);
    }

    @Transactional
    public ClaimResponseDto markReadyForSubmission(Integer claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Validate submission requirements
        ClaimValidationResult validation = validateForSubmission(claim);
        if (!validation.getCanSubmit()) {
            throw new ValidationException("Claim cannot be submitted: " +
                    String.join(", ", validation.getMissingRequirements()));
        }

        // Update status to PENDING_APPROVAL
        updateClaimStatus(claimId, "PENDING_APPROVAL");

        // 🔧 SIMPLE FIX: Get fresh claim and return with validation
        Claim updatedClaim = claimRepository.findById(claimId).get();
        ClaimResponseDto response = claimMapper.toResponseDto(updatedClaim);

        // Since validation passed, set to true
        response.setCanSubmitToEvm(true);
        response.setMissingRequirements(List.of());

        return response;
    }

    // ==================== COMPLETION FLOW ====================

    @Transactional
    public ClaimResponseDto completeRepair(Integer claimId, ClaimRepairCompletionRequest request) {
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Validate current status - auto-progress if needed
        autoProgressToValidStatus(claim, Set.of("IN_PROGRESS", "PENDING_PARTS", "REPAIR_IN_PROGRESS"), currentUser);

        // Enforce S/N capture: if claim has WARRANTY PART items, ensure at least one used part is recorded
        List<ClaimItem> warrantyParts = claimItemRepository.findWarrantyPartsByClaimId(claimId);
        if (!warrantyParts.isEmpty()) {
            List<WorkOrderPart> usedParts = workOrderPartRepository.findByClaimId(claimId);
            if (usedParts == null || usedParts.isEmpty()) {
                throw new ValidationException("Vui lòng scan và ghi nhận S/N phụ tùng thay thế trước khi hoàn tất sửa chữa");
            }
        }

        // Update status to FINAL_INSPECTION (per workflow: repair -> final inspect)
        ClaimStatus repairCompletedStatus = claimStatusRepository.findByCode("FINAL_INSPECTION")
                .orElseThrow(() -> new NotFoundException("Status FINAL_INSPECTION not found"));

        claim.setStatus(repairCompletedStatus);
        claim = claimRepository.save(claim);

        createStatusHistory(claim, repairCompletedStatus, currentUser,
                "Repair work completed - awaiting final inspection. " + (request.getRepairSummary() != null ? request.getRepairSummary() : ""));

        return claimMapper.toResponseDto(claim);
    }

    @Transactional
    public ClaimResponseDto handoverVehicle(Integer claimId, VehicleHandoverRequest request) {
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Auto-progress to READY_FOR_HANDOVER if needed
        autoProgressToValidStatus(claim, Set.of("READY_FOR_HANDOVER"), currentUser);

        // Update status to COMPLETED
        return updateClaimStatus(claimId, "COMPLETED");
    }

    @Transactional
    public ClaimResponseDto closeClaim(Integer claimId, ClaimClosureRequest request) {
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Auto-progress to COMPLETED if needed
        autoProgressToValidStatus(claim, Set.of("COMPLETED"), currentUser);

        // Adjust inventory based on used parts (consume reserved, decrease stock) - default warehouse 1
        adjustInventoryForClaimUsedParts(claimId);

        // Update status to CLOSED
        return updateClaimStatus(claimId, "CLOSED");
    }

    // ==================== QUERY METHODS ====================

    public ClaimResponseDto getClaimById(Integer claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        ClaimResponseDto dto = claimMapper.toResponseDto(claim);

        // Add validation info
        ClaimValidationResult validation = validateForSubmission(claim);
        dto.setCanSubmitToEvm(validation.getCanSubmit());
        dto.setMissingRequirements(validation.getMissingRequirements());

        return dto;
    }

    /**
     * 🆕 NEW METHOD - Get claim summary
     */
    public ClaimSummaryDto getClaimSummary(Integer claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));
        return claimMapper.toSummaryDto(claim);
    }

    /**
     * 🆕 NEW METHOD - Customer notification
     */
    public String notifyCustomer(Integer claimId, CustomerNotificationRequest request) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        User currentUser = getCurrentUser();
        notificationService.sendClaimCustomerNotification(claim, request, currentUser.getUsername());

        createStatusHistory(claim, claim.getStatus(), currentUser,
                "Customer notified: " + request.getNotificationType());

        return String.format("Customer %s notified via %s for claim %s",
                claim.getCustomer().getName(), String.join(", ", request.getChannels()), claim.getClaimNumber());
    }

    public List<ClaimResponseDto> getClaimsByTechnician(Integer technicianId) {
        return claimRepository.findActiveTechnicianClaims(technicianId).stream()
                .map(claimMapper::toResponseDto)
                .toList();
    }

    public List<ClaimResponseDto> getClaimsByStatus(String statusCode) {
        return claimRepository.findByStatusCode(statusCode).stream()
                .map(claimMapper::toResponseDto)
                .toList();
    }

    @Override
    public List<ClaimResponseDto> getAllClaims() {
        List<Claim> claims = claimRepository.findAll();
        return claims.stream()
                .map(claimMapper::toResponseDto)
                .toList();
    }

    // ==================== VALIDATION & HELPER METHODS ====================

    /**
     * Enhanced validation with auto-progression support
     */
    private void validateUserCanModifyClaim(User currentUser, Claim claim) {
        String userRole = currentUser.getRole().getRoleName();

        System.out.println("🔍 Debug Info:");
        System.out.println("  Current User ID: " + currentUser.getId() + " (" + currentUser.getUsername() + ")");
        System.out.println("  Assigned Technician: " + (claim.getAssignedTechnician() != null ?
                claim.getAssignedTechnician().getId() + " (" + claim.getAssignedTechnician().getUsername() + ")" : "null"));

        boolean canModify = false;

        if ("SC_STAFF".equals(userRole) || "ADMIN".equals(userRole)) {
            canModify = true;
            System.out.println("  ✅ User is SC_STAFF/ADMIN, can modify any claim");
        } else if (claim.getAssignedTechnician() == null && "SC_TECHNICIAN".equals(userRole)) {
            canModify = true;
            System.out.println("  ✅ No technician assigned, SC_TECHNICIAN can take it");
        } else if (claim.getAssignedTechnician() != null &&
                claim.getAssignedTechnician().getId().equals(currentUser.getId())) {
            canModify = true;
            System.out.println("  ✅ User is assigned technician");
        } else {
            System.out.println("  ❌ User cannot modify this claim");
        }

        if (!canModify) {
            throw new BadRequestException("You are not authorized to modify this claim. " +
                    "Current user: " + currentUser.getUsername() + " (ID: " + currentUser.getId() + "), " +
                    "Assigned technician: " + (claim.getAssignedTechnician() != null ?
                    claim.getAssignedTechnician().getUsername() + " (ID: " + claim.getAssignedTechnician().getId() + ")" : "none"));
        }
    }

    private void validateUserCanModifyStatus(User currentUser, Claim claim) {
        String userRole = currentUser.getRole().getRoleName();
        // SC_STAFF and ADMIN can always update status
        if ("SC_STAFF".equals(userRole) || "ADMIN".equals(userRole)) {
            return;
        }
        // Allow SC_TECHNICIAN to update status if they are the assigned technician
        if ("SC_TECHNICIAN".equals(userRole)) {
            boolean noTechnicianAssigned = claim.getAssignedTechnician() == null;
            boolean isAssignedTechnician = !noTechnicianAssigned &&
                    currentUser.getId().equals(claim.getAssignedTechnician().getId());
            if (noTechnicianAssigned || isAssignedTechnician) {
                return;
            }
        }
        throw new BadRequestException("Only SC_STAFF, ADMIN, or the assigned SC_TECHNICIAN can update claim status");
    }

    /**
     * 🔧 Enhanced validateClaimModifiable with auto-progression
     */
    private void validateClaimModifiable(Claim claim) {
        String statusCode = claim.getStatus().getCode();

        Set<String> allowedStatuses = Set.of(
                "DRAFT", "OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING_PARTS", "WAITING_FOR_PARTS",
                "READY_FOR_REPAIR", "REPAIR_IN_PROGRESS"
        );

        if (!allowedStatuses.contains(statusCode)) {
            throw new BadRequestException(
                    "Claim cannot be modified in status: " + statusCode);
        }
    }

    /**
     * 🆕 Status transition validation
     */
    private void validateStatusTransition(String fromStatus, String toStatus) {
        // Define valid transitions (simplified - in real app this would be more complex)
        // For now, we'll allow most transitions for flexibility
        Set<String> restrictedTransitions = Set.of(
                "CLOSED->DRAFT", "CLOSED->OPEN", "CLOSED->IN_PROGRESS"
        );

        String transition = fromStatus + "->" + toStatus;
        if (restrictedTransitions.contains(transition)) {
            throw new BadRequestException("Invalid status transition: " + transition);
        }
    }

    /**
     * 🆕 Auto-progress claim to valid status for operations
     */
    private void autoProgressToValidStatus(Claim claim, Set<String> validStatuses, User currentUser) {
        String currentStatus = claim.getStatus().getCode();

        if (!validStatuses.contains(currentStatus)) {
            // Auto-progress based on current status
            String targetStatus = determineTargetStatus(currentStatus, validStatuses);
            if (targetStatus != null) {
                ClaimStatus newStatus = claimStatusRepository.findByCode(targetStatus)
                        .orElseThrow(() -> new NotFoundException("Status " + targetStatus + " not found"));

                claim.setStatus(newStatus);
                claimRepository.save(claim);

                createStatusHistory(claim, newStatus, currentUser,
                        "Auto-progressed from " + currentStatus + " to " + targetStatus);
            } else {
                throw new BadRequestException("Cannot auto-progress from status: " + currentStatus);
            }
        }
    }

    private String determineTargetStatus(String currentStatus, Set<String> validStatuses) {
        // Simple progression logic - can be enhanced
        return switch (currentStatus) {
            case "DRAFT", "OPEN", "ASSIGNED" -> validStatuses.contains("IN_PROGRESS") ? "IN_PROGRESS" : null;
            case "READY_FOR_REPAIR" -> validStatuses.contains("REPAIR_IN_PROGRESS") ? "REPAIR_IN_PROGRESS" : null;
            case "REPAIR_IN_PROGRESS" -> validStatuses.contains("FINAL_INSPECTION") ? "FINAL_INSPECTION" : null;
            case "FINAL_INSPECTION", "REPAIR_COMPLETED" -> validStatuses.contains("READY_FOR_HANDOVER") ? "READY_FOR_HANDOVER" : null;
            case "READY_FOR_HANDOVER" -> validStatuses.contains("COMPLETED") ? "COMPLETED" : null;
            default -> validStatuses.contains(currentStatus) ? currentStatus : null;
        };
    }

    private void autoProgressClaimStatus(Claim claim, User currentUser) {
        String currentStatus = claim.getStatus().getCode();

        if ("DRAFT".equals(currentStatus) || "OPEN".equals(currentStatus)) {
            ClaimStatus inProgressStatus = claimStatusRepository.findByCode("IN_PROGRESS")
                    .orElse(null);
            if (inProgressStatus != null) {
                claim.setStatus(inProgressStatus);
                createStatusHistory(claim, inProgressStatus, currentUser,
                        "Auto-progressed to IN_PROGRESS during diagnostic update");
            }
        }
    }

    // ==================== EXISTING HELPER METHODS ====================

    private String determineInitialStatus(String flow) {
        if (flow != null) {
            return switch (flow.toUpperCase()) {
                case "DRAFT" -> "DRAFT";
                case "INTAKE" -> "OPEN";
                default -> "OPEN";
            };
        }
        return "OPEN";
    }

    private User findAndValidateTechnician(Integer technicianId) {
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new NotFoundException("Technician not found"));

        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
            throw new BadRequestException("Assigned user is not a technician");
        }
        return technician;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }

    private Customer findOrCreateCustomer(ClaimIntakeRequest request, User createdBy) {
        if (request.getCustomerPhone() != null) {
            List<Customer> existingCustomers = customerRepository.findAllByPhone(request.getCustomerPhone());
            if (!existingCustomers.isEmpty()) {
                return existingCustomers.getFirst();
            }
        }

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

    private void adjustInventoryForClaimUsedParts(Integer claimId) {
        List<WorkOrderPart> usedParts = workOrderPartRepository.findByClaimId(claimId);
        if (usedParts == null || usedParts.isEmpty()) return;

        // Aggregate quantities by part id
        java.util.Map<Integer, Integer> usedByPartId = new java.util.HashMap<>();
        for (WorkOrderPart wop : usedParts) {
            if (wop.getPart() == null) continue;
            Integer partId = wop.getPart().getId();
            usedByPartId.merge(partId, wop.getQuantity() != null ? wop.getQuantity() : 1, Integer::sum);
        }

        // Apply to inventory at default warehouse (id=1)
        for (var entry : usedByPartId.entrySet()) {
            Integer partId = entry.getKey();
            Integer qtyUsed = entry.getValue();
            var optInv = inventoryRepository.findByPartIdAndWarehouseId(partId, 1);
            if (optInv.isEmpty()) continue;
            var inv = optInv.get();
            int reserved = inv.getReservedStock() != null ? inv.getReservedStock() : 0;
            int current = inv.getCurrentStock() != null ? inv.getCurrentStock() : 0;
            int consumeFromReserved = Math.min(reserved, qtyUsed);
            inv.setReservedStock(reserved - consumeFromReserved);
            inv.setCurrentStock(Math.max(current - qtyUsed, 0));
            inventoryRepository.save(inv);
        }
    }

    

    private void autoClassifyCostTypes(Claim claim) {
        try {
            List<ClaimItem> items = claimItemRepository.findByClaimId(claim.getId());
            if (items == null || items.isEmpty()) return;

            boolean vehicleInWarranty = false;
            if (claim.getVehicle() != null && claim.getVehicle().getWarrantyEnd() != null && claim.getCreatedAt() != null) {
                java.time.LocalDate end = claim.getVehicle().getWarrantyEnd();
                java.time.LocalDate created = claim.getCreatedAt().toLocalDate();
                vehicleInWarranty = !created.isAfter(end);
            }

            for (ClaimItem item : items) {
                boolean isProposed = item.getStatus() == null || "PROPOSED".equalsIgnoreCase(item.getStatus());
                if ((item.getCostType() == null || item.getCostType().isBlank()) || isProposed) {
                    item.setCostType(vehicleInWarranty ? "WARRANTY" : "SERVICE");
                }
            }
            claimItemRepository.saveAll(items);
        } catch (Exception ignored) {
        }
    }

    // ==================== OTHER EXISTING METHODS ====================
    // Keep all other existing methods (validateForSubmission, submitToEvm, etc.)
    // but replace mapToResponseDto calls with claimMapper.toResponseDto

    public ClaimValidationResult validateForSubmission(Claim claim) {
        ClaimValidationResult result = new ClaimValidationResult(true);

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

        boolean hasDiagnosticInfo = claim.getInitialDiagnosis() != null &&
                claim.getInitialDiagnosis().length() > 10;

        List<ClaimAttachment> attachments = claimAttachmentRepository.findByClaimIdOrderByUploadDateDesc(claim.getId());
        boolean hasAttachments = !attachments.isEmpty();

        if (!hasDiagnosticInfo && !hasAttachments) {
            result.getMissingRequirements().add("Diagnostic information or attachments required");
        }

        result.setCanSubmit(result.getMissingRequirements().isEmpty());
        return result;
    }

    @Transactional
    public ClaimResponseDto submitToEvm(ClaimSubmissionRequest request) {
        Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        if (!Boolean.TRUE.equals(request.getForceSubmit())) {
            ClaimValidationResult validation = validateForSubmission(claim);
            if (!validation.getCanSubmit()) {
                throw new ValidationException("Claim cannot be submitted: " +
                        String.join(", ", validation.getMissingRequirements()));
            }
        }

        // Auto-classify cost types for proposed items before submission
        autoClassifyCostTypes(claim);

        return updateClaimStatus(claim.getId(), "PENDING_EVM_APPROVAL");
    }

    // Continue with all other existing methods...
    // Just replace mapToResponseDto with claimMapper.toResponseDto

    public List<ClaimResponseDto> getPendingApprovalClaims() {
        return claimRepository.findClaimsPendingApproval().stream()
                .map(claimMapper::toResponseDto)
                .toList();
    }

    public ClaimCompletionStatusDTO getCompletionStatus(Integer claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        ClaimCompletionStatusDTO status = new ClaimCompletionStatusDTO();
        status.setClaimId(claim.getId());
        status.setClaimNumber(claim.getClaimNumber());
        status.setCurrentStatus(claim.getStatus().getCode());

        String statusCode = claim.getStatus().getCode();
        switch (statusCode) {
            case "READY_FOR_REPAIR" -> status.setNextStep("Assign technician and start repair");
            case "REPAIR_IN_PROGRESS", "IN_PROGRESS", "PENDING_PARTS", "WAITING_FOR_PARTS" -> status.setNextStep("Complete repair work");
            case "FINAL_INSPECTION", "REPAIR_COMPLETED" -> status.setNextStep("Perform final inspection");
            case "READY_FOR_HANDOVER" -> status.setNextStep("Hand over vehicle to customer");
            case "COMPLETED" -> status.setNextStep("Close claim");
            case "CLOSED" -> status.setNextStep("No further action required");
            default -> status.setNextStep("Continue processing claim");
        }

        status.setRepairCompleted("FINAL_INSPECTION".equals(statusCode) ||
                "REPAIR_COMPLETED".equals(statusCode) ||
                "READY_FOR_HANDOVER".equals(statusCode) ||
                "COMPLETED".equals(statusCode) ||
                "CLOSED".equals(statusCode));
        status.setInspectionPassed("FINAL_INSPECTION".equals(statusCode) ||
                "READY_FOR_HANDOVER".equals(statusCode) ||
                "COMPLETED".equals(statusCode) ||
                "CLOSED".equals(statusCode));
        status.setReadyForHandover("READY_FOR_HANDOVER".equals(statusCode));
        status.setVehicleHandedOver("COMPLETED".equals(statusCode) || "CLOSED".equals(statusCode));
        status.setClaimClosed("CLOSED".equals(statusCode));

        int completionPercentage = 0;
        if (status.getRepairCompleted()) completionPercentage += 25;
        if (status.getInspectionPassed()) completionPercentage += 25;
        if (status.getVehicleHandedOver()) completionPercentage += 25;
        if (status.getClaimClosed()) completionPercentage += 25;
        status.setCompletionPercentage(completionPercentage);

        return status;
    }

    public List<ClaimResponseDto> getClaimsReadyForHandover() {
        return claimRepository.findByStatusCode("READY_FOR_HANDOVER").stream()
                .map(claimMapper::toResponseDto)
                .toList();
    }

    @Transactional
    public ClaimResponseDto performFinalInspection(Integer claimId, ClaimInspectionRequest request) {
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Auto-progress if needed
        autoProgressToValidStatus(claim, Set.of("FINAL_INSPECTION"), currentUser);

        String targetStatus = Boolean.TRUE.equals(request.getInspectionPassed()) ?
                "READY_FOR_HANDOVER" : "IN_PROGRESS";

        return updateClaimStatus(claimId, targetStatus);
    }

    @Transactional
    public ClaimResponseDto convertDraftToIntake(Integer claimId, ClaimIntakeRequest updateRequest) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // 🔧 FIX: Force load lazy relationships
        if (claim.getCustomer() != null) {
            claim.getCustomer().getName(); // Trigger lazy load
        }
        if (claim.getVehicle() != null) {
            claim.getVehicle().getVin(); // Trigger lazy load
        }

        if (!"DRAFT".equalsIgnoreCase(claim.getStatus().getCode())) {
            throw new BadRequestException("Chỉ chuyển được claim ở trạng thái DRAFT");
        }

        // Update using request if provided
        if (updateRequest != null) {
            updateClaimFromRequest(claim, updateRequest);
        }

        // Validate required fields
        validateRequiredFieldsForIntake(claim);

        // Convert to INTAKE/OPEN status
        log.info("Converting draft claim {} to OPEN status", claimId);
        return updateClaimStatus(claimId, "OPEN");
    }

    @Override
    @Transactional
    public ClaimResponseDto convertDraftToIntake(Integer claimId) {
        // Gọi sang method đã có, không cập nhật dữ liệu
        return convertDraftToIntake(claimId, null);
    }

    private void updateClaimFromRequest(Claim claim, ClaimIntakeRequest request) {
        // 🔧 FIX: Add null checks to prevent NPE
        if (request.getCustomerName() != null && claim.getCustomer() != null) {
            claim.getCustomer().setName(request.getCustomerName());
        }
        if (request.getCustomerPhone() != null && claim.getCustomer() != null) {
            claim.getCustomer().setPhone(request.getCustomerPhone());
        }
        if (request.getCustomerEmail() != null && claim.getCustomer() != null) {
            claim.getCustomer().setEmail(request.getCustomerEmail());
        }
        if (request.getCustomerAddress() != null && claim.getCustomer() != null) {
            claim.getCustomer().setAddress(request.getCustomerAddress());
        }
        if (request.getVin() != null && claim.getVehicle() != null) {
            claim.getVehicle().setVin(request.getVin());
        }
        if (request.getClaimTitle() != null) {
            claim.setInitialDiagnosis(request.getClaimTitle());
        }
        if (request.getReportedFailure() != null) {
            claim.setReportedFailure(request.getReportedFailure());
        }
    }

    private void validateRequiredFieldsForIntake(Claim claim) {
        StringBuilder missing = new StringBuilder();

        // 🔧 FIX: Add detailed logging and better null checks
        log.info("Validating claim {} for intake conversion", claim.getId());

        // Check customer (might be lazy loaded)
        if (claim.getCustomer() == null) {
            log.error("Customer is null for claim {}", claim.getId());
            missing.append("customer entity, ");
        } else if (claim.getCustomer().getName() == null || claim.getCustomer().getName().isBlank()) {
            log.error("Customer name is blank for claim {}", claim.getId());
            missing.append("customerName, ");
        }

        // Check vehicle (might be lazy loaded)
        if (claim.getVehicle() == null) {
            log.error("Vehicle is null for claim {}", claim.getId());
            missing.append("vehicle entity, ");
        } else if (claim.getVehicle().getVin() == null || claim.getVehicle().getVin().isBlank()) {
            log.error("VIN is blank for claim {}", claim.getId());
            missing.append("vin, ");
        }

        // Check claim fields
        if (claim.getInitialDiagnosis() == null || claim.getInitialDiagnosis().isBlank()) {
            log.error("Initial diagnosis is blank for claim {}", claim.getId());
            missing.append("claimTitle, ");
        }

        if (claim.getReportedFailure() == null || claim.getReportedFailure().length() < 10) {
            log.error("Reported failure is too short for claim {}: '{}'",
                     claim.getId(), claim.getReportedFailure());
            missing.append("reportedFailure (min 10 ký tự), ");
        }

        if (missing.length() > 0) {
            String errorMsg = "Thiếu thông tin bắt buộc: " + missing.substring(0, missing.length()-2);
            log.error("Validation failed for claim {}: {}", claim.getId(), errorMsg);
            throw new ValidationException(errorMsg);
        }

        log.info("Validation passed for claim {}", claim.getId());
    }

    @Override
    @Transactional
    public ClaimResponseDto updateDraftClaim(Integer claimId, ClaimIntakeRequest request) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found with id: " + claimId));
        if (claim.getStatus() == null || !"DRAFT".equals(claim.getStatus().getCode())) {
            throw new BadRequestException("Chỉ được phép chỉnh sửa khi claim ở trạng thái DRAFT");
        }
        claimMapper.updateEntityFromIntakeRequest(claim, request, claim.getVehicle());
        claimRepository.save(claim);
        return claimMapper.toResponseDto(claim);
    }

    @Override
    @Transactional
    public void deleteDraftClaim(Integer claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found with id: " + claimId));
        if (claim.getStatus() == null || !"DRAFT".equals(claim.getStatus().getCode())) {
            throw new BadRequestException("Chỉ được phép chỉnh sửa khi claim ở trạng thái DRAFT");
        }
        // Set inactive thay vì xóa hẳn
        claim.setIsActive(false);
        claimRepository.save(claim);
    }

    @Override
    @Transactional
    public ClaimResponseDto activateClaim(Integer claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found with id: " + claimId));
        if (Boolean.TRUE.equals(claim.getIsActive())) {
            throw new BadRequestException("Claim đã active rồi!");
        }
        claim.setIsActive(true);
        claimRepository.save(claim);
        return claimMapper.toResponseDto(claim);
    }
}
