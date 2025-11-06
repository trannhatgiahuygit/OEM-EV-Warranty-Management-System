package com.ev.warranty.model.dto.claim;

import lombok.Data;

@Data
public class VehicleInfoDto {
    private Integer id;
    private String vin;
    private String model;
    private Integer year;
    private Integer mileageKm;
}
