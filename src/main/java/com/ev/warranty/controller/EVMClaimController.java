package com.ev.warranty.controller;

import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.service.inter.EVMClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/evm/claims")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "EVM Warranty Claims", description = "EVM Staff APIs for warranty claims oversight across all service centers")
public class EVMClaimController {

    private final EVMClaimService evmClaimService;

    /**
     * View all warranty claims across all service centers
     * Available to: EVM_STAFF, ADMIN only
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "View all warranty claims",
            description = "Get comprehensive view of all warranty claims across all service centers with filtering, pagination, and business intelligence")
    public ResponseEntity<Page<EVMClaimSummaryDTO>> getAllClaims(
            @Valid @ModelAttribute EVMClaimFilterRequestDTO filter,
            Authentication authentication) {

        String username = authentication.getName();
        log.info("EVM user {} accessing all claims overview with filters", username);

        // Log filter details for debugging
        log.debug("Filter details - Status: {}, Cost range: {}-{}, Models: {}, Page: {}/{}",
                filter.getStatusCodes(), filter.getMinWarrantyCost(), filter.getMaxWarrantyCost(),
                filter.getVehicleModels(), filter.getPage(), filter.getSize());

        Page<EVMClaimSummaryDTO> claims = evmClaimService.getAllClaims(filter);

        log.info("EVM user {} retrieved {} claims out of {} total (Page {}/{})",
                username, claims.getNumberOfElements(), claims.getTotalElements(),
                claims.getNumber() + 1, claims.getTotalPages());

        return ResponseEntity.ok(claims);
    }

    @PostMapping("/{claimId}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Approve warranty claim",
            description = "EVM Staff approve a warranty claim with cost authorization")
    public ResponseEntity<ClaimResponseDto> approveClaim(
            @PathVariable Integer claimId,
            @Valid @RequestBody EVMApprovalRequestDTO request,
            Authentication authentication) {

        String username = authentication.getName();
        log.info("EVM Staff {} approving claim ID: {}", username, claimId);

        ClaimResponseDto approvedClaim = evmClaimService.approveClaim(claimId, request, username);

        log.info("Claim {} approved successfully by EVM Staff {}", claimId, username);
        return ResponseEntity.ok(approvedClaim);
    }

    @PostMapping("/{claimId}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Reject warranty claim",
            description = "EVM Staff reject a warranty claim with detailed reasoning")
    public ResponseEntity<ClaimResponseDto> rejectClaim(
            @PathVariable Integer claimId,
            @Valid @RequestBody EVMRejectionRequestDTO request,
            Authentication authentication) {

        String username = authentication.getName();
        log.info("EVM Staff {} rejecting claim ID: {}", username, claimId);

        ClaimResponseDto rejectedClaim = evmClaimService.rejectClaim(claimId, request, username);

        log.info("Claim {} rejected successfully by EVM Staff {}", claimId, username);
        return ResponseEntity.ok(rejectedClaim);
    }

    @GetMapping("/{claimId}/review")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get claim details for review",
            description = "Get detailed claim information for EVM review and decision making")
    public ResponseEntity<ClaimResponseDto> getClaimForReview(
            @PathVariable Integer claimId,
            Authentication authentication) {

        String username = authentication.getName();
        log.info("EVM Staff {} reviewing claim ID: {}", username, claimId);

        ClaimResponseDto claim = evmClaimService.getClaimForReview(claimId);
        return ResponseEntity.ok(claim);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get pending claims for approval",
            description = "Get all claims awaiting EVM approval with filtering capabilities")
    public ResponseEntity<Page<EVMClaimSummaryDTO>> getPendingClaims(
            @Valid @ModelAttribute EVMClaimFilterRequestDTO filter,
            Authentication authentication) {

        String username = authentication.getName();
        log.info("EVM Staff {} accessing pending claims", username);

        Page<EVMClaimSummaryDTO> pendingClaims = evmClaimService.getPendingClaims(filter);

        log.info("EVM Staff {} retrieved {} pending claims", username, pendingClaims.getNumberOfElements());
        return ResponseEntity.ok(pendingClaims);
    }
}