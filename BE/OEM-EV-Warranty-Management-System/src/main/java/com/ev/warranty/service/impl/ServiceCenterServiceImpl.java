package com.ev.warranty.service.impl;

import com.ev.warranty.exception.BadRequestException;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.model.dto.servicecenter.ServiceCenterBranchDTO;
import com.ev.warranty.model.dto.servicecenter.ServiceCenterRequestDTO;
import com.ev.warranty.model.dto.servicecenter.ServiceCenterResponseDTO;
import com.ev.warranty.model.entity.ServiceCenter;
import com.ev.warranty.repository.ServiceCenterRepository;
import com.ev.warranty.service.inter.ServiceCenterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceCenterServiceImpl implements ServiceCenterService {

    private final ServiceCenterRepository serviceCenterRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ServiceCenterResponseDTO> getAllServiceCenters() {
        return serviceCenterRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ServiceCenterResponseDTO> getAllServiceCenters(Pageable pageable) {
        return serviceCenterRepository.findAll(pageable)
                .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceCenterResponseDTO getServiceCenterById(Integer id) {
        ServiceCenter serviceCenter = serviceCenterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Service center not found with id: " + id));
        return toDTO(serviceCenter);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceCenterResponseDTO getServiceCenterByCode(String code) {
        ServiceCenter serviceCenter = serviceCenterRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("Service center not found with code: " + code));
        return toDTO(serviceCenter);
    }

    @Override
    @Transactional
    public ServiceCenterResponseDTO createServiceCenter(ServiceCenterRequestDTO request, String createdBy) {
        log.info("Creating service center: {} by user: {}", request.getCode(), createdBy);

        // Check if code already exists
        if (serviceCenterRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Service center code already exists: " + request.getCode());
        }

        // Validate parent service center if provided
        ServiceCenter parentServiceCenter = null;
        if (request.getParentServiceCenterId() != null) {
            parentServiceCenter = serviceCenterRepository.findById(request.getParentServiceCenterId())
                    .orElseThrow(() -> new NotFoundException("Parent service center not found with id: " + request.getParentServiceCenterId()));
            // If parent is provided, this must be a branch
            if (request.getIsMainBranch() != null && request.getIsMainBranch()) {
                throw new BadRequestException("A branch cannot be marked as main branch if it has a parent");
            }
        }

        ServiceCenter serviceCenter = ServiceCenter.builder()
                .code(request.getCode())
                .name(request.getName())
                .location(request.getLocation())
                .address(request.getAddress())
                .phone(request.getPhone())
                .email(request.getEmail())
                .managerName(request.getManagerName())
                .region(request.getRegion())
                .parentServiceCenter(parentServiceCenter)
                .isMainBranch(request.getIsMainBranch() != null ? request.getIsMainBranch() : (parentServiceCenter == null))
                .active(request.getActive() != null ? request.getActive() : true)
                .capacity(request.getCapacity())
                .notes(request.getNotes())
                .updatedBy(createdBy)
                .build();

        ServiceCenter savedServiceCenter = serviceCenterRepository.save(serviceCenter);
        log.info("Service center created successfully: {}", savedServiceCenter.getCode());
        return toDTO(savedServiceCenter);
    }

    @Override
    @Transactional
    public ServiceCenterResponseDTO updateServiceCenter(Integer id, ServiceCenterRequestDTO request, String updatedBy) {
        log.info("Updating service center ID: {} by user: {}", id, updatedBy);

        ServiceCenter serviceCenter = serviceCenterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Service center not found with id: " + id));

        // Check if code is being changed and if new code already exists
        if (!serviceCenter.getCode().equals(request.getCode()) && 
            serviceCenterRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Service center code already exists: " + request.getCode());
        }

        // Validate parent service center if provided
        ServiceCenter parentServiceCenter = null;
        if (request.getParentServiceCenterId() != null) {
            if (request.getParentServiceCenterId().equals(id)) {
                throw new BadRequestException("Service center cannot be its own parent");
            }
            parentServiceCenter = serviceCenterRepository.findById(request.getParentServiceCenterId())
                    .orElseThrow(() -> new NotFoundException("Parent service center not found with id: " + request.getParentServiceCenterId()));
            // If parent is provided, this must be a branch
            if (request.getIsMainBranch() != null && request.getIsMainBranch()) {
                throw new BadRequestException("A branch cannot be marked as main branch if it has a parent");
            }
        }

        // Update fields
        serviceCenter.setCode(request.getCode());
        serviceCenter.setName(request.getName());
        serviceCenter.setLocation(request.getLocation());
        serviceCenter.setAddress(request.getAddress());
        serviceCenter.setPhone(request.getPhone());
        serviceCenter.setEmail(request.getEmail());
        serviceCenter.setManagerName(request.getManagerName());
        serviceCenter.setRegion(request.getRegion());
        serviceCenter.setParentServiceCenter(parentServiceCenter);
        if (request.getIsMainBranch() != null) {
            serviceCenter.setIsMainBranch(request.getIsMainBranch());
        } else if (parentServiceCenter == null) {
            serviceCenter.setIsMainBranch(true);
        }
        if (request.getActive() != null) {
            serviceCenter.setActive(request.getActive());
        }
        if (request.getCapacity() != null) {
            serviceCenter.setCapacity(request.getCapacity());
        }
        serviceCenter.setNotes(request.getNotes());
        serviceCenter.setUpdatedBy(updatedBy);

        ServiceCenter updatedServiceCenter = serviceCenterRepository.save(serviceCenter);
        log.info("Service center updated successfully: {}", updatedServiceCenter.getCode());
        return toDTO(updatedServiceCenter);
    }

    @Override
    @Transactional
    public void deleteServiceCenter(Integer id) {
        log.info("Deleting service center ID: {}", id);
        ServiceCenter serviceCenter = serviceCenterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Service center not found with id: " + id));
        
        // Check if there are active branches
        List<ServiceCenter> branches = serviceCenterRepository.findByParentServiceCenterId(id);
        if (!branches.isEmpty()) {
            throw new BadRequestException("Cannot delete service center with active branches. Please delete or reassign branches first.");
        }
        
        // Soft delete by setting active = false
        serviceCenter.setActive(false);
        serviceCenterRepository.save(serviceCenter);
        log.info("Service center deactivated successfully: {}", serviceCenter.getCode());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceCenterResponseDTO> getMainServiceCenters() {
        return serviceCenterRepository.findByParentServiceCenterIsNull().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceCenterResponseDTO> getBranchesByServiceCenterId(Integer parentId) {
        return serviceCenterRepository.findByParentServiceCenterId(parentId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceCenterResponseDTO> getActiveServiceCenters() {
        return serviceCenterRepository.findByActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceCenterResponseDTO> searchServiceCenters(String searchTerm) {
        return serviceCenterRepository.searchByNameOrCodeOrLocation(searchTerm).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceCenterResponseDTO> getServiceCentersByRegion(String region) {
        return serviceCenterRepository.findByRegion(region).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private ServiceCenterResponseDTO toDTO(ServiceCenter serviceCenter) {
        ServiceCenterResponseDTO.ServiceCenterResponseDTOBuilder builder = ServiceCenterResponseDTO.builder()
                .id(serviceCenter.getId())
                .code(serviceCenter.getCode())
                .name(serviceCenter.getName())
                .location(serviceCenter.getLocation())
                .address(serviceCenter.getAddress())
                .phone(serviceCenter.getPhone())
                .email(serviceCenter.getEmail())
                .managerName(serviceCenter.getManagerName())
                .region(serviceCenter.getRegion())
                .isMainBranch(serviceCenter.getIsMainBranch())
                .active(serviceCenter.getActive())
                .capacity(serviceCenter.getCapacity())
                .notes(serviceCenter.getNotes())
                .createdAt(serviceCenter.getCreatedAt())
                .updatedAt(serviceCenter.getUpdatedAt())
                .updatedBy(serviceCenter.getUpdatedBy());

        // Set parent information if exists
        if (serviceCenter.getParentServiceCenter() != null) {
            builder.parentServiceCenterId(serviceCenter.getParentServiceCenter().getId())
                   .parentServiceCenterName(serviceCenter.getParentServiceCenter().getName())
                   .parentServiceCenterCode(serviceCenter.getParentServiceCenter().getCode());
        }

        // Set branch count and branches
        List<ServiceCenter> branches = serviceCenter.getBranches();
        if (branches != null) {
            builder.branchCount(branches.size())
                   .branches(branches.stream()
                           .map(branch -> ServiceCenterBranchDTO.builder()
                                   .id(branch.getId())
                                   .code(branch.getCode())
                                   .name(branch.getName())
                                   .location(branch.getLocation())
                                   .phone(branch.getPhone())
                                   .email(branch.getEmail())
                                   .active(branch.getActive())
                                   .build())
                           .collect(Collectors.toList()));
        } else {
            builder.branchCount(0);
        }

        return builder.build();
    }
}

