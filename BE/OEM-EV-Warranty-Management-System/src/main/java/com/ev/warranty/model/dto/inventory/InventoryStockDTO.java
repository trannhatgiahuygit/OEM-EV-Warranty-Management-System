package com.ev.warranty.model.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InventoryStockDTO {

    private Integer id;
    private Integer warehouseId;
    private String warehouseName;
    private String warehouseLocation;
    
    private Integer partId;
    private String partNumber;
    private String partName;
    private String partCategory;
    private String partDescription;
    
    private Integer currentStock;
    private Integer reservedStock;
    private Integer availableStock;
    private Integer minimumStock;
    private Integer maximumStock;
    
    private BigDecimal unitCost;
    private BigDecimal totalValue;
    
    private String stockStatus; // in_stock, low_stock, out_of_stock, overstock
    private LocalDateTime lastUpdated;
    private String lastUpdatedBy;
    
    // Stock alerts
    private Boolean lowStockAlert;
    private Boolean outOfStockAlert;
    private Integer daysUntilStockout;
}
