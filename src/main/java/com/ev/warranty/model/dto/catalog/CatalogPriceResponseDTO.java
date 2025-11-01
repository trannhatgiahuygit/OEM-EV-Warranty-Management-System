package com.ev.warranty.model.dto.catalog;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogPriceResponseDTO {

    private Integer id;
    private String itemType;
    private Integer itemId;
    private String itemName; // Name of the part or service
    private String itemCode; // Code of the part or service
    private BigDecimal price;
    private String currency;
    private String region;
    private Integer serviceCenterId;
    private String serviceCenterName;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Computed fields
    private Boolean isCurrentlyEffective;
    private Integer daysUntilExpiry;
    private Boolean isRegionalPrice;
    private Boolean isServiceCenterSpecific;
}
