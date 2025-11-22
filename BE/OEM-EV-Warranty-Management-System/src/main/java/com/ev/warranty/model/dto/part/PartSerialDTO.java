package com.ev.warranty.model.dto.part;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartSerialDTO {
    private Integer id;
    private Integer partId;
    private String partNumber;
    private String partName;
    private String partType; // CAR, MOTORCYCLE, SCOOTER, EBIKE, etc.
    private String serialNumber;
    private LocalDate manufactureDate;
    private String status;
    private Integer installedOnVehicleId;
    private String installedOnVehicleVin;
    private LocalDateTime installedAt;
    private String installedByUsername;
}

