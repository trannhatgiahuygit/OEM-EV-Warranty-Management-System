package com.ev.warranty.controller;

import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.service.inter.ClaimService;
import com.ev.warranty.service.inter.WarrantyEligibilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;
    private final WarrantyEligibilityService eligibilityService;

    // ==================== EXISTING ENDPOINTS ====================

    @PostMapping("/intake")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> createClaimIntake(@Valid @RequestBody ClaimIntakeRequest request) {
        ClaimResponseDto response = claimService.createClaimIntake(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/draft")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> saveDraftClaim(@Valid @RequestBody ClaimIntakeRequest request) {
        ClaimResponseDto response = claimService.saveDraftClaim(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/diagnostic")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> updateDiagnostic(
            @PathVariable Integer id,
            @Valid @RequestBody ClaimDiagnosticRequest request) {
        request.setClaimId(id); // Ensure consistency
        ClaimResponseDto response = claimService.updateDiagnostic(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('EVM_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> getClaimById(@PathVariable Integer id) {
        ClaimResponseDto response = claimService.getClaimById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN') or hasRole('SC_TECHNICIAN')")
    public ResponseEntity<ClaimResponseDto> submitToEvm(@Valid @RequestBody ClaimSubmissionRequest request) {
        ClaimResponseDto response = claimService.submitToEvm(request);
        return ResponseEntity.ok(response);
    }

    // ==================== 🆕 NEW ENDPOINTS - Fix Status Workflow
    // ====================

    /**
     * 🔧 MAIN FIX - Manual status update endpoint
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody ClaimStatusUpdateRequest request) {

        ClaimResponseDto response = claimService.updateClaimStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }

    /**
     * 🔧 FIX - Complete repair endpoint
     */
    @PutMapping("/{id}/complete-repair")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> completeRepair(
            @PathVariable Integer id,
            @Valid @RequestBody ClaimRepairCompletionRequest request) {

        ClaimResponseDto response = claimService.completeRepair(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 🆕 NOTIFY CUSTOMER - Missing endpoint
     */
    @PostMapping("/{id}/notify-customer")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<String> notifyCustomer(
            @PathVariable Integer id,
            @Valid @RequestBody CustomerNotificationRequest request) {

        request.setClaimId(id); // Ensure consistency
        String response = claimService.notifyCustomer(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 🆕 FINAL INSPECTION - Missing endpoint
     */
    @PostMapping("/{id}/final-inspection")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> performFinalInspection(
            @PathVariable Integer id,
            @Valid @RequestBody ClaimInspectionRequest request) {

        ClaimResponseDto response = claimService.performFinalInspection(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 🔧 FIX - Vehicle handover endpoint (POST for Postman compatibility)
     * If customer has issues, claim is set back to OPEN with new diagnosis
     * If customer is satisfied, claim is marked as CLAIM_DONE
     */
    @PostMapping("/{id}/handover")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> handoverVehicle(
            @PathVariable Integer id,
            @Valid @RequestBody VehicleHandoverRequest request) {

        ClaimResponseDto response = claimService.handoverVehicle(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 🔧 FIX - Close claim endpoint (POST for Postman compatibility)
     */
    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> closeClaim(
            @PathVariable Integer id,
            @Valid @RequestBody ClaimClosureRequest request) {

        ClaimResponseDto response = claimService.closeClaim(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 🆕 CLAIM SUMMARY - Missing endpoint
     */
    @GetMapping("/{id}/summary")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('EVM_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimSummaryDto> getClaimSummary(@PathVariable Integer id) {

        ClaimSummaryDto summary = claimService.getClaimSummary(id);
        return ResponseEntity.ok(summary);
    }

    // ==================== OTHER ENDPOINTS ====================

    @PutMapping("/{id}/ready-for-submission")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> markReadyForSubmission(@PathVariable Integer id) {
        ClaimResponseDto response = claimService.markReadyForSubmission(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/technician/{technicianId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimResponseDto>> getClaimsByTechnician(@PathVariable Integer technicianId) {
        List<ClaimResponseDto> claims = claimService.getClaimsByTechnician(technicianId);
        return ResponseEntity.ok(claims);
    }

    /**
     * 🆕 Get claims by status code - for debugging
     */
    @GetMapping("/status/{statusCode}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('EVM_STAFF') or hasRole('ADMIN')")
    @Operation(summary = "Get claims by status code", description = "Debug endpoint to find all claims with specific status")
    public ResponseEntity<List<ClaimResponseDto>> getClaimsByStatus(@PathVariable String statusCode) {
        List<ClaimResponseDto> claims = claimService.getClaimsByStatus(statusCode);
        return ResponseEntity.ok(claims);
    }

    @GetMapping("/validate/{id}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimValidationResult> validateForSubmission(@PathVariable Integer id) {
        // Implementation would call service method
        return ResponseEntity.ok(new ClaimValidationResult(true));
    }

    @PutMapping("/{id}/draft")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> updateDraftClaim(
            @PathVariable Integer id,
            @Valid @RequestBody ClaimIntakeRequest request) {
        ClaimResponseDto response = claimService.updateDraftClaim(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/draft")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDraftClaim(@PathVariable Integer id) {
        claimService.deleteDraftClaim(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> activateClaim(@PathVariable Integer id) {
        ClaimResponseDto response = claimService.activateClaim(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Convert a draft claim to intake (official submission)
     */
    @PostMapping("/{draftId}/to-intake")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> convertDraftToIntake(@PathVariable Integer draftId) {
        // Gọi đúng overload method không truyền ClaimIntakeRequest
        ClaimResponseDto response = claimService.convertDraftToIntake(draftId);
        return ResponseEntity.ok(response);
    }

    /**
     * 🆕 GET ALL CLAIMS - No filter
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('EVM_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimResponseDto>> getAllClaims() {
        List<ClaimResponseDto> claims = claimService.getAllClaims();
        return ResponseEntity.ok(claims);
    }

    // ==================== NEWLY ADDED ENDPOINTS ====================

    @PostMapping("/{id}/report-problem")
    @PreAuthorize("hasRole('SC_TECHNICIAN') or hasRole('SC_STAFF') or hasRole('ADMIN')")
    @Operation(summary = "Technician reports problem after EVM approval")
    public ResponseEntity<ClaimResponseDto> reportProblem(@PathVariable Integer id,
            @Valid @RequestBody ProblemReportRequest request) {
        request.setClaimId(id);
        return ResponseEntity.ok(claimService.reportProblem(id, request));
    }

    @PostMapping("/{id}/confirm-resolution")
    @PreAuthorize("hasRole('SC_TECHNICIAN') or hasRole('SC_STAFF') or hasRole('ADMIN')")
    @Operation(summary = "Technician confirms EVM resolved the problem")
    public ResponseEntity<ClaimResponseDto> confirmResolution(@PathVariable Integer id,
            @Valid @RequestBody ConfirmResolutionRequest request) {
        return ResponseEntity.ok(claimService.confirmResolution(id, request.getConfirmed(), request.getNextAction()));
    }

    @PostMapping("/{id}/resubmit")
    @PreAuthorize("hasRole('SC_TECHNICIAN') or hasRole('SC_STAFF') or hasRole('ADMIN')")
    @Operation(summary = "Resubmit rejected claim for EVM review")
    public ResponseEntity<ClaimResponseDto> resubmit(@PathVariable Integer id,
            @Valid @RequestBody ClaimResubmitRequest request) {
        return ResponseEntity.ok(claimService.resubmitClaim(id, request));
    }

    /**
     * Auto warranty eligibility check by claim id
     */
    @GetMapping("/{id}/warranty-check")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('EVM_STAFF') or hasRole('ADMIN')")
    @Operation(summary = "Check claim warranty eligibility", description = "Evaluate warranty status and basic conditions for the claim (expiry and mileage vs. effective WarrantyCondition).", responses = {
            @ApiResponse(responseCode = "200", description = "Eligibility result", content = @Content(schema = @Schema(implementation = WarrantyEligibilityService.Result.class))) })
    public ResponseEntity<WarrantyEligibilityService.Result> checkWarrantyByClaim(@PathVariable Integer id) {
        return ResponseEntity.ok(eligibilityService.checkByClaimId(id));
    }

    /**
     * NEW: Handle customer approval for out-of-warranty repair
     */
    @PostMapping("/{id}/customer-approval")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Record customer approval decision for non-warranty repair")
    public ResponseEntity<ClaimResponseDto> handleCustomerApproval(
            @PathVariable Integer id,
            @RequestParam Boolean approved,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(claimService.handleCustomerApproval(id, approved, notes));
    }

    /**
     * NEW: Update customer payment status (for SC Repair flow)
     */
    @PutMapping("/{id}/payment-status")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Update customer payment status")
    public ResponseEntity<ClaimResponseDto> updatePaymentStatus(
            @PathVariable Integer id,
            @RequestParam String paymentStatus) { // PENDING or PAID
        return ResponseEntity.ok(claimService.updatePaymentStatus(id, paymentStatus));
    }

    /**
     * NEW: Mark work as done (technician completes repair)
     */
    @PutMapping("/{id}/work-done")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_TECHNICIAN','ROLE_SC_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Mark claim work as done")
    public ResponseEntity<ClaimResponseDto> markWorkDone(
            @PathVariable Integer id,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(claimService.markWorkDone(id, notes));
    }

    /**
     * NEW: Mark claim as done (staff completes handover)
     */
    @PutMapping("/{id}/claim-done")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Mark claim as done (after handover)")
    public ResponseEntity<ClaimResponseDto> markClaimDone(
            @PathVariable Integer id,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(claimService.markClaimDone(id, notes));
    }

    // ==================== Cancel request flow endpoints ====================

    /**
     * Technician (or staff) requests cancel for an SC_REPAIR claim
     */
    @PostMapping("/{id}/request-cancel")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_TECHNICIAN','ROLE_SC_STAFF','ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> requestCancel(@PathVariable Integer id,
            @Valid @RequestBody com.ev.warranty.model.dto.claim.ClaimCancelRequest request) {
        return ResponseEntity.ok(claimService.requestCancel(id, request));
    }

    /**
     * SC Staff accepts the cancel request and moves claim to ready-to-handover
     * canceled state
     */
    @PostMapping("/{id}/cancel/accept")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> acceptCancel(@PathVariable Integer id,
            @RequestParam(required = false) String note) {
        return ResponseEntity.ok(claimService.acceptCancel(id, note));
    }

    /**
     * SC Staff rejects the cancel request — revert to previous status
     */
    @PostMapping("/{id}/cancel/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> rejectCancel(@PathVariable Integer id,
            @RequestParam(required = false) String note) {
        return ResponseEntity.ok(claimService.rejectCancel(id, note));
    }

    /**
     * SC Staff confirms handover for canceled claim — release serials and cancel
     * work orders
     */
    @PostMapping("/{id}/cancel/confirm-handover")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> confirmHandoverCancel(@PathVariable Integer id,
            @RequestParam(required = false) String note) {
        return ResponseEntity.ok(claimService.confirmHandoverCancel(id, note));
    }

    /**
     * Reopen claim after a cancel flow if needed
     */
    @PostMapping("/{id}/cancel/reopen")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> reopenAfterCancel(@PathVariable Integer id,
            @RequestParam(required = false) String note) {
        return ResponseEntity.ok(claimService.reopenAfterCancel(id, note));
    }
}
