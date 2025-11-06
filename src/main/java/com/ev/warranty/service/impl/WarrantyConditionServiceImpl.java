package com.ev.warranty.service.impl;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.mapper.WarrantyConditionMapper;
import com.ev.warranty.model.dto.policy.WarrantyConditionDTO;
import com.ev.warranty.model.entity.VehicleModel;
import com.ev.warranty.model.entity.WarrantyCondition;
import com.ev.warranty.repository.VehicleModelRepository;
import com.ev.warranty.repository.WarrantyConditionRepository;
import com.ev.warranty.service.inter.WarrantyConditionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WarrantyConditionServiceImpl implements WarrantyConditionService {

    private final WarrantyConditionRepository repository;
    private final VehicleModelRepository vehicleModelRepository;
    private final WarrantyConditionMapper mapper;

    @Override
    @Transactional
    public WarrantyConditionDTO create(WarrantyConditionDTO dto, String updatedBy) {
        // Validate model exists
        if (dto.getVehicleModelId() == null) {
            throw new NotFoundException("VehicleModelId is required");
        }
        VehicleModel model = vehicleModelRepository.findById(dto.getVehicleModelId())
                .orElseThrow(() -> new NotFoundException("VehicleModel not found"));
        WarrantyCondition entity = mapper.toEntity(dto);
        entity.setVehicleModel(model);
        entity.setUpdatedBy(updatedBy);
        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional
    public WarrantyConditionDTO update(Integer id, WarrantyConditionDTO dto, String updatedBy) {
        WarrantyCondition existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("WarrantyCondition not found"));
        dto.setUpdatedBy(updatedBy);
        mapper.updateEntity(existing, dto);
        return mapper.toDto(repository.save(existing));
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<WarrantyConditionDTO> listByModel(Integer vehicleModelId) {
        return repository.findByVehicleModel_Id(vehicleModelId)
                .stream().map(mapper::toDto).toList();
    }

    @Override
    public List<WarrantyConditionDTO> listEffectiveByModel(Integer vehicleModelId, LocalDate today) {
        return repository.findEffectiveByModel(vehicleModelId, today)
                .stream().map(mapper::toDto).toList();
    }

    @Override
    public WarrantyConditionDTO get(Integer id) {
        return repository.findById(id)
                .map(mapper::toDto)
                .orElseThrow(() -> new NotFoundException("WarrantyCondition not found"));
    }
}
