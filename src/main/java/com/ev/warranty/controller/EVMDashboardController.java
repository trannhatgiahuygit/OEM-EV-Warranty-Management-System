package com.ev.warranty.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/evm/dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "EVM Dashboard", description = "EVM Staff dashboard and analytics APIs")
public class EVMDashboardController {

    private final com.ev.warranty.repository.ClaimRepository claimRepository;
    private final com.ev.warranty.repository.InventoryRepository inventoryRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get dashboard summary",
            description = "Get comprehensive dashboard summary for EVM staff")
    public ResponseEntity<?> getDashboardSummary(Authentication authentication) {
        String username = authentication.getName();
        log.info("EVM Staff {} accessing dashboard summary", username);

        long pendingApproval = claimRepository.findClaimsPendingApproval().size();
        long openClaims = claimRepository.findByStatusCode("OPEN").size();
        long inProgress = claimRepository.findByStatusCode("IN_PROGRESS").size();
        long lowStockCount = inventoryRepository.findLowStockItems().size();

        return ResponseEntity.ok(java.util.Map.of(
            "pendingApprovals", pendingApproval,
            "openClaims", openClaims,
            "inProgressClaims", inProgress,
            "lowStockItems", lowStockCount
        ));
    }
}
