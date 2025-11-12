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
import com.ev.warranty.service.inter.WorkOrderService;
import com.ev.warranty.model.dto.workorder.WorkOrderCreateRequestDTO;
import com.ev.warranty.model.dto.workorder.WorkOrderResponseDTO;
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
    private final com.ev.warranty.service.inter.ServiceHistoryService serviceHistoryService;
    private final WorkOrderService workOrderService;
    private final com.ev.warranty.service.inter.WarrantyEligibilityService warrantyEligibilityService;

    private static final int MAX_PROBLEM_REPORTS = 5;
    private static final int MAX_RESUBMIT_COUNT = 1;

    // ==================== CLAIM CREATION ====================

    @Transactional
    public ClaimResponseDto createClaimIntake(ClaimIntakeRequest request) {
        // Tạo claim mới từ request intake
        // - Lấy user hiện tại
        // - Tìm hoặc tạo customer
        // - Tìm vehicle theo VIN
        // - Dùng mapper để build entity Claim và thiết lập quan hệ
        // - Ghi lịch sử trạng thái và nếu có technician thì tạo work order ban đầu
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

        // Create claim using mapper.
        Claim claim = claimMapper.toEntity(request);

        // Set additional fields.
        claim.setClaimNumber(generateClaimNumber());

        // Set status based on flow.
        String statusCode = determineInitialStatus(request.getFlow());
        ClaimStatus initialStatus = claimStatusRepository.findByCode(statusCode)
                .orElseThrow(() -> new NotFoundException("Status " + statusCode + " not found"));

        // Use mapper to set relationships.
        claimMapper.setRelationships(claim, customer, vehicle, currentUser, initialStatus);

        // Assign technician if provided.
        if (request.getAssignedTechnicianId() != null) {
            User technician = findAndValidateTechnician(request.getAssignedTechnicianId());
            claimMapper.assignTechnician(claim, technician);
        }

        claim = claimRepository.save(claim);

        // Create status history
        createStatusHistory(claim, initialStatus, currentUser,
                "Claim created via " + statusCode.toLowerCase() + " process");


        // Create initial work order if technician is assigned and claim is not a DRAFT.
        // This ensures claims are bound to work orders from the start.
        if (claim.getAssignedTechnician() != null && !"DRAFT".equals(statusCode)) {
            try {
                WorkOrderCreateRequestDTO workOrderRequest = WorkOrderCreateRequestDTO.builder()
                        .claimId(claim.getId())
                        .technicianId(claim.getAssignedTechnician().getId())
                        .startTime(java.time.LocalDateTime.now())
                        .workOrderType(claim.getRepairType() != null && "SC_REPAIR".equals(claim.getRepairType()) ? "SC" : "EVM")
                        .build();
                
                WorkOrderResponseDTO createdWorkOrder = workOrderService.createInitialWorkOrder(workOrderRequest);
                log.info("Initial work order created successfully with ID: {} for claim: {}", 
                        createdWorkOrder.getId(), claim.getClaimNumber());
                
                // Verify work order was actually saved
                List<WorkOrder> verifyWorkOrders = workOrderRepository.findByClaimId(claim.getId());
                if (verifyWorkOrders.isEmpty()) {
                    log.error("CRITICAL: Work order creation reported success but no work order found for claim: {}", 
                            claim.getClaimNumber());
                } else {
                    log.info("Verified: {} work order(s) found for claim: {}", verifyWorkOrders.size(), claim.getClaimNumber());
                }
            } catch (Exception e) {
                // Log error but don't fail claim creation if work order creation fails
                log.error("Failed to create initial work order for claim {}: {}", 
                        claim.getClaimNumber(), e.getMessage(), e);
            }
        }

        return claimMapper.toResponseDto(claim);
    }

    @Transactional
    public ClaimResponseDto saveDraftClaim(ClaimIntakeRequest request) {
        // Lưu claim ở trạng thái DRAFT (dùng lại createClaimIntake với flow=DRAFT)
        request.setFlow("DRAFT");
        return createClaimIntake(request);
    }

    // ==================== DIAGNOSTIC UPDATES ====================

    @Transactional
    public ClaimResponseDto updateDiagnostic(ClaimDiagnosticRequest request) {
        // Cập nhật thông tin chẩn đoán cho claim
        // - Kiểm tra quyền của user
        // - Kiểm tra trạng thái có cho phép chỉnh sửa
        // - Không cho chuyển từ SC_REPAIR -> EVM_REPAIR
        // - Cập nhật các trường bằng mapper
        // - Tùy theo repairType / isWarrantyEligible sẽ progress trạng thái hoặc gửi thông báo
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Authorization check
        validateUserCanModifyClaim(currentUser, claim);

        // Status validation
        validateClaimModifiable(claim);

        // ===== NEW: Validate repair type modification =====
        if (request.getRepairType() != null && claim.getRepairType() != null) {
            // Cannot switch from SC_REPAIR to EVM_REPAIR
            if ("SC_REPAIR".equals(claim.getRepairType()) && "EVM_REPAIR".equals(request.getRepairType())) {
                throw new BadRequestException(
                    "Cannot switch from SC Repair to EVM Repair. " +
                    "If customer wants warranty repair, please cancel this claim and create a new one."
                );
            }
            // EVM_REPAIR -> SC_REPAIR is allowed (can be switched)
        }

        // Update diagnostic using mapper (summary, warrantyCost, diagnosticDetails, warranty eligibility)
        claimMapper.updateEntityFromDiagnosticRequest(claim, request);

        // ===== NEW: Manual warranty override handling =====
        if (request.getManualWarrantyOverride() != null) {
            claim.setManualWarrantyOverride(request.getManualWarrantyOverride());
            if (Boolean.TRUE.equals(request.getManualWarrantyOverride())) {
                if (!Boolean.TRUE.equals(request.getManualOverrideConfirmed())) {
                    throw new BadRequestException("Cần xác nhận checkbox đảm bảo điều kiện bảo hành trước khi ghi đè.");
                }
                claim.setManualOverrideConfirmed(true);
                claim.setManualOverrideConfirmedAt(java.time.LocalDateTime.now());
                claim.setManualOverrideConfirmedBy(currentUser);
            } else {
                // reset confirmation if override disabled
                claim.setManualOverrideConfirmed(false);
                claim.setManualOverrideConfirmedAt(null);
                claim.setManualOverrideConfirmedBy(null);
            }
        }

        // Branch logic based on repair type and warranty eligibility
        if (request.getRepairType() != null && "SC_REPAIR".equals(request.getRepairType())) {
            // SC Repair flow - go to payment pending
            ClaimStatus paymentPending = claimStatusRepository.findByCode("CUSTOMER_PAYMENT_PENDING")
                    .orElseThrow(() -> new NotFoundException("Status CUSTOMER_PAYMENT_PENDING not found"));
            claim.setStatus(paymentPending);
            claim.setCustomerPaymentStatus("PENDING");
            createStatusHistory(claim, paymentPending, currentUser,
                    "SC Repair selected. Waiting for customer payment.");
        } else if (request.getIsWarrantyEligible() != null) {
            if (Boolean.TRUE.equals(request.getIsWarrantyEligible())) {
                // If eligible -> set to PENDING_APPROVAL (technician will use "Gui toi EVM" button to submit to EVM)
                ClaimStatus pendingApproval = claimStatusRepository.findByCode("PENDING_APPROVAL")
                        .orElseThrow(() -> new NotFoundException("Status PENDING_APPROVAL not found"));
                claim.setStatus(pendingApproval);
                createStatusHistory(claim, pendingApproval, currentUser,
                        "Diagnosis submitted. Waiting for technician to send to EVM for approval.");
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
            // No explicit eligibility provided: auto progress to PENDING_APPROVAL if early stage
            autoProgressClaimStatus(claim, currentUser);
        }

        claim = claimRepository.save(claim);

        // Handle ready for submission flag (only when eligible)
        if (Boolean.TRUE.equals(request.getReadyForSubmission()) && Boolean.TRUE.equals(claim.getIsWarrantyEligible())) {
            return markReadyForSubmission(claim.getId());
        }

        // ===== NEW: Re-run auto warranty check sau khi cập nhật diagnostic (có thể mileage hoặc model đã đổi ở nơi khác) =====
        try {
            warrantyEligibilityService.checkByClaimId(claim.getId());
            // refresh entity để lấy applied coverage mới
            claim = claimRepository.findById(claim.getId()).orElse(claim);
        } catch (Exception ex) {
            log.warn("Auto warranty re-check failed: {}", ex.getMessage());
        }

        return claimMapper.toResponseDto(claim);
    }

    // ===== NEW: Customer approval for non-warranty repair =====
    @Transactional
    public ClaimResponseDto handleCustomerApproval(Integer claimId, Boolean approved, String notes) {
        // Xử lý kết quả khách hàng chấp thuận/không chấp thuận khi claim không đủ điều kiện bảo hành
        // - Nếu approved: chuyển qua CUSTOMER_APPROVED_THIRD_PARTY -> READY_FOR_REPAIR
        // - Nếu không: huỷ claim
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
        // Cập nhật trạng thái thủ công cho claim
        // - Kiểm tra quyền thực hiện
        // - Validate transition
        // - Lưu lịch sử thay đổi
        // - Nếu claim kết thúc thì lưu vào service history
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

        // ===== NEW: Save to service history when claim is done or closed =====
        if ("CLAIM_DONE".equals(statusCode) || "CLOSED".equals(statusCode)) {
            saveClaimToServiceHistory(claim, currentUser);
        }

        return claimMapper.toResponseDto(claim);
    }

    @Transactional
    public ClaimResponseDto markReadyForSubmission(Integer claimId) {
        // Đánh dấu claim đã sẵn sàng gửi sang EVM
        // - Kiểm tra các yêu cầu (validateForSubmission)
        // - Chuyển trạng thái sang PENDING_APPROVAL
        // - Trả về DTO với flag canSubmitToEvm=true
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
        // Hoàn tất sửa chữa: kiểm tra trạng thái, kiểm tra S/N phụ tùng nếu có phụ tùng bảo hành
        // - Auto-progress nếu cần để đạt trạng thái hợp lệ
        // - Cập nhật trạng thái sang FINAL_INSPECTION và tạo lịch sử
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
        // Bàn giao xe cho khách
        // - Nếu khách không hài lòng -> mở lại claim (OPEN) và thêm ghi chú chẩn đoán
        // - Nếu hài lòng -> markClaimDone
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Auto-progress to WORK_DONE if needed
        autoProgressToValidStatus(claim, Set.of("WORK_DONE"), currentUser);

        // Check if there are issues - if customer is not satisfied, set back to OPEN
        if (request.getCustomerSatisfied() == null || !request.getCustomerSatisfied()) {
            // Customer has issues - set claim back to OPEN with new diagnosis
            ClaimStatus openStatus = claimStatusRepository.findByCode("OPEN")
                    .orElseThrow(() -> new NotFoundException("Status OPEN not found"));
            claim.setStatus(openStatus);
            
            // Update diagnosis with new information
            if (request.getHandoverNotes() != null && !request.getHandoverNotes().isEmpty()) {
                String newDiagnosis = (claim.getDiagnosticDetails() != null ? claim.getDiagnosticDetails() + "\n\n" : "") +
                        "=== HANDOVER ISSUE ===\n" +
                        "Date: " + java.time.LocalDateTime.now() + "\n" +
                        "Issue: " + request.getHandoverNotes();
                claim.setDiagnosticDetails(newDiagnosis);
            }
            
            claim = claimRepository.save(claim);
            createStatusHistory(claim, openStatus, currentUser,
                    "Customer reported issues during handover. Claim reopened for resolution.");
            
            return claimMapper.toResponseDto(claim);
        } else {
            // Customer satisfied - mark claim as done
            return markClaimDone(claimId, request.getHandoverNotes());
        }
    }

    @Transactional
    public ClaimResponseDto closeClaim(Integer claimId, ClaimClosureRequest request) {
        // Đóng claim/hoàn tất quy trình
        // - Auto-progress nếu cần
        // - Điều chỉnh tồn kho theo các phụ tùng đã dùng
        // - Chuyển trạng thái sang CLOSED (gọi updateClaimStatus)
        User currentUser = getCurrentUser();

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Auto-progress to WORK_DONE if needed
        autoProgressToValidStatus(claim, Set.of("WORK_DONE", "CLAIM_DONE"), currentUser);

        // Adjust inventory based on used parts (consume reserved, decrease stock) - default warehouse 1
        adjustInventoryForClaimUsedParts(claimId);

        // Update status to CLAIM_DONE (which will trigger service history save)
        return updateClaimStatus(claimId, "CLOSED");
    }

    // ==================== QUERY METHODS ====================

    public ClaimResponseDto getClaimById(Integer claimId) {
        // Lấy claim và trả về DTO kèm thông tin validate để frontend biết có thể submit hay không
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // ===== NEW: Auto-trigger warranty check khi FE load trang chi tiết =====
        try {
            warrantyEligibilityService.checkByClaimId(claimId);
            claim = claimRepository.findById(claimId).orElse(claim);
        } catch (Exception e) {
            log.debug("Warranty auto-check skipped/failed for claim {}: {}", claimId, e.getMessage());
        }
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
        // Trả về summary ngắn gọn của claim (dùng mapper chuyển sang DTO tóm tắt)
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));
        return claimMapper.toSummaryDto(claim);
    }

    /**
     * 🆕 NEW METHOD - Customer notification
     */
    public String notifyCustomer(Integer claimId, CustomerNotificationRequest request) {
        // Gửi thông báo tới khách hàng qua notificationService và tạo lịch sử trạng thái (note)
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
        // Lấy tất cả claim gán cho technician (bản đồ sang DTO)
        return claimRepository.findByAssignedTechnicianId(technicianId).stream()
                .map(claimMapper::toResponseDto)
                .toList();
    }

    public List<ClaimResponseDto> getClaimsByStatus(String statusCode) {
        // Lấy claim theo status
        return claimRepository.findByStatusCode(statusCode).stream()
                .map(claimMapper::toResponseDto)
                .toList();
    }

    @Override
    public List<ClaimResponseDto> getAllClaims() {
        // Trả về tất cả claim
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
        // Kiểm tra quyền user có thể sửa claim hay không:
        // - SC_STAFF/ADMIN: luôn được phép
        // - SC_TECHNICIAN: nếu chưa có technician assigned hoặc là technician được gán thì được
        // Nếu không thỏa -> BadRequestException
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
        // Kiểm tra quyền để cập nhật trạng thái
        // - SC_STAFF/ADMIN luôn OK
        // - SC_TECHNICIAN chỉ khi được gán hoặc chưa có technician
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
        // Xác định các trạng thái cho phép chỉnh sửa diagnostic
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
        // Validate một số transition bị cấm (ví dụ từ CLOSED quay lại các trạng thái ban đầu)
        // Bộ này được viết đơn giản để không khóa workflow quá chặt
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
        // Nếu trạng thái hiện tại không nằm trong validStatuses, cố gắng tự động chuyển sang trạng thái hợp lý
        // - Sử dụng determineTargetStatus để tìm trạng thái đích
        // - Lưu lịch sử thay đổi khi auto-progress
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
        // Logic chi tiết để quyết định trạng thái đích dựa trên trạng thái hiện tại
        // - Tránh auto-progress vào trạng thái không hợp lý bằng cách kiểm tra danh sách validStatuses
        log.debug("determineTargetStatus: currentStatus={}, validStatuses={}", currentStatus, validStatuses);

        switch (currentStatus) {
            case "DRAFT", "OPEN", "ASSIGNED" -> {
                if (validStatuses.contains("IN_PROGRESS")) return "IN_PROGRESS";
                return null;
            }
            case "READY_FOR_REPAIR" -> {
                if (validStatuses.contains("REPAIR_IN_PROGRESS")) return "REPAIR_IN_PROGRESS";
                if (validStatuses.contains("IN_PROGRESS")) return "IN_PROGRESS";
                return null;
            }
            case "REPAIR_IN_PROGRESS" -> {
                if (validStatuses.contains("FINAL_INSPECTION")) return "FINAL_INSPECTION";
                if (validStatuses.contains("READY_FOR_HANDOVER")) return "READY_FOR_HANDOVER";
                return null;
            }
            case "FINAL_INSPECTION", "REPAIR_COMPLETED" -> {
                if (validStatuses.contains("READY_FOR_HANDOVER")) return "READY_FOR_HANDOVER";
                if (validStatuses.contains("HANDOVER_PENDING")) return "HANDOVER_PENDING";
                if (validStatuses.contains("WORK_DONE")) return "WORK_DONE";
                return null;
            }
            case "READY_FOR_HANDOVER" -> {
                // When a claim is READY_FOR_HANDOVER, different callers might want to
                // move it to HANDOVER_PENDING (explicit handover queue), or directly
                // to WORK_DONE/CLAIM_DONE in some automation flows. Try sensible targets
                // in priority order.
                if (validStatuses.contains("HANDOVER_PENDING")) return "HANDOVER_PENDING";
                if (validStatuses.contains("WORK_DONE")) return "WORK_DONE";
                if (validStatuses.contains("CLAIM_DONE")) return "CLAIM_DONE";
                if (validStatuses.contains("IN_PROGRESS")) return "IN_PROGRESS"; // fallback
                return null;
            }
            case "HANDOVER_PENDING" -> {
                // Allow fallback into active repair states if an operation expects them
                if (validStatuses.contains("REPAIR_IN_PROGRESS")) return "REPAIR_IN_PROGRESS";
                if (validStatuses.contains("IN_PROGRESS")) return "IN_PROGRESS";
                if (validStatuses.contains("CLAIM_DONE")) return "CLAIM_DONE";
                if (validStatuses.contains("WORK_DONE")) return "WORK_DONE";
                return null;
            }
            default -> {
                // If currentStatus already satisfies requested validStatuses, return it
                if (validStatuses.contains(currentStatus)) return currentStatus;
                // As a last resort, try a few general mappings
                if (currentStatus != null) {
                    if (currentStatus.startsWith("READY") && validStatuses.contains("WORK_DONE")) return "WORK_DONE";
                    if (currentStatus.startsWith("PENDING") && validStatuses.contains("IN_PROGRESS")) return "IN_PROGRESS";
                }
                return null;
            }
        }
    }

    private void autoProgressClaimStatus(Claim claim, User currentUser) {
        // Auto-progress nhẹ nhàng khi cập nhật chẩn đoán: từ DRAFT/OPEN -> PENDING_APPROVAL nếu phù hợp
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
        // Xác định trạng thái ban đầu theo flow (DRAFT hay INTAKE -> OPEN)
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
        // Tìm user theo id và kiểm tra role là SC_TECHNICIAN
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new NotFoundException("Technician not found"));

        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
            throw new BadRequestException("Assigned user is not a technician");
        }
        return technician;
    }

    private User getCurrentUser() {
        // Lấy user hiện tại từ SecurityContext (username -> tìm trong DB)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
    }

    private Customer findOrCreateCustomer(ClaimIntakeRequest request, User createdBy) {
        // Nếu có phone và tồn tại customer thì dùng customer đó, nếu không thì tạo mới
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
        // Tạo claim number đơn giản gồm CLM-<year>-<suffix>
        String prefix = "CLM-" + java.time.LocalDate.now().getYear() + "-";
        String suffix = String.format("%06d", System.currentTimeMillis() % 1000000);
        return prefix + suffix;
    }

    private void createStatusHistory(Claim claim, ClaimStatus status, User changedBy, String note) {
        // Tạo và lưu 1 bản ghi lịch sử trạng thái
        ClaimStatusHistory history = ClaimStatusHistory.builder()
                .claim(claim)
                .status(status)
                .changedBy(changedBy)
                .note(note)
                .build();
        claimStatusHistoryRepository.save(history);
    }

    private void adjustInventoryForClaimUsedParts(Integer claimId) {
        // Điều chỉnh tồn kho khi đóng claim: trừ reserved và current stock theo số lượng phụ tùng đã dùng
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
        // Tự động phân loại loại chi phí cho các ClaimItem dựa vào warranty của xe và trạng thái item
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
        // Kiểm tra các yêu cầu tối thiểu để một claim có thể submit sang EVM
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
        // Gửi claim tới EVM để phê duyệt
        // - Kiểm tra trạng thái hiện tại phải là PENDING_APPROVAL
        // - Nếu không force, chạy validateForSubmission
        // - Auto-classify cost types
        // - Chuyển trạng thái sang PENDING_EVM_APPROVAL và lưu lịch sử
        Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Validate claim is in PENDING_APPROVAL status before sending to EVM
        String currentStatus = claim.getStatus().getCode();
        if (!"PENDING_APPROVAL".equals(currentStatus)) {
            throw new BadRequestException(
                    "Claim must be in PENDING_APPROVAL status before submitting to EVM. Current status: " + currentStatus
            );
        }

        if (!Boolean.TRUE.equals(request.getForceSubmit())) {
            ClaimValidationResult validation = validateForSubmission(claim);
            if (!validation.getCanSubmit()) {
                throw new ValidationException("Claim cannot be submitted: " +
                        String.join(", ", validation.getMissingRequirements()));
            }
        }

        // Auto-classify cost types for proposed items before submission
        autoClassifyCostTypes(claim);

        // Transition from PENDING_APPROVAL to PENDING_EVM_APPROVAL
        User currentUser = getCurrentUser();
        ClaimStatus pendingEvmStatus = claimStatusRepository.findByCode("PENDING_EVM_APPROVAL")
                .orElseThrow(() -> new NotFoundException("Status PENDING_EVM_APPROVAL not found"));

        ClaimStatus oldStatus = claim.getStatus();
        claim.setStatus(pendingEvmStatus);
        claim = claimRepository.save(claim);

        createStatusHistory(claim, pendingEvmStatus, currentUser,
                "Technician submitted to EVM for approval" +
                (request.getSubmissionNotes() != null ? ". Notes: " + request.getSubmissionNotes() : ""));

        return claimMapper.toResponseDto(claim);
    }

    // Continue with all other existing methods...
    // Just replace mapToResponseDto with claimMapper.toResponseDto

    public List<ClaimResponseDto> getPendingApprovalClaims() {
        // Lấy danh sách claim đang chờ EVM phê duyệt
        return claimRepository.findClaimsPendingApproval().stream()
                .map(claimMapper::toResponseDto)
                .toList();
    }

    public ClaimCompletionStatusDTO getCompletionStatus(Integer claimId) {
        // Tạo DTO mô tả tiến độ hoàn thành của claim (phục vụ dashboard)
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
        // Danh sách claim ở trạng thái READY_FOR_HANDOVER
        return claimRepository.findByStatusCode("READY_FOR_HANDOVER").stream()
                .map(claimMapper::toResponseDto)
                .toList();
    }

    @Transactional
    public ClaimResponseDto performFinalInspection(Integer claimId, ClaimInspectionRequest request) {
        // Thực hiện kiểm tra cuối cùng: nếu pass -> READY_FOR_HANDOVER, ngược lại -> IN_PROGRESS
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
        // Chuyển claim từ DRAFT sang OPEN (intake)
        // - Force load các quan hệ lazy
        // - Cập nhật dữ liệu từ request nếu có
        // - Validate các trường bắt buộc
        // - Nếu có technician và chưa có work order -> tạo work order ban đầu
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
            
            // Assign technician if provided in the request
            if (updateRequest.getAssignedTechnicianId() != null) {
                User technician = findAndValidateTechnician(updateRequest.getAssignedTechnicianId());
                claimMapper.assignTechnician(claim, technician);
            }
        }

        // Validate required fields
        validateRequiredFieldsForIntake(claim);
        
        // Save claim with any updates (including technician assignment)
        claim = claimRepository.save(claim);

        // Convert to INTAKE/OPEN status
        log.info("Converting draft claim {} to OPEN status", claimId);
        ClaimResponseDto result = updateClaimStatus(claimId, "OPEN");
        
        // Reload claim to get updated status
        claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found after status update"));
        
        // Create initial work order if technician is assigned and claim is now OPEN (not DRAFT)
        if (claim.getAssignedTechnician() != null && !"DRAFT".equals(claim.getStatus().getCode())) {
            try {
                // Check if work order already exists for this claim
                List<WorkOrder> existingWorkOrders = workOrderRepository.findByClaimId(claim.getId());
                if (existingWorkOrders.isEmpty()) {
                    WorkOrderCreateRequestDTO workOrderRequest = WorkOrderCreateRequestDTO.builder()
                            .claimId(claim.getId())
                            .technicianId(claim.getAssignedTechnician().getId())
                            .startTime(java.time.LocalDateTime.now())
                            .workOrderType(claim.getRepairType() != null && "SC_REPAIR".equals(claim.getRepairType()) ? "SC" : "EVM")
                            .build();
                    
                    WorkOrderResponseDTO createdWorkOrder = workOrderService.createInitialWorkOrder(workOrderRequest);
                    log.info("Initial work order created successfully with ID: {} for claim: {}", 
                            createdWorkOrder.getId(), claim.getClaimNumber());
                    
                    // Verify work order was actually saved
                    List<WorkOrder> verifyWorkOrders = workOrderRepository.findByClaimId(claim.getId());
                    if (verifyWorkOrders.isEmpty()) {
                        log.error("CRITICAL: Work order creation reported success but no work order found for claim: {}", 
                                claim.getClaimNumber());
                    } else {
                        log.info("Verified: {} work order(s) found for claim: {}", verifyWorkOrders.size(), claim.getClaimNumber());
                    }
                } else {
                    log.info("Work order already exists for claim: {}, skipping creation", claim.getClaimNumber());
                }
            } catch (Exception e) {
                // Log error but don't fail claim conversion if work order creation fails
                log.error("Failed to create initial work order for claim {}: {}", 
                        claim.getClaimNumber(), e.getMessage(), e);
            }
        }
        
        return result;
    }

    @Override
    @Transactional
    public ClaimResponseDto convertDraftToIntake(Integer claimId) {
        // Overload: gọi phương thức ở trên mà không cập nhật dữ liệu
        return convertDraftToIntake(claimId, null);
    }

    private void updateClaimFromRequest(Claim claim, ClaimIntakeRequest request) {
        // Cập nhật các trường cơ bản của claim/customer/vehicle từ request, kèm null checks
        // Điều này để tránh NPE khi các quan hệ bị lazy
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
        // Kiểm tra các trường bắt buộc trước khi chuyển DRAFT -> OPEN
        // - Nếu thiếu thì ném ValidationException với mô tả
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
        // Cập nhật claim ở trạng thái DRAFT bằng mapper
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
        // 'Xóa' draft bằng cách set isActive=false (soft delete)
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
        // Kích hoạt lại claim đã bị set inactive
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
        // Kỹ thuật viên report vấn đề phát sinh sau khi EVM đã approve hoặc trong quá trình sửa
        // - Giới hạn số lần report
        // - Chuyển trạng thái sang PROBLEM_CONFLICT và gửi thông báo nội bộ
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
        // EVM staff resolve problem -> chuyển sang PROBLEM_SOLVED và notify technician
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
        // Technician confirm resolution đã thực hiện
        // - Nếu confirmed và nextAction=READY_FOR_REPAIR -> chuyển trạng thái và clear problem fields
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
        // Resubmit sau khi EVM reject: tăng resubmitCount, append diagnostic trace và chuyển sang PENDING_EVM_APPROVAL
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

    // ===== NEW: Save claim to service history =====
    private void saveClaimToServiceHistory(Claim claim, User currentUser) {
        // Gọi service history service để lưu thông tin lịch sử service khi claim hoàn tất
        // - Xác định loại dịch vụ (warranty vs sc_repair)
        // - Build DTO và gọi serviceHistoryService.createServiceHistory
        try {
            // Determine service type based on repair type
            String serviceType;
            if (claim.getRepairType() != null && "SC_REPAIR".equals(claim.getRepairType())) {
                serviceType = "sc_repair"; // Non-warranty service
            } else {
                serviceType = "warranty_repair"; // Warranty repair
            }

            // Build description
            StringBuilder description = new StringBuilder();
            description.append("Claim: ").append(claim.getClaimNumber());
            if (claim.getReportedFailure() != null) {
                description.append(" - ").append(claim.getReportedFailure());
            }
            if (claim.getDiagnosticDetails() != null) {
                description.append("\nDiagnosis: ").append(claim.getDiagnosticDetails());
            }

            // Get mileage from vehicle
            Integer mileageKm = null;
            if (claim.getVehicle() != null) {
                mileageKm = claim.getVehicle().getMileageKm();
            }

            // Create service history
            com.ev.warranty.model.dto.servicehistory.ServiceHistoryRequestDTO historyRequest = 
                new com.ev.warranty.model.dto.servicehistory.ServiceHistoryRequestDTO();
            historyRequest.setVehicleId(claim.getVehicle().getId());
            historyRequest.setCustomerId(claim.getCustomer().getId());
            historyRequest.setServiceType(serviceType);
            historyRequest.setDescription(description.toString());
            historyRequest.setPerformedById(currentUser.getId());
            historyRequest.setMileageKm(mileageKm);

            serviceHistoryService.createServiceHistory(historyRequest);
            log.info("Service history saved for claim {} with service type {}", claim.getClaimNumber(), serviceType);
        } catch (Exception e) {
            log.error("Failed to save service history for claim {}: {}", claim.getClaimNumber(), e.getMessage());
            // Don't throw - service history is supplementary
        }
    }

    // ===== NEW: Payment and work completion methods =====

    @Override
    @Transactional
    public ClaimResponseDto updatePaymentStatus(Integer claimId, String paymentStatus) {
        // Cập nhật trạng thái thanh toán của khách hàng
        User currentUser = getCurrentUser();
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        if (!"CUSTOMER_PAYMENT_PENDING".equals(claim.getStatus().getCode())) {
            throw new BadRequestException("Claim is not in payment pending status");
        }

        if ("PAID".equals(paymentStatus)) {
            claim.setCustomerPaymentStatus("PAID");
            ClaimStatus paidStatus = claimStatusRepository.findByCode("CUSTOMER_PAID")
                    .orElseThrow(() -> new NotFoundException("Status CUSTOMER_PAID not found"));
            claim.setStatus(paidStatus);
            createStatusHistory(claim, paidStatus, currentUser, "Customer payment received");
        } else {
            claim.setCustomerPaymentStatus(paymentStatus);
        }

        claim = claimRepository.save(claim);
        return claimMapper.toResponseDto(claim);
    }

    @Override
    @Transactional
    public ClaimResponseDto markWorkDone(Integer claimId, String notes) {
        // Technician đánh dấu công việc đã hoàn tất -> chuyển sang WORK_DONE
        User currentUser = getCurrentUser();
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Validate user can modify claim
        validateUserCanModifyClaim(currentUser, claim);

        ClaimStatus workDoneStatus = claimStatusRepository.findByCode("WORK_DONE")
                .orElseThrow(() -> new NotFoundException("Status WORK_DONE not found"));

        claim.setStatus(workDoneStatus);
        claim = claimRepository.save(claim);

        createStatusHistory(claim, workDoneStatus, currentUser,
                notes != null ? notes : "Work completed by technician");

        return claimMapper.toResponseDto(claim);
    }

    @Override
    @Transactional
    public ClaimResponseDto markClaimDone(Integer claimId, String notes) {
        // SC_STAFF/ADMIN đánh dấu claim hoàn thành (CLAIM_DONE)
        // - Auto-progress nếu cần
        // - Lưu lịch sử và ghi vào service history
        User currentUser = getCurrentUser();
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        // Only SC_STAFF or ADMIN can mark claim as done
        String userRole = currentUser.getRole().getRoleName();
        if (!"SC_STAFF".equals(userRole) && !"ADMIN".equals(userRole)) {
            throw new BadRequestException("Only SC_STAFF or ADMIN can mark claim as done");
        }

        // Auto-progress to HANDOVER_PENDING or WORK_DONE if needed
        String currentStatus = claim.getStatus() != null ? claim.getStatus().getCode() : null;
        if (!"HANDOVER_PENDING".equals(currentStatus) && !"WORK_DONE".equals(currentStatus) && !"CLAIM_DONE".equals(currentStatus)) {
            autoProgressToValidStatus(claim, Set.of("HANDOVER_PENDING", "WORK_DONE", "CLAIM_DONE"), currentUser);
        }

        ClaimStatus claimDoneStatus = claimStatusRepository.findByCode("CLAIM_DONE")
                .orElseThrow(() -> new NotFoundException("Status CLAIM_DONE not found"));

        claim.setStatus(claimDoneStatus);
        claim = claimRepository.save(claim);

        createStatusHistory(claim, claimDoneStatus, currentUser,
                notes != null ? notes : "Claim completed - vehicle handed over to customer");

        // Save to service history (will be called by updateClaimStatus, but we're calling it directly)
        saveClaimToServiceHistory(claim, currentUser);

        return claimMapper.toResponseDto(claim);
    }
}
