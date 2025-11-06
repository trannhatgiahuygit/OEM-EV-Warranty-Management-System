package com.ev.warranty.model.dto.servicehistory;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ServiceHistoryResponseDTO {
    private Integer id;
    private Integer vehicleId;
    private String vehicleVin;
    private Integer customerId;
    private String customerName;
    private String serviceType;
    private String description;
    private LocalDateTime performedAt;
    private String performedByName;
    private Integer mileageKm;
}

