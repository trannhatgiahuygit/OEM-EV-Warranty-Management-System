package com.ev.warranty.model.dto.catalog;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceUpdateResultDTO {

    private Integer priceId;
    private String itemType;
    private Integer itemId;
    private String itemName;
    private BigDecimal oldPrice;
    private BigDecimal newPrice;
    private Boolean success;
    private String errorMessage;
}
