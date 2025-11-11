package com.ev.warranty.model.dto.part;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehiclePartsResponseDTO {
    private String vin;
    private String model;
    private Integer year;
    private String customerName;
    private List<PartSerialDTO> installedParts; // OEM parts
    private List<com.ev.warranty.model.dto.thirdparty.ThirdPartyPartSerialDTO> thirdPartyParts; // Third-party parts
    private Integer totalParts;
}

