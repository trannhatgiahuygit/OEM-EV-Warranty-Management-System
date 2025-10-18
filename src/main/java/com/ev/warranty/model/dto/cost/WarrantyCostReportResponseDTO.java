package com.ev.warranty.model.dto.cost;

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
public class WarrantyCostReportResponseDTO {

    // Report metadata
    private String reportId;
    private String reportType;
    private LocalDate reportStartDate;
    private LocalDate reportEndDate;
    private LocalDateTime generatedAt;
    private String generatedBy;

    // Executive summary
    private ExecutiveSummaryDTO executiveSummary;

    // Time-based breakdown
    private List<PeriodCostDTO> periodBreakdown;

    // Category analysis
    private List<CategoryCostDTO> categoryBreakdown;

    // Vehicle model analysis
    private List<VehicleModelCostDTO> vehicleModelBreakdown;

    // Regional analysis
    private List<RegionalCostDTO> regionalBreakdown;

    // Top expensive claims
    private List<TopClaimDTO> topExpensiveClaims;

    // Trends and insights
    private TrendAnalysisDTO trendAnalysis;

    // Comparison data (if requested)
    private ComparisonDataDTO comparisonData;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ExecutiveSummaryDTO {
        // ✅ EXISTING FIELDS
        private BigDecimal totalWarrantyCost;
        private Integer totalClaims;
        private BigDecimal averageCostPerClaim;
        private BigDecimal highestSingleClaim;
        private Integer approvedClaims;
        private Integer pendingClaims;
        private Integer rejectedClaims;
        private BigDecimal approvalRate; // Percentage
        private BigDecimal costPerVehicle; // Total cost / total vehicles in system
        private String costTrend; // INCREASING, STABLE, DECREASING

        // ✅ NEW: Enhanced warranty-specific metrics
        private Integer companyPaidClaims;           // In-warranty claims (company pays)
        private Integer customerPaidClaims;          // Out-of-warranty claims (customer pays)
        private BigDecimal customerRevenue;          // Revenue from out-of-warranty repairs
        private BigDecimal netWarrantyCost;          // Company cost - customer revenue
        private BigDecimal warrantyUtilizationRate; // % of claims that used warranty
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class PeriodCostDTO {
        private String periodLabel; // "2024-01", "2024-Q1", "Week 42-2024"
        private LocalDate periodStart;
        private LocalDate periodEnd;
        private BigDecimal totalCost;
        private Integer claimCount;
        private BigDecimal averageCost;
        private BigDecimal percentageOfTotal;
        private String trend; // vs previous period
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CategoryCostDTO {
        private String category; // BATTERY, MOTOR, ELECTRONICS, etc.
        private BigDecimal totalCost;
        private Integer claimCount;
        private BigDecimal averageCost;
        private BigDecimal percentageOfTotal;
        private String riskLevel; // Based on frequency and cost
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class VehicleModelCostDTO {
        private String model;
        private Integer year;
        private BigDecimal totalCost;
        private Integer claimCount;
        private Integer totalVehicles; // Total vehicles of this model
        private BigDecimal costPerVehicle;
        private BigDecimal claimRate; // Claims per 100 vehicles
        private String qualityRating; // EXCELLENT, GOOD, FAIR, POOR
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class RegionalCostDTO {
        private String region;
        private BigDecimal totalCost;
        private Integer claimCount;
        private BigDecimal averageCost;
        private BigDecimal percentageOfTotal;
        private Double averageDaysToApproval;
        private String performance; // EXCELLENT, GOOD, FAIR, POOR
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class TopClaimDTO {
        private String claimNumber;
        private BigDecimal warrantyCost;
        private String vehicleModel;
        private String vehicleVin;
        private String category;
        private String reportedFailure;
        private LocalDate createdDate;
        private String status;
        private String region;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class TrendAnalysisDTO {
        private String overallTrend; // INCREASING, STABLE, DECREASING
        private BigDecimal trendPercentage; // % change vs previous period
        private List<String> riskFactors; // Identified risk patterns
        private List<String> costDrivers; // Main contributors to high costs
        private List<String> recommendations; // Business recommendations
        private String forecastNextPeriod; // Predicted trend
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ComparisonDataDTO {
        private String comparisonType; // YOY, MOM
        private String comparisonPeriod;
        private BigDecimal previousPeriodCost;
        private BigDecimal currentPeriodCost;
        private BigDecimal changeAmount;
        private BigDecimal changePercentage;
        private String changeDirection; // INCREASE, DECREASE, STABLE
    }
}