package com.ev.warranty.model.dto.thirdparty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThirdPartyPartSerialDTO {
    private Integer id;
    private Integer thirdPartyPartId;
    private String serialNumber;
    private String status;
    private Integer serviceCenterId;
    private String installedBy;
    private LocalDateTime installedAt;
    private Integer workOrderId;
    private Integer vehicleId; // ID of vehicle this serial is installed on
    private String vehicleVin; // VIN of vehicle this serial is installed on
    
    // Part information for display (mapped from ThirdPartyPart entity)
    private String partNumber; // Part number from ThirdPartyPart
    private String partName; // Part name from ThirdPartyPart
    private String category; // Category from ThirdPartyPart
}

