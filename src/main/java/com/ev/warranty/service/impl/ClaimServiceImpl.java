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
    private final WorkOrderRepository workOrderRepository;
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

    private static final int MAX_PROBLEM_REPORTS = 5;
    private static final int MAX_RESUBMIT_COUNT = 1;

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

        // Update diagnostic using mapper (summary, warrantyCost, diagnosticDetails, warranty eligibility)
        claimMapper.updateEntityFromDiagnosticRequest(claim, request);

        // Ensure there is a work order to store tech notes/test results/labor
        List<WorkOrder> workOrders = workOrderRepository.findByClaimId(claim.getId());
        WorkOrder workOrder;
        if (workOrders != null && !workOrders.isEmpty()) {
            workOrder = workOrders.get(workOrders.size() - 1);
        } else {
            User technician = claim.getAssignedTechnician() != null ? claim.getAssignedTechnician() : currentUser;
            workOrder = WorkOrder.builder()
                    .claim(claim)
                    .technician(technician)
                    .startTime(java.time.LocalDateTime.now())
                    .build();
        }

        // Persist labor hours if provided
        if (request.getLaborHours() != null) {
            workOrder.setLaborHours(request.getLaborHours());
        }
        if (request.getTestResults() != null) {
            workOrder.setTestResults(request.getTestResults());
        }
        if (request.getRepairNotes() != null) {
            workOrder.setRepairNotes(request.getRepairNotes());
        }
        workOrderRepository.save(workOrder);

        // Branch logic based on warranty eligibility
        if (request.getIsWarrantyEligible() != null) {
            if (Boolean.TRUE.equals(request.getIsWarrantyEligible())) {
                // If eligible -> move towards EVM approval
                ClaimStatus pendingEvm = claimStatusRepository.findByCode("PENDING_EVM_APPROVAL")
                        .orElseThrow(() -> new NotFoundException("Status PENDING_EVM_APPROVAL not found"));
                claim.setStatus(pendingEvm);
                createStatusHistory(claim, pendingEvm, currentUser,
                        "Technician marked warranty eligible. Ready for EVM review.");
            } else {
                // Not eligible -> pending customer approval for third-party parts
                ClaimStatus pendingCustomer = claimStatusRepository.findByCode("PENDING_CUSTOMER_APPROVAL")
                        .orElseThrow(() -> new NotFoundException("Status PENDING_CUSTOMER_APPROVAL not found"));
                claim.setStatus(pendingCustomer);
                createStatusHistory(claim, pendingCustomer, currentUser,
                        "Not warranty eligible. Awaiting customer approval for third-party repair.");
                try {
                    // Build and send a standardized customer notification
                    CustomerNotificationRequest notifyReq = CustomerNotificationRequest.builder()
                            .claimId(claim.getId())
                            .notificationType("OUT_OF_WARRANTY_NOTICE")
                            .channels(java.util.List.of("EMAIL"))
                            .message("Claim " + claim.getClaimNumber() + ": Xe không đủ điều kiện bảo hành. Vui lòng xác nhận sửa chữa sử dụng linh kiện bên thứ 3.")
                            .build();
                    notificationService.sendClaimCustomerNotification(claim, notifyReq, currentUser.getUsername());
                } catch (Exception e) {
                    log.warn("Failed to send customer notification: {}", e.getMessage());
                }
            }
        } else {
            // No explicit eligibility provided: auto progress to IN_PROGRESS if early stage
            autoProgressClaimStatus(claim, currentUser);
        }

        claim = claimRepository.save(claim);

        // Handle ready for submission flag (only when eligible)
        if (Boolean.TRUE.equals(request.getReadyForSubmission()) && Boolean.TRUE.equals(claim.getIsWarrantyEligible())) {
            return markReadyForSubmission(claim.getId());
        }

        return claimMapper.toResponseDto(claim);
    }

    // ===== NEW: Customer approval for non-warranty repair =====
    @Transactional
    public ClaimResponseDto handleCustomerApproval(Integer claimId, Boolean approved, String notes) {
        User currentUser = getCurrentUser();
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        if (!"PENDING_CUSTOMER_APPROVAL".equals(claim.getStatus().getCode())) {
            throw new BadRequestException("Claim is not waiting for customer approval");
        }

        if (Boolean.TRUE.equals(approved)) {
            ClaimStatus approvedStatus = claimStatusRepository.findByCode("CUSTOMER_APPROVED_THIRD_PARTY")
                    .orElseThrow(() -> new NotFoundException("Status CUSTOMER_APPROVED_THIRD_PARTY not found"));
            claim.setStatus(approvedStatus);
            createStatusHistory(claim, approvedStatus, currentUser,
                    notes != null ? notes : "Customer approved third-party repair");

            // Move to READY_FOR_REPAIR next
            ClaimStatus ready = claimStatusRepository.findByCode("READY_FOR_REPAIR")
                    .orElseThrow(() -> new NotFoundException("Status READY_FOR_REPAIR not found"));
            claim.setStatus(ready);
            createStatusHistory(claim, ready, currentUser, "Ready to create work order with third-party parts");
        } else {
            ClaimStatus cancelled = claimStatusRepository.findByCode("CANCELLED")
                    .orElseThrow(() -> new NotFoundException("Status CANCELLED not found"));
            claim.setStatus(cancelled);
            createStatusHistory(claim, cancelled, currentUser,
                    notes != null ? notes : "Customer declined third-party repair. Claim cancelled");
        }

        claim = claimRepository.save(claim);
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
            ClaimStatus pendingApprovalStatus = claimStatusRepository.findByCode("PENDING_APPROVAL")
                    .orElse(null);
            if (pendingApprovalStatus != null) {
                claim.setStatus(pendingApprovalStatus);
                createStatusHistory(claim, pendingApprovalStatus, currentUser,
                        "Auto-progressed to PENDING_APPROVAL during diagnostic update");
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

    // ==================== Problem Handling ====================

    @Override
    @Transactional
    public ClaimResponseDto reportProblem(Integer claimId, ProblemReportRequest request) {
        User currentUser = getCurrentUser();
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Authorization
        validateUserCanModifyClaim(currentUser, claim);

        // Status must be EVM_APPROVED or PROBLEM_SOLVED
        String code = claim.getStatus().getCode();
        if (!Set.of("EVM_APPROVED", "PROBLEM_SOLVED", "WAITING_FOR_PARTS", "READY_FOR_REPAIR", "REPAIR_IN_PROGRESS").contains(code)) {
            throw new BadRequestException("Cannot report problem from status: " + code);
        }

        // Limit loops
        long reported = claimStatusHistoryRepository.countByClaimIdAndStatusCode(claimId, "PROBLEM_CONFLICT");
        if (reported >= MAX_PROBLEM_REPORTS) {
            throw new BadRequestException("Quá nhiều vấn đề phát sinh. Vui lòng liên hệ supervisor.");
        }

        // Persist description
        claim.setProblemType(request.getProblemType());
        claim.setProblemDescription(request.getProblemDescription());

        // Move to PROBLEM_CONFLICT
        ClaimStatus conflict = claimStatusRepository.findByCode("PROBLEM_CONFLICT")
                .orElseThrow(() -> new NotFoundException("Status PROBLEM_CONFLICT not found"));
        claim.setStatus(conflict);
        claim = claimRepository.save(claim);

        createStatusHistory(claim, conflict, currentUser,
                "Problem reported: " + request.getProblemType() + " - " + request.getProblemDescription());

        // Notify EVM team
        try {
            notificationService.sendClaimCustomerNotification(claim, CustomerNotificationRequest.builder()
                    .notificationType("INTERNAL_EVM_ALERT")
                    .channels(List.of("EMAIL"))
                    .message("Technician reported problem: " + request.getProblemDescription())
                    .build(), currentUser.getUsername());
        } catch (Exception ignored) {}

        return claimMapper.toResponseDto(claim);
    }

    @Override
    @Transactional
    public ClaimResponseDto resolveProblem(Integer claimId, ProblemResolutionRequest request) {
        User currentUser = getCurrentUser();
        String role = currentUser.getRole().getRoleName();
        if (!Set.of("EVM_STAFF", "ADMIN").contains(role)) {
            throw new BadRequestException("Only EVM_STAFF or ADMIN can resolve problems");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        if (!"PROBLEM_CONFLICT".equals(claim.getStatus().getCode())) {
            throw new BadRequestException("Claim must be in PROBLEM_CONFLICT status to resolve");
        }

        ClaimStatus solved = claimStatusRepository.findByCode("PROBLEM_SOLVED")
                .orElseThrow(() -> new NotFoundException("Status PROBLEM_SOLVED not found"));

        claim.setStatus(solved);
        claim = claimRepository.save(claim);

        createStatusHistory(claim, solved, currentUser,
                "EVM resolved: " + request.getResolutionAction() + ". Notes: " + request.getResolutionNotes() +
                        (request.getTrackingNumber() != null ? "; Tracking=" + request.getTrackingNumber() : ""));

        // Notify assigned technician (reusing notification infra)
        try {
            notificationService.sendClaimCustomerNotification(claim, CustomerNotificationRequest.builder()
                    .notificationType("TECH_ALERT")
                    .channels(List.of("EMAIL"))
                    .message("EVM resolved problem: " + request.getResolutionNotes())
                    .build(), currentUser.getUsername());
        } catch (Exception ignored) {}

        return claimMapper.toResponseDto(claim);
    }

    @Override
    @Transactional
    public ClaimResponseDto confirmResolution(Integer claimId, Boolean confirmed, String nextAction) {
        User currentUser = getCurrentUser();
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        validateUserCanModifyClaim(currentUser, claim);

        if (!"PROBLEM_SOLVED".equals(claim.getStatus().getCode())) {
            throw new BadRequestException("Claim must be in PROBLEM_SOLVED to confirm");
        }
        if (!Boolean.TRUE.equals(confirmed)) {
            throw new BadRequestException("Resolution must be confirmed");
        }

        String target = switch (nextAction == null ? "" : nextAction.toUpperCase()) {
            case "READY_FOR_REPAIR" -> "READY_FOR_REPAIR";
            case "REPORT_NEW_PROBLEM" -> null; // keep PROBLEM_SOLVED; caller will call report-problem
            default -> throw new BadRequestException("Invalid nextAction: " + nextAction);
        };

        if (target == null) {
            return claimMapper.toResponseDto(claim);
        }

        ClaimStatus targetStatus = claimStatusRepository.findByCode(target)
                .orElseThrow(() -> new NotFoundException("Status " + target + " not found"));
        claim.setStatus(targetStatus);
        claim.setProblemDescription(null);
        claim.setProblemType(null);
        claim = claimRepository.save(claim);
        createStatusHistory(claim, targetStatus, currentUser, "Technician confirmed resolution. Proceeding.");
        return claimMapper.toResponseDto(claim);
    }

    @Override
    @Transactional
    public ClaimResponseDto resubmitClaim(Integer claimId, ClaimResubmitRequest request) {
        User currentUser = getCurrentUser();
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        validateUserCanModifyClaim(currentUser, claim);

        if (!"EVM_REJECTED".equals(claim.getStatus().getCode())) {
            throw new BadRequestException("Only rejected claims can be resubmitted");
        }
        if (Boolean.FALSE.equals(claim.getCanResubmit())) {
            throw new BadRequestException("Claim cannot be resubmitted (final rejection)");
        }
        int current = claim.getResubmitCount() != null ? claim.getResubmitCount() : 0;
        if (current >= MAX_RESUBMIT_COUNT) {
            throw new BadRequestException("Maximum resubmit attempts reached");
        }

        claim.setResubmitCount(current + 1);
        // Append revised diagnostic to initial diagnosis for traceability
        String diag = (claim.getInitialDiagnosis() == null ? "" : claim.getInitialDiagnosis() + "\n\n") +
                "=== RESUBMISSION #" + claim.getResubmitCount() + " ===\n" + request.getRevisedDiagnostic() +
                "\n\nResponse: " + request.getResponseToRejection();
        claim.setInitialDiagnosis(diag);
        claim.setRejectionReason(null);
        claim.setRejectionNotes(null);

        ClaimStatus pending = claimStatusRepository.findByCode("PENDING_EVM_APPROVAL")
                .orElseThrow(() -> new NotFoundException("Status PENDING_EVM_APPROVAL not found"));
        claim.setStatus(pending);
        claim = claimRepository.save(claim);
        createStatusHistory(claim, pending, currentUser, "Resubmitted to EVM after rejection");

        return claimMapper.toResponseDto(claim);
    }
}
