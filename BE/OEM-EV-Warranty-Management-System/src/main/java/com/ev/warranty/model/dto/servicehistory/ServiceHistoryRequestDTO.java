package com.ev.warranty.model.dto.servicehistory;

import lombok.Data;

@Data
public class ServiceHistoryRequestDTO {
    private Integer vehicleId;
    private Integer customerId;
    private String serviceType;
    private String description;
    private Integer performedById;
    private Integer mileageKm;
}

