package com.ev.warranty.model.dto.shipment;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ShipmentDTO {
    private Integer id;
    private String trackingNumber;
    private String carrier;
    private String status;
    private Integer destinationCenterId;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private Integer claimId;
    private Integer workOrderId;
}
