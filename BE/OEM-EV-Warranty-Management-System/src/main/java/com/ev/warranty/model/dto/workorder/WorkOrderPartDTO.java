package com.ev.warranty.model.dto.workorder;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderPartDTO {

    private Integer id;

    private Integer partSerialId; // optional if using third-party part
    private String partSerialNumber;
    private String partName;
    private String partType; // CAR, MOTORCYCLE, SCOOTER, EBIKE, etc.

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String notes;

    // ===== NEW: Third-party support =====
    private String partSource; // EVM_WAREHOUSE or THIRD_PARTY
    private Integer thirdPartyPartId;
    private String thirdPartySerialNumber;
}
