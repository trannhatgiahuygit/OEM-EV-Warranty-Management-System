package com.ev.warranty.model.dto.workorder;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderCreateRequestDTO {

    @NotNull(message = "Claim ID is required")
    private Integer claimId;

    @NotNull(message = "Technician ID is required")
    private Integer technicianId;

    private LocalDateTime startTime;

    private String description;

    private BigDecimal estimatedLaborHours;

    // ===== NEW: Work Order type =====
    private String workOrderType; // EVM or SC (can be inferred from claim's repairType)
}
