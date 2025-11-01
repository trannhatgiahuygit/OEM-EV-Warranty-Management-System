package com.ev.warranty.model.dto.catalog;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogPriceUpdateRequestDTO {

    @Positive(message = "Price must be positive")
    private BigDecimal price;

    private String currency;
    private String region;
    private Integer serviceCenterId;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
}
