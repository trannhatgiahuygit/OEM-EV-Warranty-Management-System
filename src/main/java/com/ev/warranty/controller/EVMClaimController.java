package com.ev.warranty.controller;

import com.ev.warranty.model.dto.claim.EVMClaimSummaryDTO;
import com.ev.warranty.model.dto.claim.EVMClaimFilterRequestDTO;
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
}