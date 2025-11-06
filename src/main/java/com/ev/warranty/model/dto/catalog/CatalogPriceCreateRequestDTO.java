package com.ev.warranty.model.dto.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CatalogPriceCreateRequestDTO {

    @NotBlank(message = "Item type is required (PART or SERVICE)")
    private String itemType; // PART or SERVICE

    @NotNull(message = "Item ID is required")
    private Integer itemId; // FK to Part.id or ServiceItem.id

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @Builder.Default
    private String currency = "VND";

    private String region; // Optional: for regional pricing

    private Integer serviceCenterId; // Optional: for service center specific pricing

    @NotNull(message = "Effective from date is required")
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo; // Optional: end date for pricing
}
