package com.ev.warranty.model.dto.catalog;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceEstimateResponseDTO {

    // Breakdown by category
    private List<ServiceEstimateItemDTO> partItems;
    private List<ServiceEstimateItemDTO> serviceItems;

    // Totals
    private BigDecimal totalPartsAmount;
    private BigDecimal totalLaborAmount;
    private BigDecimal totalAmount;
    private String currency;

    // Estimate metadata
    private String region;
    private Integer serviceCenterId;
    private String estimatedBy;
    private String estimatedAt;

    // Additional info
    private Integer totalItems;
    private BigDecimal estimatedLaborHours;
    private String validUntil; // Estimate validity period
}
