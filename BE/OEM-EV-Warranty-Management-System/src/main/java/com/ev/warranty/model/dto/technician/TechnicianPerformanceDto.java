package com.ev.warranty.model.dto.technician;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TechnicianPerformanceDto {
    private Integer technicianId;
    private String technicianName;
    private Integer totalClaims;
    private Integer completedClaims;
    private Integer pendingClaims;
    private Double averageCompletionDays;
    private BigDecimal totalRepairCost;
    private Double customerSatisfactionScore;
    private Integer onTimeCompletions;
    private Double onTimeCompletionRate;
}