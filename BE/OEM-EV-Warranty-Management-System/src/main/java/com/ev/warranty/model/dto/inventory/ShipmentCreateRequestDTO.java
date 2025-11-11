package com.ev.warranty.model.dto.inventory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ShipmentCreateRequestDTO {

    @NotNull(message = "Warehouse ID is required")
    private Integer warehouseId;

    @NotNull(message = "Destination center ID is required")
    private Integer destinationCenterId;

    @NotNull(message = "Shipped at date is required")
    private LocalDateTime shippedAt;

    @Builder.Default
    private String status = "pending"; // pending, in_transit, delivered, cancelled

    private String trackingNumber;
    private String carrier;
    private String notes;

    @NotEmpty(message = "Shipment items are required")
    @Valid
    private List<ShipmentItemDTO> items;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ShipmentItemDTO {
        @NotNull(message = "Part ID is required")
        private Integer partId;
        
        @NotNull(message = "Quantity is required")
        private Integer quantity;
        
        private String notes;
    }
}
