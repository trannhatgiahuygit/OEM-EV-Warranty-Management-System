package com.ev.warranty.controller;

import com.ev.warranty.model.dto.dashboard.SCDashboardSummaryDTO;
import com.ev.warranty.service.inter.SCDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sc/dashboard")
@RequiredArgsConstructor
@Tag(name = "SC Dashboard", description = "Service Center dashboard APIs")
public class SCDashboardController {

    private final SCDashboardService scDashboardService;
    private final com.ev.warranty.repository.AppointmentRepository appointmentRepository;
    private final com.ev.warranty.repository.ClaimRepository claimRepository;
    private final com.ev.warranty.repository.WorkOrderRepository workOrderRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get SC dashboard summary", description = "Quick overview for service center")
    public ResponseEntity<SCDashboardSummaryDTO> getSummary(@RequestParam(required = false) Integer serviceCenterId) {
        return ResponseEntity.ok(scDashboardService.getSummaryForServiceCenter(serviceCenterId));
    }

    @GetMapping("/today-appointments")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get today's appointments")
    public ResponseEntity<?> getTodayAppointments() {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDateTime start = today.atStartOfDay();
        java.time.LocalDateTime end = today.atTime(java.time.LocalTime.MAX);
        return ResponseEntity.ok(appointmentRepository.findTodayScheduledAppointments(start, end));
    }

    @GetMapping("/pending-claims")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get pending approval claims")
    public ResponseEntity<?> getPendingClaims() {
        return ResponseEntity.ok(claimRepository.findClaimsPendingApproval());
    }

    @GetMapping("/active-workorders")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get active work orders")
    public ResponseEntity<?> getActiveWorkOrders() {
        return ResponseEntity.ok(workOrderRepository.findAll().stream().filter(wo -> wo.getEndTime() == null).toList());
    }
}
