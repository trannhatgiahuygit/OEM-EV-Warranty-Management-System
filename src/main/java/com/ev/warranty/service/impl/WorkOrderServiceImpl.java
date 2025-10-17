package com.ev.warranty.service.impl;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.mapper.WorkOrderMapper;
import com.ev.warranty.model.dto.workorder.*;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.PartSerialRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.WorkOrderPartRepository;
import com.ev.warranty.repository.WorkOrderRepository;
import com.ev.warranty.service.inter.WorkOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WorkOrderServiceImpl implements WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderPartRepository workOrderPartRepository;
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final PartSerialRepository partSerialRepository;
    private final WorkOrderMapper workOrderMapper;

    @Override
    public WorkOrderResponseDTO createWorkOrder(WorkOrderCreateRequestDTO request) {
        log.info("Creating work order for claim ID: {}", request.getClaimId());

        // Validate claim exists
        Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + request.getClaimId()));

        // Validate technician exists and has TECHNICIAN role
        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new NotFoundException("Technician not found with ID: " + request.getTechnicianId()));

        if (!"TECHNICIAN".equals(technician.getRole().getRoleName())) { // Fixed: using getRoleName() instead of getCode()
            throw new ValidationException("User is not a technician");
        }

        WorkOrder workOrder = WorkOrder.builder()
                .claim(claim)
                .technician(technician)
                .startTime(request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now())
                .laborHours(request.getEstimatedLaborHours())
                .build();

        WorkOrder savedWorkOrder = workOrderRepository.save(workOrder);
        log.info("Work order created successfully with ID: {}", savedWorkOrder.getId());

        return workOrderMapper.toResponseDTO(savedWorkOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkOrderResponseDTO getWorkOrderById(Integer id) {
        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));
        return workOrderMapper.toResponseDTO(workOrder);
    }

    @Override
    public WorkOrderResponseDTO updateWorkOrder(Integer id, WorkOrderUpdateRequestDTO request) {
        log.info("Updating work order ID: {}", id);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));

        if (request.getEndTime() != null) {
            workOrder.setEndTime(request.getEndTime());
        }
        if (request.getResult() != null) {
            workOrder.setResult(request.getResult());
        }
        if (request.getLaborHours() != null) {
            workOrder.setLaborHours(request.getLaborHours());
        }

        WorkOrder updatedWorkOrder = workOrderRepository.save(workOrder);
        log.info("Work order updated successfully");

        return workOrderMapper.toResponseDTO(updatedWorkOrder);
    }

    @Override
    public WorkOrderResponseDTO completeWorkOrder(Integer id) {
        log.info("Completing work order ID: {}", id);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));

        if (workOrder.getEndTime() != null) {
            throw new ValidationException("Work order is already completed");
        }

        workOrder.setEndTime(LocalDateTime.now());
        WorkOrder completedWorkOrder = workOrderRepository.save(workOrder);

        log.info("Work order completed successfully");
        return workOrderMapper.toResponseDTO(completedWorkOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderResponseDTO> getWorkOrdersByClaimId(Integer claimId) {
        List<WorkOrder> workOrders = workOrderRepository.findByClaimId(claimId);
        return workOrders.stream()
                .map(workOrderMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderResponseDTO> getWorkOrdersByTechnicianId(Integer technicianId) {
        List<WorkOrder> workOrders = workOrderRepository.findByTechnicianId(technicianId);
        return workOrders.stream()
                .map(workOrderMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderResponseDTO> getAllWorkOrders(Pageable pageable) {
        Page<WorkOrder> workOrders = workOrderRepository.findAll(pageable);
        return workOrders.map(workOrderMapper::toResponseDTO);
    }

    @Override
    public WorkOrderResponseDTO addPartToWorkOrder(Integer workOrderId, WorkOrderPartDTO partDTO) {
        log.info("Adding part to work order ID: {}", workOrderId);

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + workOrderId));

        PartSerial partSerial = partSerialRepository.findById(partDTO.getPartSerialId())
                .orElseThrow(() -> new NotFoundException("Part serial not found with ID: " + partDTO.getPartSerialId()));

        WorkOrderPart workOrderPart = WorkOrderPart.builder()
                .workOrder(workOrder)
                .partSerial(partSerial)
                .part(partSerial.getPart())
                .quantity(partDTO.getQuantity())
                .build();

        workOrderPartRepository.save(workOrderPart);
        log.info("Part added to work order successfully");

        return workOrderMapper.toResponseDTO(workOrder);
    }

    @Override
    public void removePartFromWorkOrder(Integer workOrderId, Integer partId) {
        log.info("Removing part ID: {} from work order ID: {}", partId, workOrderId);

        WorkOrderPart workOrderPart = workOrderPartRepository.findById(partId)
                .orElseThrow(() -> new NotFoundException("Work order part not found with ID: " + partId));

        if (!workOrderPart.getWorkOrder().getId().equals(workOrderId)) {
            throw new ValidationException("Part does not belong to the specified work order");
        }

        workOrderPartRepository.delete(workOrderPart);
        log.info("Part removed from work order successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderPartDTO> getWorkOrderParts(Integer workOrderId) {
        List<WorkOrderPart> parts = workOrderPartRepository.findByWorkOrderId(workOrderId);
        return parts.stream()
                .map(workOrderMapper::toPartDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canTechnicianTakeNewWorkOrder(Integer technicianId, int maxActiveWorkOrders) {
        Long activeCount = workOrderRepository.countActiveWorkOrdersByTechnician(technicianId);
        return activeCount < maxActiveWorkOrders;
    }
}
