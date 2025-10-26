package com.ev.warranty.model.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ShipmentResponseDTO {

    private Integer id;
    private Integer warehouseId;
    private String warehouseName;
    private String warehouseLocation;
    
    private Integer destinationCenterId;
    private String destinationCenterName;
    private String destinationCenterLocation;
    
    private String status;
    private String trackingNumber;
    private String carrier;
    private String notes;
    
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime createdAt;
    private String createdBy;
    
    private Integer totalItems;
    private Integer totalQuantity;
    private BigDecimal totalValue;
    
    private List<ShipmentItemResponseDTO> items;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ShipmentItemResponseDTO {
        private Integer id;
        private Integer partId;
        private String partNumber;
        private String partName;
        private Integer quantity;
        private BigDecimal unitCost;
        private BigDecimal totalCost;
        private String notes;
    }
}
