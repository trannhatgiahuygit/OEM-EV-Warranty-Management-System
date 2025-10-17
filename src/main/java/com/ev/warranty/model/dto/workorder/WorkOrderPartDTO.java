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

    @NotNull(message = "Part Serial ID is required")
    private Integer partSerialId;

    private String partSerialNumber;
    private String partName;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String notes;
}
