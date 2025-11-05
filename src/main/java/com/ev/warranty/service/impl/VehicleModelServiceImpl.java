package com.ev.warranty.service.impl;

import com.ev.warranty.exception.BadRequestException;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.model.dto.vehicle.VehicleModelDTO;
import com.ev.warranty.model.entity.VehicleModel;
import com.ev.warranty.repository.VehicleModelRepository;
import com.ev.warranty.service.inter.VehicleModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleModelServiceImpl implements VehicleModelService {

    private final VehicleModelRepository repository;

    private VehicleModelDTO toDto(VehicleModel vm) {
        VehicleModelDTO dto = new VehicleModelDTO();
        dto.setId(vm.getId());
        dto.setCode(vm.getCode());
        dto.setName(vm.getName());
        dto.setBrand(vm.getBrand());
        dto.setDescription(vm.getDescription());
        dto.setActive(vm.getActive());
        return dto;
    }

    private void apply(VehicleModel vm, VehicleModelDTO dto, String updatedBy) {
        if (dto.getCode() != null) vm.setCode(dto.getCode());
        if (dto.getName() != null) vm.setName(dto.getName());
        vm.setBrand(dto.getBrand());
        vm.setDescription(dto.getDescription());
        if (dto.getActive() != null) vm.setActive(dto.getActive());
        vm.setUpdatedBy(updatedBy);
    }

    @Override
    @Transactional
    public VehicleModelDTO create(VehicleModelDTO dto, String updatedBy) {
        repository.findByCode(dto.getCode()).ifPresent(x -> { throw new BadRequestException("Model code already exists"); });
        VehicleModel vm = VehicleModel.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .brand(dto.getBrand())
                .description(dto.getDescription())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .updatedBy(updatedBy)
                .build();
        vm = repository.save(vm);
        return toDto(vm);
    }

    @Override
    @Transactional
    public VehicleModelDTO update(Integer id, VehicleModelDTO dto, String updatedBy) {
        VehicleModel vm = repository.findById(id).orElseThrow(() -> new NotFoundException("Vehicle model not found"));
        if (dto.getCode() != null) {
            repository.findByCode(dto.getCode()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) throw new BadRequestException("Model code already exists");
            });
        }
        apply(vm, dto, updatedBy);
        vm = repository.save(vm);
        return toDto(vm);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        if (!repository.existsById(id)) throw new NotFoundException("Vehicle model not found");
        repository.deleteById(id);
    }

    @Override
    public VehicleModelDTO get(Integer id) {
        return repository.findById(id).map(this::toDto).orElseThrow(() -> new NotFoundException("Vehicle model not found"));
    }

    @Override
    public VehicleModelDTO getByCode(String code) {
        return repository.findByCode(code).map(this::toDto).orElseThrow(() -> new NotFoundException("Vehicle model not found"));
    }

    @Override
    public List<VehicleModelDTO> listAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public List<VehicleModelDTO> listActive() {
        return repository.findByActiveTrue().stream().map(this::toDto).toList();
    }
}

