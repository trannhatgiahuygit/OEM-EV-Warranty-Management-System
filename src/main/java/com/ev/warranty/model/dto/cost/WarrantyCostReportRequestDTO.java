package com.ev.warranty.model.dto.cost;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class WarrantyCostReportRequestDTO {

    // Required date range for report
    @NotNull(message = "Report start date is required")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate reportStartDate;

    @NotNull(message = "Report end date is required")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate reportEndDate;

    // Report type
    private String reportType = "SUMMARY"; // SUMMARY, DETAILED, TREND_ANALYSIS

    // Grouping options
    private String groupBy = "MONTH"; // DAY, WEEK, MONTH, QUARTER, YEAR

    // Filters
    private List<String> vehicleModels;
    private List<String> regions;
    private List<String> statusCodes;
    private List<String> categories; // BATTERY, MOTOR, ELECTRONICS, etc.

    // Cost thresholds
    private Boolean includeZeroCostClaims = true;
    private java.math.BigDecimal minCostThreshold;
    private java.math.BigDecimal maxCostThreshold;

    // Comparison options
    private Boolean includePreviousPeriod = false; // For YoY, MoM comparison
    private String comparisonType; // YOY (Year over Year), MOM (Month over Month)
}
