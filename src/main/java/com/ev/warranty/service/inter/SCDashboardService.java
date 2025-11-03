package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.dashboard.SCDashboardSummaryDTO;

public interface SCDashboardService {
    SCDashboardSummaryDTO getSummaryForServiceCenter(Integer serviceCenterId);
}

