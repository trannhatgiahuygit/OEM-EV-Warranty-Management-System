package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.policy.WarrantyConditionDTO;
import com.ev.warranty.model.entity.VehicleModel;
import com.ev.warranty.model.entity.WarrantyCondition;
import com.ev.warranty.repository.VehicleModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WarrantyConditionMapper {

    private final VehicleModelRepository vehicleModelRepository;

    public WarrantyConditionDTO toDto(WarrantyCondition entity) {
        if (entity == null) return null;
        return WarrantyConditionDTO.builder()
                .id(entity.getId())
                .vehicleModelId(entity.getVehicleModel() != null ? entity.getVehicleModel().getId() : null)
                .coverageYears(entity.getCoverageYears())
                .coverageKm(entity.getCoverageKm())
                .conditionsText(entity.getConditionsText())
                .effectiveFrom(entity.getEffectiveFrom())
                .effectiveTo(entity.getEffectiveTo())
                .active(entity.getActive())
                .updatedBy(entity.getUpdatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public WarrantyCondition toEntity(WarrantyConditionDTO dto) {
        if (dto == null) return null;
        WarrantyCondition.WarrantyConditionBuilder builder = WarrantyCondition.builder()
                .coverageYears(dto.getCoverageYears())
                .coverageKm(dto.getCoverageKm())
                .conditionsText(dto.getConditionsText())
                .effectiveFrom(dto.getEffectiveFrom())
                .effectiveTo(dto.getEffectiveTo())
                .active(dto.getActive())
                .updatedBy(dto.getUpdatedBy());
        if (dto.getVehicleModelId() != null) {
            VehicleModel vm = vehicleModelRepository.findById(dto.getVehicleModelId())
                    .orElse(null);
            builder.vehicleModel(vm);
        }
        return builder.build();
    }

    public void updateEntity(WarrantyCondition entity, WarrantyConditionDTO dto) {
        if (dto.getVehicleModelId() != null) {
            VehicleModel vm = vehicleModelRepository.findById(dto.getVehicleModelId())
                    .orElse(null);
            entity.setVehicleModel(vm);
        }
        entity.setCoverageYears(dto.getCoverageYears());
        entity.setCoverageKm(dto.getCoverageKm());
        entity.setConditionsText(dto.getConditionsText());
        entity.setEffectiveFrom(dto.getEffectiveFrom());
        entity.setEffectiveTo(dto.getEffectiveTo());
        if (dto.getActive() != null) entity.setActive(dto.getActive());
        entity.setUpdatedBy(dto.getUpdatedBy());
    }
}

