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

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get dashboard summary",
            description = "Get comprehensive dashboard summary for EVM staff")
    public ResponseEntity<?> getDashboardSummary(Authentication authentication) {
        String username = authentication.getName();
        log.info("EVM Staff {} accessing dashboard summary", username);
        
        // TODO: Implement dashboard summary in service
        return ResponseEntity.ok(java.util.Map.of(
            "message", "Dashboard summary endpoint - implementation pending",
            "status", "ok",
            "suggestions", java.util.List.of(
                "Total active claims",
                "Pending approvals",
                "Total warranty cost this month",
                "Top performing service centers",
                "Claim resolution time metrics",
                "Cost trends"
            )
        ));
    }
}
