package com.ev.warranty.service;

import com.ev.warranty.model.dto.dashboard.SCDashboardSummaryDTO;
import com.ev.warranty.repository.AppointmentRepository;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.WorkOrderRepository;
import com.ev.warranty.service.impl.SCDashboardServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class SCDashboardServiceImplTest {

    @Mock ClaimRepository claimRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock WorkOrderRepository workOrderRepository;

    @InjectMocks SCDashboardServiceImpl service;

    @Test
    void summary_shouldAggregateMetrics() {
        given(claimRepository.findByStatusCode("OPEN")).willReturn(List.of(new com.ev.warranty.model.entity.Claim()));
        given(claimRepository.findByStatusCode("IN_PROGRESS")).willReturn(List.of(new com.ev.warranty.model.entity.Claim()));
        given(claimRepository.findClaimsPendingApproval()).willReturn(Collections.emptyList());
        given(appointmentRepository.findTodayScheduledAppointments(any(LocalDateTime.class), any(LocalDateTime.class))).willReturn(List.of(new com.ev.warranty.model.entity.Appointment()));
        given(workOrderRepository.findAll()).willReturn(List.of(new com.ev.warranty.model.entity.WorkOrder()));

        SCDashboardSummaryDTO summary = service.getSummaryForServiceCenter(null);
        assertThat(summary.getTotalActiveClaims()).isEqualTo(2);
        assertThat(summary.getPendingClaims()).isEqualTo(0);
        assertThat(summary.getTodayAppointments()).isEqualTo(1);
        assertThat(summary.getActiveWorkOrders()).isEqualTo(1);
    }
}

