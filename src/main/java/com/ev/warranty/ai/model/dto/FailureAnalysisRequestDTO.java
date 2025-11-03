package com.ev.warranty.ai.model.dto;

import lombok.Data;

@Data
public class FailureAnalysisRequestDTO {
    private String timeframe; // e.g., LAST_3_MONTHS, LAST_6_MONTHS, LAST_12_MONTHS, CUSTOM
    private String startDate; // ISO yyyy-MM-dd (optional if CUSTOM)
    private String endDate;   // ISO yyyy-MM-dd (optional if CUSTOM)
    private String vehicleModel; // optional filter
    private String partCategory; // optional filter
    private String groupBy; // PART, MODEL, CATEGORY
    private Integer topN = 10; // limit results
}

