package com.ev.warranty.model.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SCDashboardSummaryDTO {
    private long totalActiveClaims;
    private long pendingClaims;
    private long todayAppointments;
    private long activeWorkOrders;

    private List<String> highlights; // optional quick notes
}

