package com.ev.warranty.ai.model.dto;

import lombok.Data;

@Data
public class CostPredictionRequestDTO {
    private String forecastPeriod; // e.g., NEXT_3_MONTHS, NEXT_6_MONTHS, NEXT_12_MONTHS
    private String granularity = "MONTHLY"; // DAILY, WEEKLY, MONTHLY
    private String vehicleModel; // optional
    private boolean includeConfidenceInterval = true;
}

