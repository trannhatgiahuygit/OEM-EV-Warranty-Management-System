package com.ev.warranty.controller;

import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.service.inter.ClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Claim Management", description = "APIs for warranty claim management supporting both Intake-first and Collaborative flows")
public class ClaimController {

    private final ClaimService claimService;

    // Flow 1: Intake-first - SC Staff creates complete claim
    @PostMapping("/intake")
    @Operation(summary = "Create claim via intake process",
               description = "SC Staff creates complete claim with customer/vehicle info and can submit immediately")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> createClaimIntake(@Valid @RequestBody ClaimIntakeRequest request) {
        ClaimResponseDto response = claimService.createClaimIntake(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Flow 2: Collaborative - SC Staff creates draft for technician completion
    @PostMapping("/draft")
    @Operation(summary = "Save claim as draft",
               description = "SC Staff creates draft claim for technician to complete diagnostic later")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> saveDraftClaim(@Valid @RequestBody ClaimIntakeRequest request) {
        ClaimResponseDto response = claimService.saveDraftClaim(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Technician diagnostic flow
    @PutMapping("/{claimId}/diagnostic")
    @Operation(summary = "Update claim diagnostic",
               description = "Technician adds diagnostic information, test results, and repair notes")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_TECHNICIAN', 'ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> updateDiagnostic(
            @PathVariable Integer claimId,
            @Valid @RequestBody ClaimDiagnosticRequest request) {
        request.setClaimId(claimId);
        ClaimResponseDto response = claimService.updateDiagnostic(request);
        return ResponseEntity.ok(response);
    }

    // Mark ready for submission
    @PutMapping("/{claimId}/ready")
    @Operation(summary = "Mark claim ready for EVM submission",
               description = "Mark claim as ready for EVM submission after validation")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> markReadyForSubmission(@PathVariable Integer claimId) {
        ClaimResponseDto response = claimService.markReadyForSubmission(claimId);
        return ResponseEntity.ok(response);
    }

    // Submit to EVM
    @PostMapping("/submit")
    @Operation(summary = "Submit claim to EVM",
               description = "Submit completed claim to EVM for approval")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> submitToEvm(@Valid @RequestBody ClaimSubmissionRequest request) {
        ClaimResponseDto response = claimService.submitToEvm(request);
        return ResponseEntity.ok(response);
    }

    // Validation endpoint
    @GetMapping("/{claimId}/validate")
    @Operation(summary = "Validate claim for submission",
               description = "Check if claim meets requirements for EVM submission")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimValidationResult> validateClaim(@PathVariable Integer claimId) {
        ClaimResponseDto claim = claimService.getClaimById(claimId);
        ClaimValidationResult validation = new ClaimValidationResult(claim.getCanSubmitToEvm());
        validation.setMissingRequirements(claim.getMissingRequirements());
        return ResponseEntity.ok(validation);
    }

    // Get claim details
    @GetMapping("/{claimId}")
    @Operation(summary = "Get claim by ID",
               description = "Retrieve complete claim details with attachments and history")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_SC_MANAGER', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> getClaimById(@PathVariable Integer claimId) {
        ClaimResponseDto response = claimService.getClaimById(claimId);
        return ResponseEntity.ok(response);
    }

    // List claims by filters
    @GetMapping("/technician/{technicianId}")
    @Operation(summary = "Get claims by technician",
               description = "Get active claims assigned to specific technician")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_TECHNICIAN', 'ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<List<ClaimResponseDto>> getClaimsByTechnician(@PathVariable Integer technicianId) {
        List<ClaimResponseDto> claims = claimService.getClaimsByTechnician(technicianId);
        return ResponseEntity.ok(claims);
    }

    @GetMapping("/status/{statusCode}")
    @Operation(summary = "Get claims by status",
               description = "Get all claims with specific status")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<List<ClaimResponseDto>> getClaimsByStatus(@PathVariable String statusCode) {
        List<ClaimResponseDto> claims = claimService.getClaimsByStatus(statusCode);
        return ResponseEntity.ok(claims);
    }

    @GetMapping("/pending-approval")
    @Operation(summary = "Get claims pending approval",
               description = "Get all claims ready for EVM submission")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<List<ClaimResponseDto>> getPendingApprovalClaims() {
        List<ClaimResponseDto> claims = claimService.getPendingApprovalClaims();
        return ResponseEntity.ok(claims);
    }

    // Workflow endpoints for UI guidance
    @GetMapping("/workflow-info")
    @Operation(summary = "Get workflow information",
               description = "Get available workflows and their descriptions")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<WorkflowInfoDto> getWorkflowInfo() {
        WorkflowInfoDto info = new WorkflowInfoDto();
        info.setIntakeFirstDescription("SC Staff completes all information immediately and can submit to EVM");
        info.setCollaborativeDescription("SC Staff creates draft, technician adds diagnostics, then submit");
        info.setRequiredForSubmission(List.of(
            "Valid VIN",
            "Customer phone or email",
            "Detailed fault description (min 10 chars)",
            "Diagnostic information OR attachments"
        ));
        return ResponseEntity.ok(info);
    }

    // ==================== CLAIM COMPLETION FLOW APIs ====================

    @PutMapping("/{claimId}/complete-repair")
    @Operation(summary = "Complete repair work",
               description = "Mark repair work as completed after all work orders are finished")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> completeRepair(
            @PathVariable Integer claimId,
            @Valid @RequestBody ClaimRepairCompletionRequest request) {
        ClaimResponseDto response = claimService.completeRepair(claimId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{claimId}/final-inspection")
    @Operation(summary = "Perform final inspection",
               description = "SC Staff performs final quality check before vehicle handover")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> performFinalInspection(
            @PathVariable Integer claimId,
            @Valid @RequestBody ClaimInspectionRequest request) {
        ClaimResponseDto response = claimService.performFinalInspection(claimId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{claimId}/handover-vehicle")
    @Operation(summary = "Hand over vehicle to customer",
               description = "Complete the warranty process by handing vehicle back to customer")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> handoverVehicle(
            @PathVariable Integer claimId,
            @Valid @RequestBody VehicleHandoverRequest request) {
        ClaimResponseDto response = claimService.handoverVehicle(claimId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{claimId}/close")
    @Operation(summary = "Close warranty claim",
               description = "Finalize and close the warranty claim process")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> closeClaim(
            @PathVariable Integer claimId,
            @Valid @RequestBody ClaimClosureRequest request) {
        ClaimResponseDto response = claimService.closeClaim(claimId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{claimId}/completion-status")
    @Operation(summary = "Get claim completion status",
               description = "Check the progress and next steps for claim completion")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimCompletionStatusDTO> getCompletionStatus(@PathVariable Integer claimId) {
        ClaimCompletionStatusDTO status = claimService.getCompletionStatus(claimId);
        return ResponseEntity.ok(status);
    }

    @GetMapping("/ready-for-handover")
    @Operation(summary = "Get claims ready for vehicle handover",
               description = "Get all claims where repair is completed and vehicle is ready for customer pickup")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<List<ClaimResponseDto>> getClaimsReadyForHandover() {
        List<ClaimResponseDto> claims = claimService.getClaimsReadyForHandover();
        return ResponseEntity.ok(claims);
    }

    // API chuyển claim từ draft sang intake
    @PutMapping("/{claimId}/to-intake")
    @Operation(summary = "Chuyển claim từ draft sang intake (hoặc open)",
               description = "Validate các trường bắt buộc và chuyển trạng thái claim từ draft sang intake/open")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimResponseDto> convertDraftToIntake(
            @PathVariable Integer claimId,
            @RequestBody(required = false) ClaimIntakeRequest updateRequest) {
        ClaimResponseDto response = claimService.convertDraftToIntake(claimId, updateRequest);
        return ResponseEntity.ok(response);
    }
}
