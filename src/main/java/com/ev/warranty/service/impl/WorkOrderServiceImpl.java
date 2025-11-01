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

    // ✅ NEW: Inject TechnicianProfileService
    private final TechnicianProfileService technicianProfileService;

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

        // ✅ NEW: Check technician availability via TechnicianProfile
        if (!technicianProfileService.canAssignWork(technician.getId())) {
            throw new ValidationException(
                    String.format("Technician %s is not available or at full capacity", technician.getUsername())
            );
        }

        WorkOrder workOrder = WorkOrder.builder()
                .claim(claim)
                .technician(technician)
                .startTime(request.getStartTime()) // leave null unless provided
                .laborHours(request.getEstimatedLaborHours())
                .build();

        WorkOrder savedWorkOrder = workOrderRepository.save(workOrder);

        // ✅ NEW: Increment technician workload
        try {
            technicianProfileService.incrementWorkload(technician.getId());
            log.info("Incremented workload for technician: {}", technician.getUsername());
        } catch (Exception e) {
            log.warn("Failed to update technician profile workload: {}", e.getMessage());
            // Continue execution - workload update is not critical
        }

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

        // ✅ NEW: Decrement technician workload when completing
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

    // ✅ NEW: Complete work order with statistics update
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

        // Update work order
        workOrder.setEndTime(LocalDateTime.now());
        workOrder.setResult(result);
        workOrder.setLaborHours(laborHours);

        WorkOrder completedWorkOrder = workOrderRepository.save(workOrder);

        // ✅ Update technician profile - decrement workload
        Integer technicianId = completedWorkOrder.getTechnician().getId();
        try {
            technicianProfileService.decrementWorkload(technicianId);
            log.info("Decremented workload for technician ID: {}", technicianId);
        } catch (Exception e) {
            log.warn("Failed to decrement workload: {}", e.getMessage());
        }

        // ✅ Update completion statistics
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
        // ✅ Use TechnicianProfile service instead
        return technicianProfileService.canAssignWork(technicianId);
    }

    // ✅ NEW: Assign technician to work order
    @Override
    public WorkOrderResponseDTO assignTechnician(Integer workOrderId, Integer technicianId) {
        log.info("Assigning technician ID: {} to work order ID: {}", technicianId, workOrderId);

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + workOrderId));

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new NotFoundException("Technician not found with ID: " + technicianId));

        // Validate technician role
        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
            throw new ValidationException("User is not a technician");
        }

        // Check if technician is active
        if (!Boolean.TRUE.equals(technician.getActive())) {
            throw new ValidationException("Technician is not active");
        }

        // ✅ Check technician availability via TechnicianProfile
        if (!technicianProfileService.canAssignWork(technicianId)) {
            throw new ValidationException(
                    String.format("Technician %s is not available or at full capacity", technician.getUsername())
            );
        }

        // If already assigned to another technician, decrement their workload
        if (workOrder.getTechnician() != null && !workOrder.getTechnician().getId().equals(technicianId)) {
            Integer previousTechnicianId = workOrder.getTechnician().getId();
            try {
                technicianProfileService.decrementWorkload(previousTechnicianId);
                log.info("Decremented workload for previous technician ID: {}", previousTechnicianId);
            } catch (Exception e) {
                log.warn("Failed to decrement previous technician workload: {}", e.getMessage());
            }
        }

        // Assign new technician
        workOrder.setTechnician(technician);
        WorkOrder updatedWorkOrder = workOrderRepository.save(workOrder);

        // ✅ Increment new technician's workload
        try {
            technicianProfileService.incrementWorkload(technicianId);
            log.info("Incremented workload for technician ID: {}", technicianId);
        } catch (Exception e) {
            log.warn("Failed to increment technician workload: {}", e.getMessage());
        }

        log.info("Technician assigned successfully to work order");
        return workOrderMapper.toResponseDTO(updatedWorkOrder);
    }

    // ✅ NEW: Reassign technician
    @Override
    public WorkOrderResponseDTO reassignTechnician(Integer workOrderId, Integer newTechnicianId) {
        log.info("Reassigning work order ID: {} to new technician ID: {}", workOrderId, newTechnicianId);

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + workOrderId));

        if (workOrder.getEndTime() != null) {
            throw new ValidationException("Cannot reassign completed work order");
        }

        // Use assign method which handles workload updates
        return assignTechnician(workOrderId, newTechnicianId);
    }

    // ✅ NEW: Cancel work order
    @Override
    public WorkOrderResponseDTO cancelWorkOrder(Integer id, String reason) {
        log.info("Cancelling work order ID: {} with reason: {}", id, reason);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));

        if (workOrder.getEndTime() != null) {
            throw new ValidationException("Cannot cancel completed work order");
        }

        // Set cancellation info
        workOrder.setEndTime(LocalDateTime.now());
        workOrder.setResult("CANCELLED: " + reason);

        WorkOrder cancelledWorkOrder = workOrderRepository.save(workOrder);

        // ✅ Free up technician's workload
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

    // ✅ NEW: Start work order
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

        // Idempotent behavior: if already started, return current state and align claim status
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

        // Update related claim status to REPAIR_IN_PROGRESS if appropriate
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

        // ✅ Get capacity from TechnicianProfile
        int maxCapacity = 5; // Default
        int currentLoad = activeWorkOrders;
        boolean canTakeNewWorkOrder = false;

        try {
            canTakeNewWorkOrder = technicianProfileService.canAssignWork(technicianId);
            // Try to get actual max capacity from profile
            var profile = technicianProfileService.getProfileByUserId(technicianId);
            if (profile != null) {
                maxCapacity = profile.getMaxWorkload();
                currentLoad = profile.getCurrentWorkload();
            }
        } catch (Exception e) {
            log.warn("Could not fetch technician profile data: {}", e.getMessage());
        }

        double capacityUtilization = maxCapacity > 0 ? (double) currentLoad / maxCapacity * 100 : 0.0;

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
