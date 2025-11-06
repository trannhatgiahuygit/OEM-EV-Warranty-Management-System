package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.dashboard.SCDashboardSummaryDTO;
import com.ev.warranty.repository.AppointmentRepository;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SCDashboardServiceImpl implements com.ev.warranty.service.inter.SCDashboardService {

    private final ClaimRepository claimRepository;
    private final AppointmentRepository appointmentRepository;
    private final WorkOrderRepository workOrderRepository;

    @Override
    public SCDashboardSummaryDTO getSummaryForServiceCenter(Integer serviceCenterId) {
        // Note: serviceCenterId is not directly linked in entities; using approximations.
        // Active claims: OPEN, IN_PROGRESS
        long totalActiveClaims = claimRepository.findByStatusCode("OPEN").size()
                + claimRepository.findByStatusCode("IN_PROGRESS").size();
        long pendingClaims = claimRepository.findClaimsPendingApproval().size();

        // Today's appointments
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.atTime(LocalTime.MAX);
        long todayAppointments = appointmentRepository.findTodayScheduledAppointments(start, end).size();

        // Active work orders: endTime is null
        long activeWorkOrders = workOrderRepository.findAll().stream()
                .filter(wo -> wo.getEndTime() == null)
                .count();

        return SCDashboardSummaryDTO.builder()
                .totalActiveClaims(totalActiveClaims)
                .pendingClaims(pendingClaims)
                .todayAppointments(todayAppointments)
                .activeWorkOrders(activeWorkOrders)
                .highlights(List.of("SC summary based on global stats", "Filter by center can be added later"))
                .build();
    }
}

