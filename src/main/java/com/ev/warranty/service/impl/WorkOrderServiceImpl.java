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

        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
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

    @Override
    @Transactional(readOnly = true)
    public WorkOrderWorkloadDTO getTechnicianWorkload(Integer technicianId) {
        log.info("Getting workload for technician ID: {}", technicianId);
        
        // Validate technician exists
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new NotFoundException("Technician not found with ID: " + technicianId));
        
        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
            throw new ValidationException("User is not a technician");
        }
        
        // Get all work orders for this technician
        List<WorkOrder> allWorkOrders = workOrderRepository.findByTechnicianId(technicianId);
        
        // Calculate statistics
        int totalWorkOrders = allWorkOrders.size();
        int activeWorkOrders = (int) allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() == null)
                .count();
        int completedWorkOrders = (int) allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() != null)
                .count();
        
        // Count by status
        int pendingWorkOrders = (int) allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() == null && wo.getStartTime() == null)
                .count();
        int inProgressWorkOrders = (int) allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() == null && wo.getStartTime() != null)
                .count();
        
        // Calculate average completion time
        double averageCompletionTimeHours = allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() != null && wo.getStartTime() != null)
                .mapToDouble(wo -> {
                    long hours = java.time.Duration.between(wo.getStartTime(), wo.getEndTime()).toHours();
                    return hours;
                })
                .average()
                .orElse(0.0);
        
        // Calculate total parts used
        int totalPartsUsed = allWorkOrders.stream()
                .mapToInt(wo -> workOrderPartRepository.findByWorkOrderId(wo.getId()).size())
                .sum();
        
        double averagePartsPerWorkOrder = totalWorkOrders > 0 ? (double) totalPartsUsed / totalWorkOrders : 0.0;
        
        // Get recent activity
        LocalDateTime lastWorkOrderCreated = allWorkOrders.stream()
                .map(wo -> wo.getStartTime() != null ? wo.getStartTime() : LocalDateTime.now())
                .max(LocalDateTime::compareTo)
                .orElse(null);
        
        LocalDateTime lastWorkOrderCompleted = allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() != null)
                .map(WorkOrder::getEndTime)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        
        // Capacity information
        int maxCapacity = 5; // Default max capacity
        int currentLoad = activeWorkOrders;
        double capacityUtilization = maxCapacity > 0 ? (double) currentLoad / maxCapacity * 100 : 0.0;
        boolean canTakeNewWorkOrder = currentLoad < maxCapacity;
        
        // Get active work orders (last 5)
        List<WorkOrderWorkloadDTO.WorkOrderSummaryDTO> activeWorkOrdersList = allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() == null)
                .sorted((a, b) -> {
                    LocalDateTime aTime = a.getStartTime() != null ? a.getStartTime() : LocalDateTime.now();
                    LocalDateTime bTime = b.getStartTime() != null ? b.getStartTime() : LocalDateTime.now();
                    return bTime.compareTo(aTime);
                })
                .limit(5)
                .map(this::mapToWorkOrderSummary)
                .collect(Collectors.toList());
        
        // Get recent completed work orders (last 5)
        List<WorkOrderWorkloadDTO.WorkOrderSummaryDTO> recentCompletedWorkOrders = allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() != null)
                .sorted((a, b) -> b.getEndTime().compareTo(a.getEndTime()))
                .limit(5)
                .map(this::mapToWorkOrderSummary)
                .collect(Collectors.toList());
        
        WorkOrderWorkloadDTO workload = WorkOrderWorkloadDTO.builder()
                .technicianId(technicianId)
                .technicianName(technician.getUsername()) // TODO: Add fullname field to User
                .technicianEmail(technician.getEmail())
                .totalActiveWorkOrders(activeWorkOrders)
                .totalCompletedWorkOrders(completedWorkOrders)
                .totalWorkOrders(totalWorkOrders)
                .pendingWorkOrders(pendingWorkOrders)
                .inProgressWorkOrders(inProgressWorkOrders)
                .completedWorkOrders(completedWorkOrders)
                .cancelledWorkOrders(0) // Not implemented yet
                .averageCompletionTimeHours(averageCompletionTimeHours)
                .totalPartsUsed(totalPartsUsed)
                .averagePartsPerWorkOrder(averagePartsPerWorkOrder)
                .lastWorkOrderCreated(lastWorkOrderCreated)
                .lastWorkOrderCompleted(lastWorkOrderCompleted)
                .activeWorkOrders(activeWorkOrdersList)
                .recentCompletedWorkOrders(recentCompletedWorkOrders)
                .maxCapacity(maxCapacity)
                .currentLoad(currentLoad)
                .capacityUtilization(capacityUtilization)
                .canTakeNewWorkOrder(canTakeNewWorkOrder)
                .build();
        
        log.info("Retrieved workload for technician {}: {} active, {} completed", 
                technician.getUsername(), activeWorkOrders, completedWorkOrders);
        
        return workload;
    }
    
    private WorkOrderWorkloadDTO.WorkOrderSummaryDTO mapToWorkOrderSummary(WorkOrder workOrder) {
        return WorkOrderWorkloadDTO.WorkOrderSummaryDTO.builder()
                .id(workOrder.getId())
                .workOrderNumber("WO-" + workOrder.getId()) // Simple work order number
                .status(workOrder.getEndTime() == null ? "ACTIVE" : "COMPLETED")
                .priority("NORMAL") // Default priority
                .createdAt(workOrder.getStartTime() != null ? workOrder.getStartTime() : LocalDateTime.now())
                .updatedAt(workOrder.getEndTime() != null ? workOrder.getEndTime() : LocalDateTime.now())
                .completedAt(workOrder.getEndTime())
                .vehicleVin(workOrder.getClaim() != null && workOrder.getClaim().getVehicle() != null ? 
                    workOrder.getClaim().getVehicle().getVin() : "N/A")
                .customerName(workOrder.getClaim() != null && workOrder.getClaim().getVehicle() != null && 
                    workOrder.getClaim().getVehicle().getCustomer() != null ? 
                    workOrder.getClaim().getVehicle().getCustomer().getName() : "N/A") // Using getName() instead of getFullname()
                .description(workOrder.getResult() != null ? workOrder.getResult() : "Work order in progress")
                .estimatedHours(workOrder.getLaborHours() != null ? workOrder.getLaborHours().intValue() : null)
                .actualHours(workOrder.getEndTime() != null && workOrder.getStartTime() != null ? 
                    (int) java.time.Duration.between(workOrder.getStartTime(), workOrder.getEndTime()).toHours() : null)
                .build();
    }
}
