package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.part.PartFailureStatsRequestDTO;
import com.ev.warranty.model.dto.part.PartFailureStatsResponseDTO;

public interface PartFailureStatsService {

    /**
     * Generate comprehensive part failure statistics report
     */
    PartFailureStatsResponseDTO generatePartFailureStats(
            PartFailureStatsRequestDTO request,
            String generatedBy
    );

    /**
     * Get quick part failure summary
     */
    PartFailureStatsResponseDTO.ExecutiveSummaryDTO getQuickFailureStats(
            String startDate,
            String endDate
    );
}