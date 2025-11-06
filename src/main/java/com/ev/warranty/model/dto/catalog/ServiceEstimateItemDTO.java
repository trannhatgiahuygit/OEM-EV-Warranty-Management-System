package com.ev.warranty.model.dto.catalog;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceEstimateItemDTO {

    @NotNull(message = "Item ID is required")
    private Integer itemId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    // Optional fields populated in response
    private String itemName;
    private String itemCode;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String itemType; // PART or SERVICE
}
