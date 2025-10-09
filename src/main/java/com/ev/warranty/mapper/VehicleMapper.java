package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.VehicleResponseDTO;
import com.ev.warranty.model.entity.PartSerial;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.repository.PartSerialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class VehicleMapper {

    private final PartSerialRepository partSerialRepository;

    public VehicleResponseDTO toResponseDTO(Vehicle vehicle) {
        if (vehicle == null) {
            return null;
        }

        // Get installed parts for this vehicle
        List<PartSerial> installedParts = partSerialRepository.findByInstalledOnVehicleId(vehicle.getId());

        return VehicleResponseDTO.builder()
                .id(vehicle.getId())
                .vin(vehicle.getVin())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .registrationDate(vehicle.getRegistrationDate())
                .warrantyStart(vehicle.getWarrantyStart())
                .warrantyEnd(vehicle.getWarrantyEnd())
                .warrantyStatus(calculateWarrantyStatus(vehicle.getWarrantyEnd()))
                .warrantyYearsRemaining(calculateWarrantyYearsRemaining(vehicle.getWarrantyEnd()))
                .createdAt(vehicle.getCreatedAt())
                .customer(mapCustomerSummary(vehicle))
                .installedParts(mapInstalledParts(installedParts))
                .build();
    }

    private VehicleResponseDTO.CustomerSummaryDTO mapCustomerSummary(Vehicle vehicle) {
        if (vehicle.getCustomer() == null) {
            return null;
        }

        return VehicleResponseDTO.CustomerSummaryDTO.builder()
                .id(vehicle.getCustomer().getId())
                .name(vehicle.getCustomer().getName())
                .email(vehicle.getCustomer().getEmail())
                .phone(vehicle.getCustomer().getPhone())
                .address(vehicle.getCustomer().getAddress())
                .isNewCustomer(false) // Will be set by service if needed
                .build();
    }

    private List<VehicleResponseDTO.InstalledPartDTO> mapInstalledParts(List<PartSerial> partSerials) {
        return partSerials.stream()
                .map(this::mapInstalledPart)
                .collect(Collectors.toList());
    }

    private VehicleResponseDTO.InstalledPartDTO mapInstalledPart(PartSerial partSerial) {
        return VehicleResponseDTO.InstalledPartDTO.builder()
                .partId(partSerial.getPart().getId())
                .partNumber(partSerial.getPart().getPartNumber())
                .partName(partSerial.getPart().getName())
                .category(partSerial.getPart().getCategory())
                .serialNumber(partSerial.getSerialNumber())
                .manufactureDate(partSerial.getManufactureDate())
                .installedAt(partSerial.getInstalledAt())
                .status(partSerial.getStatus())
                .build();
    }

    private String calculateWarrantyStatus(LocalDate warrantyEnd) {
        if (warrantyEnd == null) {
            return "UNKNOWN";
        }

        LocalDate now = LocalDate.now();

        if (warrantyEnd.isBefore(now)) {
            return "EXPIRED";
        } else if (warrantyEnd.isBefore(now.plusMonths(6))) {
            return "EXPIRING_SOON";
        } else {
            return "ACTIVE";
        }
    }

    private Integer calculateWarrantyYearsRemaining(LocalDate warrantyEnd) {
        if (warrantyEnd == null || warrantyEnd.isBefore(LocalDate.now())) {
            return 0;
        }

        long monthsRemaining = ChronoUnit.MONTHS.between(LocalDate.now(), warrantyEnd);
        return Math.max(0, (int) (monthsRemaining / 12));
    }
}