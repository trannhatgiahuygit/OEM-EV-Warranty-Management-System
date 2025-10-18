package com.ev.warranty.model.dto.part;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PartFailureStatsResponseDTO {

    // Report metadata
    private String reportId;
    private LocalDate analysisStartDate;
    private LocalDate analysisEndDate;
    private LocalDateTime generatedAt;
    private String generatedBy;

    // Executive summary
    private ExecutiveSummaryDTO executiveSummary;

    // Detailed breakdowns
    private List<PartFailureStatsDTO> partStatistics;
    private List<CategoryFailureStatsDTO> categoryStatistics;
    private List<TimeBasedStatsDTO> timeBasedStatistics;
    private List<VehicleModelStatsDTO> vehicleModelStatistics;

    // Risk analysis
    private RiskAnalysisDTO riskAnalysis;

    // Recommendations
    private List<String> recommendations;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ExecutiveSummaryDTO {
        private Integer totalFailures;
        private Integer uniquePartsAffected;
        private Integer totalVehiclesAffected;
        private BigDecimal totalFailureCost;
        private BigDecimal averageCostPerFailure;
        private String mostFailedPartCategory;
        private String mostFailedPartNumber;
        private BigDecimal overallFailureRate;          // Failures per 1000 vehicles
        private String riskTrend;                       // INCREASING, STABLE, DECREASING
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class PartFailureStatsDTO {
        private String partNumber;
        private String partName;
        private String category;
        private Integer failureCount;
        private Integer totalPartsProduced;
        private BigDecimal failureRate;                 // Percentage
        private BigDecimal totalFailureCost;
        private BigDecimal averageCostPerFailure;
        private Integer vehiclesAffected;
        private String riskLevel;                       // LOW, MEDIUM, HIGH, CRITICAL
        private List<String> commonFailureModes;
        private Boolean recallIssued;
        private LocalDate firstFailureDate;
        private LocalDate lastFailureDate;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CategoryFailureStatsDTO {
        private String category;
        private Integer failureCount;
        private Integer uniqueParts;
        private BigDecimal totalCost;
        private BigDecimal failureRate;
        private String riskLevel;
        private String trend;                           // vs previous period
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class TimeBasedStatsDTO {
        private String period;                          // "2024-01", "2024-Q1"
        private LocalDate periodStart;
        private LocalDate periodEnd;
        private Integer failureCount;
        private BigDecimal totalCost;
        private BigDecimal failureRate;
        private String trend;                           // vs previous period
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class VehicleModelStatsDTO {
        private String vehicleModel;
        private Integer vehicleYear;
        private Integer failureCount;
        private Integer totalVehicles;
        private BigDecimal failureRate;                 // Failures per vehicle
        private BigDecimal totalCost;
        private String qualityRating;                   // EXCELLENT, GOOD, FAIR, POOR
        private List<String> topFailedParts;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class RiskAnalysisDTO {
        private List<String> highRiskParts;
        private List<String> emergingRisks;            // Parts showing increasing failure rates
        private List<String> qualityImprovements;      // Parts with decreasing failure rates
        private List<String> recallCandidates;         // Parts that may need recall
        private BigDecimal predictedNextMonthFailures;
        private String overallQualityTrend;
    }
}