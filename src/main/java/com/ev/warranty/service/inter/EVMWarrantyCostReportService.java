package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.cost.WarrantyCostReportRequestDTO;
import com.ev.warranty.model.dto.cost.WarrantyCostReportResponseDTO;

public interface EVMWarrantyCostReportService {

    /**
     * Generate comprehensive warranty cost report for EVM analysis
     */
    WarrantyCostReportResponseDTO generateCostReport(WarrantyCostReportRequestDTO request, String generatedBy);

    /**
     * Generate quick summary report for dashboard
     */
    WarrantyCostReportResponseDTO.ExecutiveSummaryDTO generateQuickSummary(
            java.time.LocalDate startDate,
            java.time.LocalDate endDate
    );
}
