package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.claim.EVMApprovalRequestDTO;
import com.ev.warranty.model.dto.claim.EVMClaimSummaryDTO;
import com.ev.warranty.model.dto.claim.EVMClaimFilterRequestDTO;
import com.ev.warranty.model.dto.claim.EVMRejectionRequestDTO;
import com.ev.warranty.model.dto.claim.ClaimResponseDto;
import org.springframework.data.domain.Page;

public interface EVMClaimService {

    /**
     * View all warranty claims across all service centers
     * Main API for EVM staff oversight
     */
    Page<EVMClaimSummaryDTO> getAllClaims(EVMClaimFilterRequestDTO filter);

    /**
     * Approve a warranty claim
     * Available to: EVM_STAFF only
     */
    ClaimResponseDto approveClaim(Integer claimId, EVMApprovalRequestDTO request, String evmStaffUsername);

    /**
     * Reject a warranty claim
     * Available to: EVM_STAFF only
     */
    ClaimResponseDto rejectClaim(Integer claimId, EVMRejectionRequestDTO request, String evmStaffUsername);

    /**
     * Get claim details for EVM review
     */
    ClaimResponseDto getClaimForReview(Integer claimId);

    /**
     * Get pending claims awaiting EVM approval
     */
    Page<EVMClaimSummaryDTO> getPendingClaims(EVMClaimFilterRequestDTO filter);

    /**
     * Get all pending claims awaiting EVM approval (no filter)
     */
    Page<EVMClaimSummaryDTO> getPendingClaims();
}