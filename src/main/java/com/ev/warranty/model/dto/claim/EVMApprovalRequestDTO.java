package com.ev.warranty.model.dto.claim;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EVMApprovalRequestDTO {

    @NotNull(message = "Approval notes are required")
    private String approvalNotes;

    @PositiveOrZero(message = "Warranty cost must be positive or zero")
    private BigDecimal warrantyCost;

    private String approvalReason; // APPROVED_BY_POLICY, APPROVED_WITH_EXCEPTION, etc.

    @Builder.Default
    private Boolean requiresPartsShipment = false;

    private String specialInstructions; // Any special handling instructions

    private String internalNotes; // Internal notes for EVM staff only

    @PositiveOrZero(message = "Company paid cost must be positive or zero")
    private BigDecimal companyPaidCost; // Chi phí bảo hành hãng chi trả

    // ===== NEW: Part assignments to vehicle =====
    private List<PartAssignmentDto> partAssignments; // Parts to assign/install on vehicle

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class PartAssignmentDto {
        private Integer partId;
        private String serialNumber; // Serial number of the part to install
        private String notes; // Optional notes for installation
    }
}