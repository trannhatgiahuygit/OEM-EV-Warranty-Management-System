package com.ev.warranty.model.dto.catalog;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceItemResponseDTO {

    private Integer id;
    private String serviceCode;
    private String name;
    private String description;
    private BigDecimal standardLaborHours;
    private String category;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Computed fields
    private BigDecimal currentPrice; // Current effective price from catalog
    private String priceRegion;
    private Boolean hasPricing;
}
