package com.ev.warranty.controller;

import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.service.inter.ClaimService;
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

    // ==================== 🆕 NEW ENDPOINTS - Fix Status Workflow ====================

    /**
     * 🔧 MAIN FIX - Manual status update endpoint
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
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
     * 🔧 FIX - Vehicle handover endpoint
     */
    @PutMapping("/{id}/handover-vehicle")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimResponseDto> handoverVehicle(
            @PathVariable Integer id,
            @Valid @RequestBody VehicleHandoverRequest request) {

        ClaimResponseDto response = claimService.handoverVehicle(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 🔧 FIX - Close claim endpoint
     */
    @PutMapping("/{id}/close")
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

    @PutMapping("/{id}/ready")
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

    @GetMapping("/status/{statusCode}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('EVM_STAFF') or hasRole('ADMIN')")
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
}
