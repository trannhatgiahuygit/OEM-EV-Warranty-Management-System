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
     * Get claims pending approval
     */
    List<ClaimResponseDto> getPendingApprovalClaims();
}
