package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EVMApprovalRequestDTO {

    @NotBlank(message = "Approval notes are required")
    private String approvalNotes;

    @NotNull(message = "Warranty cost is required")
    @PositiveOrZero(message = "Warranty cost must be positive or zero")
    private BigDecimal warrantyCost;

    private String approvedBy;

    private String internalNotes;
}
