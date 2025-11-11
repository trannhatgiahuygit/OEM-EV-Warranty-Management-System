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
public class PriceUpdateItemDTO {

    @NotNull(message = "Price ID is required")
    private Integer priceId;

    @NotNull(message = "New price is required")
    @Positive(message = "New price must be positive")
    private BigDecimal newPrice;

    private String reason; // Reason for price change
}
