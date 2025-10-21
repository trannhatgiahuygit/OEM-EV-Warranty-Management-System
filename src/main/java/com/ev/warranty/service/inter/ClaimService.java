package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.model.entity.Claim;

import java.util.List;

public interface ClaimService {

    /**
     * Flow 1: Intake-first - SC Staff creates complete claim and can submit immediately
     */
    ClaimResponseDto createClaimIntake(ClaimIntakeRequest request);

    /**
     * Flow 2: Collaborative - SC Staff creates draft, technician completes diagnostic
     */
    ClaimResponseDto saveDraftClaim(ClaimIntakeRequest request);

    /**
     * Technician adds diagnostic information
     */
    ClaimResponseDto updateDiagnostic(ClaimDiagnosticRequest request);

    /**
     * Mark claim as ready for EVM submission
     */
    ClaimResponseDto markReadyForSubmission(Integer claimId);

    /**
     * Submit claim to EVM (simulated)
     */
    ClaimResponseDto submitToEvm(ClaimSubmissionRequest request);

    /**
     * Validate claim for EVM submission
     */
    ClaimValidationResult validateForSubmission(Claim claim);

    /**
     * Get claim by ID with full details
     */
    ClaimResponseDto getClaimById(Integer claimId);

    /**
     * Get claims assigned to specific technician
     */
    List<ClaimResponseDto> getClaimsByTechnician(Integer technicianId);

    /**
     * Get claims by status code
     */
    List<ClaimResponseDto> getClaimsByStatus(String statusCode);

    /**
     * Get claims pending EVM approval
     */
    List<ClaimResponseDto> getPendingApprovalClaims();

    // ==================== COMPLETION FLOW METHODS ====================

    /**
     * Complete repair work after all work orders are finished
     */
    ClaimResponseDto completeRepair(Integer claimId, ClaimRepairCompletionRequest request);

    /**
     * Perform final inspection before vehicle handover
     */
    ClaimResponseDto performFinalInspection(Integer claimId, ClaimInspectionRequest request);

    /**
     * Hand over vehicle to customer
     */
    ClaimResponseDto handoverVehicle(Integer claimId, VehicleHandoverRequest request);

    /**
     * Close warranty claim
     */
    ClaimResponseDto closeClaim(Integer claimId, ClaimClosureRequest request);

    /**
     * Get claim completion status and progress
     */
    ClaimCompletionStatusDTO getCompletionStatus(Integer claimId);

    /**
     * Get claims ready for vehicle handover
     */
    List<ClaimResponseDto> getClaimsReadyForHandover();

    /**
     * Convert draft claim to intake, validating all required fields
     */
    ClaimResponseDto convertDraftToIntake(Integer claimId, ClaimIntakeRequest updateRequest);
}
