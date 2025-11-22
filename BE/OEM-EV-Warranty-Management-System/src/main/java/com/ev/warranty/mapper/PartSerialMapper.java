package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.part.PartSerialDTO;
import com.ev.warranty.model.entity.PartSerial;
import org.springframework.stereotype.Component;

@Component
public class PartSerialMapper {

    public PartSerialDTO toDTO(PartSerial partSerial) {
        if (partSerial == null) {
            return null;
        }

        return PartSerialDTO.builder()
                .id(partSerial.getId())
                .partId(partSerial.getPart() != null ? partSerial.getPart().getId() : null)
                .partNumber(partSerial.getPart() != null ? partSerial.getPart().getPartNumber() : null)
                .partName(partSerial.getPart() != null ? partSerial.getPart().getName() : null)
                .partType(partSerial.getPart() != null ? partSerial.getPart().getType() : null)
                .serialNumber(partSerial.getSerialNumber())
                .manufactureDate(partSerial.getManufactureDate())
                .status(partSerial.getStatus())
                .installedOnVehicleId(partSerial.getInstalledOnVehicle() != null ?
                        partSerial.getInstalledOnVehicle().getId() : null)
                .installedOnVehicleVin(partSerial.getInstalledOnVehicle() != null ?
                        partSerial.getInstalledOnVehicle().getVin() : null)
                .installedAt(partSerial.getInstalledAt())
                .build();
    }
}

