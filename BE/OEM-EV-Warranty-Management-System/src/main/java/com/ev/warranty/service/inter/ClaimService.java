package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.model.entity.Claim;

import java.util.List;

public interface ClaimService {

    // Existing methods
    ClaimResponseDto createClaimIntake(ClaimIntakeRequest request);

    ClaimResponseDto saveDraftClaim(ClaimIntakeRequest request);

    ClaimResponseDto updateDiagnostic(ClaimDiagnosticRequest request);

    ClaimResponseDto markReadyForSubmission(Integer claimId);

    ClaimResponseDto submitToEvm(ClaimSubmissionRequest request);

    ClaimValidationResult validateForSubmission(Claim claim);

    // CRUD operations
    ClaimResponseDto getClaimById(Integer claimId);

    List<ClaimResponseDto> getClaimsByTechnician(Integer technicianId);

    List<ClaimResponseDto> getClaimsByStatus(String statusCode);

    List<ClaimResponseDto> getPendingApprovalClaims();

    List<ClaimResponseDto> getAllClaims(); // Get all claims (no filter)

    // Completion flow
    ClaimResponseDto completeRepair(Integer claimId, ClaimRepairCompletionRequest request);

    ClaimResponseDto performFinalInspection(Integer claimId, ClaimInspectionRequest request);

    ClaimResponseDto handoverVehicle(Integer claimId, VehicleHandoverRequest request);

    ClaimResponseDto closeClaim(Integer claimId, ClaimClosureRequest request);

    // Status management
    ClaimCompletionStatusDTO getCompletionStatus(Integer claimId);

    List<ClaimResponseDto> getClaimsReadyForHandover();

    // 🆕 NEW METHODS - Fix status workflow issues
    ClaimResponseDto updateClaimStatus(Integer claimId, String statusCode);

    ClaimSummaryDto getClaimSummary(Integer claimId);

    String notifyCustomer(Integer claimId, CustomerNotificationRequest request);

    // Draft conversion
    ClaimResponseDto convertDraftToIntake(Integer claimId, ClaimIntakeRequest updateRequest);

    // Overload for draft to intake conversion without updateRequest
    ClaimResponseDto convertDraftToIntake(Integer claimId);

    // Draft update
    ClaimResponseDto updateDraftClaim(Integer claimId, ClaimIntakeRequest request);

    // Delete draft claim
    void deleteDraftClaim(Integer claimId);

    // Activate claim
    ClaimResponseDto activateClaim(Integer claimId);

    // 🆕 Problem handling
    ClaimResponseDto reportProblem(Integer claimId, ProblemReportRequest request);

    ClaimResponseDto resolveProblem(Integer claimId, ProblemResolutionRequest request);

    ClaimResponseDto confirmResolution(Integer claimId, Boolean confirmed, String nextAction);

    ClaimResponseDto resubmitClaim(Integer claimId, ClaimResubmitRequest request);

    // 🆕 Customer approval for non-warranty flow
    ClaimResponseDto handleCustomerApproval(Integer claimId, Boolean approved, String notes);

    // ===== Cancel request flow (SC Repair) =====
    ClaimResponseDto requestCancel(Integer claimId, com.ev.warranty.model.dto.claim.ClaimCancelRequest request);

    ClaimResponseDto acceptCancel(Integer claimId, String note);

    ClaimResponseDto rejectCancel(Integer claimId, String note);

    ClaimResponseDto confirmHandoverCancel(Integer claimId, String note);

    ClaimResponseDto reopenAfterCancel(Integer claimId, String note);

    // 🆕 NEW: Payment and work completion methods
    ClaimResponseDto updatePaymentStatus(Integer claimId, String paymentStatus); // PENDING or PAID

    ClaimResponseDto markWorkDone(Integer claimId, String notes); // Technician marks work done

    ClaimResponseDto markClaimDone(Integer claimId, String notes); // Staff marks claim done after handover
}