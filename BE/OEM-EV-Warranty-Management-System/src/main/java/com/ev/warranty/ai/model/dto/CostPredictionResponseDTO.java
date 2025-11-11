package com.ev.warranty.ai.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CostPredictionResponseDTO {
    private String predictionId;
    private LocalDateTime generatedAt;
    private String aiModel;
    private BigDecimal historicalAverage;
    private List<PredictionPoint> predictions;
    private BigDecimal totalForecast;
    private TrendSummary trends;
    private List<String> recommendations;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PredictionPoint {
        private String period; // e.g., 2025-12
        private BigDecimal predictedCost;
        private BigDecimal lowerBound;
        private BigDecimal upperBound;
        private Double confidence;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrendSummary {
        private String overallTrend; // INCREASING/DECREASING/STABLE
        private Double changePercent;
        private List<String> keyDrivers;
    }
}

