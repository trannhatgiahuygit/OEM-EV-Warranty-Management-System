package com.ev.warranty.model.dto.claim;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ClaimSummaryDto {
    private Integer id;
    private String claimNumber;
    private String status;
    private String statusLabel;

    // Customer & Vehicle info
    private CustomerInfoDto customer;
    private VehicleInfoDto vehicle;

    // Timeline
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime completedAt;

    // Costs
    private BigDecimal warrantyCost;
    private BigDecimal companyPaidCost;

    // Summary fields
    private String reportedFailure;
    private String finalDiagnosis;
    private String repairSummary;
    private Integer totalLaborHours;

    // Progress
    private Integer completionPercentage;
    private List<ClaimStatusHistoryDto> statusHistory;
    private List<String> nextSteps;
}