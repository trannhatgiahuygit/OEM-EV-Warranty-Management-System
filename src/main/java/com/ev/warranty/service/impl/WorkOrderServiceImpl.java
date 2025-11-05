package com.ev.warranty.service.impl;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.mapper.WorkOrderMapper;
import com.ev.warranty.model.dto.workorder.*;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import com.ev.warranty.service.inter.WorkOrderService;
import com.ev.warranty.service.inter.TechnicianProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final ClaimStatusRepository claimStatusRepository;
    private final UserRepository userRepository;
    private final PartSerialRepository partSerialRepository;
    private final WorkOrderMapper workOrderMapper;
    private final TechnicianProfileService technicianProfileService;
    private final ThirdPartyPartRepository thirdPartyPartRepository;

    @Override
    public WorkOrderResponseDTO createWorkOrder(WorkOrderCreateRequestDTO request) {
        log.info("Creating work order for claim ID: {}", request.getClaimId());

        Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + request.getClaimId()));

        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new NotFoundException("Technician not found with ID: " + request.getTechnicianId()));

        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
            throw new ValidationException("User is not a technician");
        }

        LocalDateTime requestedStart = request.getStartTime();
        if (!technicianProfileService.canAssignWork(technician.getId(), requestedStart)) {
            throw new ValidationException(
                    String.format("Technician %s cannot be assigned at the requested time or is at capacity", technician.getUsername())
            );
        }

        WorkOrder workOrder = WorkOrder.builder()
                .claim(claim)
                .technician(technician)
                .startTime(request.getStartTime())
                .laborHours(request.getEstimatedLaborHours())
                .build();

        WorkOrder savedWorkOrder = workOrderRepository.save(workOrder);

        try {
            technicianProfileService.incrementWorkload(technician.getId());
            log.info("Incremented workload for technician: {}", technician.getUsername());
        } catch (Exception e) {
            log.warn("Failed to update technician profile workload: {}", e.getMessage());
        }

        log.info("Work order created successfully with ID: {}", savedWorkOrder.getId());

        return workOrderMapper.toResponseDTO(savedWorkOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkOrderResponseDTO getWorkOrderById(Integer id) {
        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));
        WorkOrderResponseDTO dto = workOrderMapper.toResponseDTO(workOrder);
        List<WorkOrderPart> parts = workOrderPartRepository.findByWorkOrderId(workOrder.getId());
        List<WorkOrderPartDTO> partDTOs = parts.stream().map(workOrderMapper::toPartDTO).collect(Collectors.toList());
        dto.setPartsUsed(partDTOs);
        dto.setParts(partDTOs);
        return dto;
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

        if (completedWorkOrder.getTechnician() != null) {
            try {
                technicianProfileService.decrementWorkload(completedWorkOrder.getTechnician().getId());
                log.info("Decremented workload for technician: {}", completedWorkOrder.getTechnician().getUsername());
            } catch (Exception e) {
                log.warn("Failed to update technician profile workload: {}", e.getMessage());
            }
        }

        log.info("Work order completed successfully");
        return workOrderMapper.toResponseDTO(completedWorkOrder);
    }

    @Override
    public WorkOrderResponseDTO completeWorkOrderWithStats(Integer id, String result, BigDecimal laborHours) {
        log.info("Completing work order ID: {} with labor hours: {}", id, laborHours);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));

        if (workOrder.getEndTime() != null) {
            throw new ValidationException("Work order is already completed");
        }

        if (workOrder.getTechnician() == null) {
            throw new ValidationException("Cannot complete work order without assigned technician");
        }

        workOrder.setEndTime(LocalDateTime.now());
        workOrder.setResult(result);
        workOrder.setLaborHours(laborHours);

        WorkOrder completedWorkOrder = workOrderRepository.save(workOrder);

        Integer technicianId = completedWorkOrder.getTechnician().getId();
        try {
            technicianProfileService.decrementWorkload(technicianId);
            log.info("Decremented workload for technician ID: {}", technicianId);
        } catch (Exception e) {
            log.warn("Failed to decrement workload: {}", e.getMessage());
        }

        try {
            technicianProfileService.updateWorkOrderCompletion(technicianId, laborHours);
            log.info("Updated completion statistics for technician ID: {}", technicianId);
        } catch (Exception e) {
            log.warn("Failed to update completion statistics: {}", e.getMessage());
        }

        log.info("Work order completed with stats successfully");
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

        if (partDTO.getQuantity() == null || partDTO.getQuantity() <= 0) {
            partDTO.setQuantity(1);
        }

        String source = (partDTO.getPartSource() != null ? partDTO.getPartSource() : "EVM_WAREHOUSE").toUpperCase();
        WorkOrderPart workOrderPart;
        switch (source) {
            case "THIRD_PARTY" -> {
                if (partDTO.getThirdPartyPartId() == null) {
                    throw new ValidationException("thirdPartyPartId is required for THIRD_PARTY source");
                }
                ThirdPartyPart tpPart = thirdPartyPartRepository.findById(partDTO.getThirdPartyPartId())
                        .orElseThrow(() -> new NotFoundException("Third-party part not found with ID: " + partDTO.getThirdPartyPartId()));
                workOrderPart = WorkOrderPart.builder()
                        .workOrder(workOrder)
                        .part(null)
                        .partSerial(null)
                        .quantity(partDTO.getQuantity())
                        .partSource("THIRD_PARTY")
                        .thirdPartyPart(tpPart)
                        .thirdPartySerialNumber(partDTO.getThirdPartySerialNumber())
                        .build();
            }
            case "EVM_WAREHOUSE" -> {
                if (partDTO.getPartSerialId() == null) {
                    throw new ValidationException("Part Serial ID is required for EVM_WAREHOUSE source");
                }
                PartSerial partSerial = partSerialRepository.findById(partDTO.getPartSerialId())
                        .orElseThrow(() -> new NotFoundException("Part serial not found with ID: " + partDTO.getPartSerialId()));
                if (partSerial.getPart() == null) {
                    throw new ValidationException("Part is missing for the provided serial number");
                }
                workOrderPart = WorkOrderPart.builder()
                        .workOrder(workOrder)
                        .partSerial(partSerial)
                        .part(partSerial.getPart())
                        .quantity(partDTO.getQuantity())
                        .partSource("EVM_WAREHOUSE")
                        .build();
            }
            default -> throw new ValidationException("Unsupported part source: " + source);
        }

        workOrderPartRepository.save(workOrderPart);
        log.info("Part added to work order successfully (source: {})", source);

        WorkOrderResponseDTO response = workOrderMapper.toResponseDTO(workOrder);
        List<WorkOrderPart> parts = workOrderPartRepository.findByWorkOrderId(workOrderId);
        List<WorkOrderPartDTO> partDTOs = parts.stream().map(workOrderMapper::toPartDTO).collect(Collectors.toList());
        response.setPartsUsed(partDTOs);
        response.setParts(partDTOs);
        return response;
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
        return technicianProfileService.canAssignWork(technicianId);
    }

    @Override
    public WorkOrderResponseDTO assignTechnician(Integer workOrderId, Integer technicianId) {
        log.info("Assigning technician ID: {} to work order ID: {}", technicianId, workOrderId);

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + workOrderId));

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new NotFoundException("Technician not found with ID: " + technicianId));

        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
            throw new ValidationException("User is not a technician");
        }

        if (!Boolean.TRUE.equals(technician.getActive())) {
            throw new ValidationException("Technician is not active");
        }

        LocalDateTime requestedStart = workOrder.getStartTime();
        if (!technicianProfileService.canAssignWork(technicianId, requestedStart)) {
            throw new ValidationException(
                    String.format("Technician %s cannot be assigned at the requested time or is at capacity", technician.getUsername())
            );
        }

        if (workOrder.getTechnician() != null && !workOrder.getTechnician().getId().equals(technicianId)) {
            Integer previousTechnicianId = workOrder.getTechnician().getId();
            try {
                technicianProfileService.decrementWorkload(previousTechnicianId);
                log.info("Decremented workload for previous technician ID: {}", previousTechnicianId);
            } catch (Exception e) {
                log.warn("Failed to decrement previous technician workload: {}", e.getMessage());
            }
        }

        workOrder.setTechnician(technician);
        WorkOrder updatedWorkOrder = workOrderRepository.save(workOrder);

        try {
            technicianProfileService.incrementWorkload(technicianId);
            log.info("Incremented workload for technician ID: {}", technicianId);
        } catch (Exception e) {
            log.warn("Failed to increment technician workload: {}", e.getMessage());
        }

        log.info("Technician assigned successfully to work order");
        return workOrderMapper.toResponseDTO(updatedWorkOrder);
    }

    @Override
    public WorkOrderResponseDTO reassignTechnician(Integer workOrderId, Integer newTechnicianId) {
        log.info("Reassigning work order ID: {} to new technician ID: {}", workOrderId, newTechnicianId);

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + workOrderId));

        if (workOrder.getEndTime() != null) {
            throw new ValidationException("Cannot reassign completed work order");
        }

        return assignTechnician(workOrderId, newTechnicianId);
    }

    @Override
    public WorkOrderResponseDTO cancelWorkOrder(Integer id, String reason) {
        log.info("Cancelling work order ID: {} with reason: {}", id, reason);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));

        if (workOrder.getEndTime() != null) {
            throw new ValidationException("Cannot cancel completed work order");
        }

        workOrder.setEndTime(LocalDateTime.now());
        workOrder.setResult("CANCELLED: " + reason);

        WorkOrder cancelledWorkOrder = workOrderRepository.save(workOrder);

        if (cancelledWorkOrder.getTechnician() != null) {
            try {
                technicianProfileService.decrementWorkload(cancelledWorkOrder.getTechnician().getId());
                log.info("Freed up workload for technician ID: {}", cancelledWorkOrder.getTechnician().getId());
            } catch (Exception e) {
                log.warn("Failed to free up technician workload: {}", e.getMessage());
            }
        }

        log.info("Work order cancelled successfully");
        return workOrderMapper.toResponseDTO(cancelledWorkOrder);
    }

    @Override
    public WorkOrderResponseDTO startWorkOrder(Integer id) {
        log.info("Starting work order ID: {}", id);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));

        if (workOrder.getTechnician() == null) {
            throw new ValidationException("Cannot start work order without assigned technician");
        }

        if (workOrder.getEndTime() != null) {
            throw new ValidationException("Work order is already completed");
        }

        if (workOrder.getStartTime() != null) {
            Claim claim = workOrder.getClaim();
            if (claim != null && claim.getStatus() != null) {
                String code = claim.getStatus().getCode();
                if (!"REPAIR_IN_PROGRESS".equals(code)) {
                    ClaimStatus inProgress = claimStatusRepository.findByCode("REPAIR_IN_PROGRESS").orElse(null);
                    if (inProgress != null) {
                        claim.setStatus(inProgress);
                        claimRepository.save(claim);
                    }
                }
            }
            log.info("Work order {} was already started - returning current state", id);
            return workOrderMapper.toResponseDTO(workOrder);
        }

        workOrder.setStartTime(LocalDateTime.now());
        WorkOrder startedWorkOrder = workOrderRepository.save(workOrder);

        Claim claim = startedWorkOrder.getClaim();
        if (claim != null && claim.getStatus() != null) {
            String code = claim.getStatus().getCode();
            if (!"REPAIR_IN_PROGRESS".equals(code)) {
                ClaimStatus inProgress = claimStatusRepository.findByCode("REPAIR_IN_PROGRESS")
                        .orElse(null);
                if (inProgress != null) {
                    claim.setStatus(inProgress);
                    claimRepository.save(claim);
                }
            }
        }

        log.info("Work order started successfully");
        return workOrderMapper.toResponseDTO(startedWorkOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkOrderWorkloadDTO getTechnicianWorkload(Integer technicianId) {
        log.info("Getting workload for technician ID: {}", technicianId);

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new NotFoundException("Technician not found with ID: " + technicianId));

        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
            throw new ValidationException("User is not a technician");
        }

        List<WorkOrder> allWorkOrders = workOrderRepository.findByTechnicianId(technicianId);

        int totalWorkOrders = allWorkOrders.size();
        int activeWorkOrders = (int) allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() == null)
                .count();
        int completedWorkOrders = (int) allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() != null)
                .count();

        int pendingWorkOrders = (int) allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() == null && wo.getStartTime() == null)
                .count();
        int inProgressWorkOrders = (int) allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() == null && wo.getStartTime() != null)
                .count();

        double averageCompletionTimeHours = allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() != null && wo.getStartTime() != null)
                .mapToDouble(wo -> {
                    long hours = java.time.Duration.between(wo.getStartTime(), wo.getEndTime()).toHours();
                    return hours;
                })
                .average()
                .orElse(0.0);

        int totalPartsUsed = allWorkOrders.stream()
                .mapToInt(wo -> workOrderPartRepository.findByWorkOrderId(wo.getId()).size())
                .sum();

        double averagePartsPerWorkOrder = totalWorkOrders > 0 ? (double) totalPartsUsed / totalWorkOrders : 0.0;

        LocalDateTime lastWorkOrderCreated = allWorkOrders.stream()
                .map(wo -> wo.getStartTime() != null ? wo.getStartTime() : LocalDateTime.now())
                .max(LocalDateTime::compareTo)
                .orElse(null);

        LocalDateTime lastWorkOrderCompleted = allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() != null)
                .map(WorkOrder::getEndTime)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        int maxCapacity = 5; // Default
        int currentLoad = activeWorkOrders;
        boolean canTakeNewWorkOrder = false;

        try {
            canTakeNewWorkOrder = technicianProfileService.canAssignWork(technicianId);
            var profile = technicianProfileService.getProfileByUserId(technicianId);
            if (profile != null) {
                maxCapacity = profile.getMaxWorkload();
                currentLoad = profile.getCurrentWorkload();
            }
        } catch (Exception e) {
            log.warn("Could not fetch technician profile data: {}", e.getMessage());
        }

        double capacityUtilization = maxCapacity > 0 ? (double) currentLoad / maxCapacity * 100 : 0.0;

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

        List<WorkOrderWorkloadDTO.WorkOrderSummaryDTO> recentCompletedWorkOrders = allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() != null)
                .sorted((a, b) -> b.getEndTime().compareTo(a.getEndTime()))
                .limit(5)
                .map(this::mapToWorkOrderSummary)
                .collect(Collectors.toList());

        WorkOrderWorkloadDTO workload = WorkOrderWorkloadDTO.builder()
                .technicianId(technicianId)
                .technicianName(technician.getUsername())
                .technicianEmail(technician.getEmail())
                .totalActiveWorkOrders(activeWorkOrders)
                .totalCompletedWorkOrders(completedWorkOrders)
                .totalWorkOrders(totalWorkOrders)
                .pendingWorkOrders(pendingWorkOrders)
                .inProgressWorkOrders(inProgressWorkOrders)
                .completedWorkOrders(completedWorkOrders)
                .cancelledWorkOrders(0)
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
                .workOrderNumber("WO-" + workOrder.getId())
                .status(workOrder.getEndTime() == null ? "ACTIVE" : "COMPLETED")
                .priority("NORMAL")
                .createdAt(workOrder.getStartTime() != null ? workOrder.getStartTime() : LocalDateTime.now())
                .updatedAt(workOrder.getEndTime() != null ? workOrder.getEndTime() : LocalDateTime.now())
                .completedAt(workOrder.getEndTime())
                .vehicleVin(workOrder.getClaim() != null && workOrder.getClaim().getVehicle() != null ?
                        workOrder.getClaim().getVehicle().getVin() : "N/A")
                .customerName(workOrder.getClaim() != null && workOrder.getClaim().getVehicle() != null &&
                        workOrder.getClaim().getVehicle().getCustomer() != null ?
                        workOrder.getClaim().getVehicle().getCustomer().getName() : "N/A")
                .description(workOrder.getResult() != null ? workOrder.getResult() : "Work order in progress")
                .estimatedHours(workOrder.getLaborHours() != null ? workOrder.getLaborHours().intValue() : null)
                .actualHours(workOrder.getEndTime() != null && workOrder.getStartTime() != null ?
                        (int) java.time.Duration.between(workOrder.getStartTime(), workOrder.getEndTime()).toHours() : null)
                .build();
    }
}
