package com.ev.warranty.service.impl;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartDTO;
import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartSerialDTO;
import com.ev.warranty.model.entity.ThirdPartyPart;
import com.ev.warranty.model.entity.ThirdPartyPartSerial;
import com.ev.warranty.model.entity.WorkOrder;
import com.ev.warranty.repository.ThirdPartyPartRepository;
import com.ev.warranty.repository.ThirdPartyPartSerialRepository;
import com.ev.warranty.repository.WorkOrderRepository;
import com.ev.warranty.service.inter.ThirdPartyPartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ThirdPartyPartServiceImpl implements ThirdPartyPartService {

    private final ThirdPartyPartRepository partRepository;
    private final ThirdPartyPartSerialRepository serialRepository;
    private final WorkOrderRepository workOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ThirdPartyPartDTO> getPartsByServiceCenter(Integer serviceCenterId) {
        return partRepository.findByServiceCenterIdAndActiveTrue(serviceCenterId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ThirdPartyPartDTO createPart(ThirdPartyPartDTO dto, String createdBy) {
        if (dto.getPartNumber() == null || dto.getPartNumber().isBlank()) {
            throw new ValidationException("Part number is required");
        }
        ThirdPartyPart entity = ThirdPartyPart.builder()
                .partNumber(dto.getPartNumber())
                .name(dto.getName())
                .category(dto.getCategory())
                .description(dto.getDescription())
                .supplier(dto.getSupplier())
                .unitCost(dto.getUnitCost())
                .serviceCenterId(dto.getServiceCenterId())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .updatedBy(createdBy)
                .build();
        entity = partRepository.save(entity);
        return toDto(entity);
    }

    @Override
    public ThirdPartyPartDTO updatePart(Integer id, ThirdPartyPartDTO dto, String updatedBy) {
        ThirdPartyPart entity = partRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Third-party part not found"));
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getCategory() != null) entity.setCategory(dto.getCategory());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getSupplier() != null) entity.setSupplier(dto.getSupplier());
        if (dto.getUnitCost() != null) entity.setUnitCost(dto.getUnitCost());
        if (dto.getServiceCenterId() != null) entity.setServiceCenterId(dto.getServiceCenterId());
        if (dto.getActive() != null) entity.setActive(dto.getActive());
        entity.setUpdatedBy(updatedBy);
        entity = partRepository.save(entity);
        return toDto(entity);
    }

    @Override
    public void deletePart(Integer id) {
        partRepository.deleteById(id);
    }

    @Override
    public ThirdPartyPartSerialDTO addSerial(Integer partId, String serialNumber, String addedBy) {
        ThirdPartyPart part = partRepository.findById(partId)
                .orElseThrow(() -> new NotFoundException("Third-party part not found"));
        ThirdPartyPartSerial serial = ThirdPartyPartSerial.builder()
                .thirdPartyPart(part)
                .serialNumber(serialNumber)
                .status("AVAILABLE")
                .serviceCenterId(part.getServiceCenterId())
                .build();
        serial = serialRepository.save(serial);
        return toDto(serial);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ThirdPartyPartSerialDTO> getAvailableSerials(Integer partId) {
        return serialRepository.findByThirdPartyPartIdAndStatus(partId, "AVAILABLE").stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public void markSerialAsUsed(Integer serialId, Integer workOrderId, String installedBy) {
        ThirdPartyPartSerial serial = serialRepository.findById(serialId)
                .orElseThrow(() -> new NotFoundException("Third-party part serial not found"));
        WorkOrder po = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new NotFoundException("Work order not found"));
        serial.setStatus("USED");
        serial.setWorkOrder(po);
        serial.setInstalledBy(installedBy);
        serial.setInstalledAt(java.time.LocalDateTime.now());
        serialRepository.save(serial);
    }

    private ThirdPartyPartDTO toDto(ThirdPartyPart entity) {
        return ThirdPartyPartDTO.builder()
                .id(entity.getId())
                .partNumber(entity.getPartNumber())
                .name(entity.getName())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .supplier(entity.getSupplier())
                .unitCost(entity.getUnitCost())
                .serviceCenterId(entity.getServiceCenterId())
                .active(entity.getActive())
                .build();
    }

    private ThirdPartyPartSerialDTO toDto(ThirdPartyPartSerial entity) {
        return ThirdPartyPartSerialDTO.builder()
                .id(entity.getId())
                .thirdPartyPartId(entity.getThirdPartyPart() != null ? entity.getThirdPartyPart().getId() : null)
                .serialNumber(entity.getSerialNumber())
                .status(entity.getStatus())
                .serviceCenterId(entity.getServiceCenterId())
                .installedBy(entity.getInstalledBy())
                .installedAt(entity.getInstalledAt())
                .workOrderId(entity.getWorkOrder() != null ? entity.getWorkOrder().getId() : null)
                .build();
    }
}

