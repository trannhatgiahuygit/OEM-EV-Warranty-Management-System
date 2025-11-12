package com.ev.warranty.service.impl;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.mapper.WorkOrderMapper;
import com.ev.warranty.model.dto.workorder.*;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import com.ev.warranty.service.inter.WorkOrderService;
import com.ev.warranty.service.inter.TechnicianProfileService;
import com.ev.warranty.service.inter.PartSerialService;
import com.ev.warranty.service.inter.ThirdPartyPartService;
import com.ev.warranty.model.dto.part.InstallPartSerialRequestDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    // Repositories and services injected via constructor (lombok @RequiredArgsConstructor)
    // These provide database access and auxiliary functionality used by the service methods
    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderPartRepository workOrderPartRepository;
    private final ClaimRepository claimRepository;
    private final ClaimStatusRepository claimStatusRepository;
    private final ClaimStatusHistoryRepository claimStatusHistoryRepository;
    private final UserRepository userRepository;
    private final PartSerialRepository partSerialRepository;
    private final WorkOrderMapper workOrderMapper;
    private final TechnicianProfileService technicianProfileService;
    private final ThirdPartyPartRepository thirdPartyPartRepository;
    private final VehicleRepository vehicleRepository;
    private final ThirdPartyPartSerialRepository thirdPartyPartSerialRepository;
    private final PartSerialService partSerialService;
    private final ThirdPartyPartService thirdPartyPartService;
    private final StockReservationRepository stockReservationRepository;

    @Override
    public WorkOrderResponseDTO createWorkOrder(WorkOrderCreateRequestDTO request) {
        // Entry point for creating a new work order for an existing claim
        log.info("Creating work order for claim ID: {}", request.getClaimId());

        // Fetch claim from DB or throw NotFoundException if claim id invalid
        Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + request.getClaimId()));

        // Work Orders can be created when claim status is READY_FOR_REPAIR (EVM flow)
        // SC_REPAIR claims should already have work orders created automatically at claim creation
        String currentStatus = claim.getStatus() != null ? claim.getStatus().getCode() : null;
        String repairType = claim.getRepairType();
        
        // Prevent manual creation for SC_REPAIR claims (business rule)
        if ("SC_REPAIR".equals(repairType)) {
            throw new ValidationException(
                    "SC work orders for SC_REPAIR claims are automatically created when the claim is created. " +
                    "Manual creation is not allowed. Current status: " + currentStatus + ", Repair type: " + repairType
            );
        }
        
        // Allow only when claim status is READY_FOR_REPAIR
        boolean isValidStatus = "READY_FOR_REPAIR".equals(currentStatus);
        
        if (!isValidStatus) {
            // Invalid timing to create work order -> reject request
            throw new ValidationException(
                    "Work orders can only be created when claim status is READY_FOR_REPAIR. Current status: " + currentStatus + ", Repair type: " + repairType
            );
        }

        // Fetch technician (user) who will be assigned to this work order
        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new NotFoundException("Technician not found with ID: " + request.getTechnicianId()));

        // Ensure the assigned user has technician role
        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
            throw new ValidationException("User is not a technician");
        }

        // Check technician availability for the requested start time
        LocalDateTime requestedStart = request.getStartTime();
        if (!technicianProfileService.canAssignWork(technician.getId(), requestedStart)) {
            throw new ValidationException(
                    String.format("Technician %s cannot be assigned at the requested time or is at capacity", technician.getUsername())
            );
        }

        // Determine the work order type: use request value if present, otherwise infer from claim
        String workOrderType = request.getWorkOrderType();
        if (workOrderType == null || workOrderType.isEmpty()) {
            // Infer from claim repair type: SC_REPAIR -> SC, otherwise default to EVM
            if (claim.getRepairType() != null) {
                workOrderType = "SC_REPAIR".equals(claim.getRepairType()) ? "SC" : "EVM";
            } else {
                workOrderType = "EVM"; // Default type
            }
        }

        // Build WorkOrder entity to persist
        WorkOrder workOrder = WorkOrder.builder()
                .claim(claim)
                .technician(technician)
                .startTime(request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now())
                .laborHours(request.getEstimatedLaborHours())
                .workOrderType(workOrderType)
                .status("OPEN") // Initial status when creating work order
                .build();

        // Persist work order to DB
        WorkOrder savedWorkOrder = workOrderRepository.save(workOrder);

        try {
            // Attempt to increment technician workload (non-blocking, failures are logged)
            technicianProfileService.incrementWorkload(technician.getId());
            log.info("Incremented workload for technician: {}", technician.getUsername());
        } catch (Exception e) {
            // If workload update fails, continue but log the issue
            log.warn("Failed to update technician profile workload: {}", e.getMessage());
        }

        log.info("Work order created successfully with ID: {}", savedWorkOrder.getId());

        // Map saved entity to response DTO and return
        return workOrderMapper.toResponseDTO(savedWorkOrder);
    }

    /**
     * Create initial work order when claim is first created
     * This bypasses status validation to allow work order creation at claim creation time
     */
    @Override
    public WorkOrderResponseDTO createInitialWorkOrder(WorkOrderCreateRequestDTO request) {
        // Similar to createWorkOrder but skips claim status checks so initial binding can happen
        log.info("Creating initial work order for claim ID: {} (bypassing status validation)", request.getClaimId());

        Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + request.getClaimId()));

        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new NotFoundException("Technician not found with ID: " + request.getTechnicianId()));

        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
            throw new ValidationException("User is not a technician");
        }

        // Skip availability check for initial binding - availability will be verified when work starts
        LocalDateTime requestedStart = request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now();

        // Determine work order type (same logic as createWorkOrder)
        String workOrderType = request.getWorkOrderType();
        if (workOrderType == null || workOrderType.isEmpty()) {
            if (claim.getRepairType() != null) {
                workOrderType = "SC_REPAIR".equals(claim.getRepairType()) ? "SC" : "EVM";
            } else {
                workOrderType = "EVM";
            }
        }

        // Build initial work order entity
        WorkOrder workOrder = WorkOrder.builder()
                .claim(claim)
                .technician(technician)
                .startTime(requestedStart)
                .laborHours(request.getEstimatedLaborHours() != null ? request.getEstimatedLaborHours() : BigDecimal.ZERO)
                .workOrderType(workOrderType)
                .status("OPEN")
                .build();

        // Save to DB
        WorkOrder savedWorkOrder = workOrderRepository.save(workOrder);

        try {
            // Increment technician workload (best-effort)
            technicianProfileService.incrementWorkload(technician.getId());
            log.info("Incremented workload for technician: {}", technician.getUsername());
        } catch (Exception e) {
            log.warn("Failed to update technician profile workload: {}", e.getMessage());
        }

        log.info("Initial work order created successfully with ID: {} for claim: {}", savedWorkOrder.getId(), claim.getClaimNumber());

        return workOrderMapper.toResponseDTO(savedWorkOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkOrderResponseDTO getWorkOrderById(Integer id) {
        // Retrieve work order by id and attach parts used
        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));
        WorkOrderResponseDTO dto = workOrderMapper.toResponseDTO(workOrder);
        // Load parts associated with this work order and convert to DTOs
        List<WorkOrderPart> parts = workOrderPartRepository.findByWorkOrderId(workOrder.getId());
        List<WorkOrderPartDTO> partDTOs = parts.stream().map(workOrderMapper::toPartDTO).collect(Collectors.toList());
        dto.setPartsUsed(partDTOs);
        dto.setParts(partDTOs); // Set alias for compatibility
        return dto;
    }

    @Override
    public WorkOrderResponseDTO updateWorkOrder(Integer id, WorkOrderUpdateRequestDTO request) {
        log.info("Updating work order ID: {}", id);

        // Find existing work order
        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));

        // Apply provided updates if present
        if (request.getEndTime() != null) {
            workOrder.setEndTime(request.getEndTime()); // Allow explicit end time override
        }
        if (request.getResult() != null) {
            workOrder.setResult(request.getResult()); // Set textual result/outcome of work
        }
        if (request.getLaborHours() != null) {
            workOrder.setLaborHours(request.getLaborHours()); // Update labor hours estimate/actual
        }
        String oldStatus = workOrder.getStatus();
        if (request.getStatus() != null) {
            workOrder.setStatus(request.getStatus());
            // If status changed to DONE and endTime not set, set endTime now
            if ("DONE".equals(request.getStatus()) && workOrder.getEndTime() == null) {
                workOrder.setEndTime(LocalDateTime.now());
            }
        }
        if (request.getStatusDescription() != null) {
            workOrder.setStatusDescription(request.getStatusDescription());
        }

        // Persist updates
        WorkOrder updatedWorkOrder = workOrderRepository.save(workOrder);
        log.info("Work order updated successfully");

        // If work order transitions to DONE from another status, perform post-completion actions
        if (request.getStatus() != null && "DONE".equals(request.getStatus()) && !"DONE".equals(oldStatus)) {
            // Attempt to install parts on the vehicle (best-effort)
            try {
                installPartsOnVehicle(updatedWorkOrder);
            } catch (Exception e) {
                log.warn("Failed to install parts on vehicle on update: {}", e.getMessage());
            }
            // Decrement technician workload if assigned (best-effort)
            try {
                if (updatedWorkOrder.getTechnician() != null) {
                    technicianProfileService.decrementWorkload(updatedWorkOrder.getTechnician().getId());
                    log.info("Decremented workload for technician on DONE status change: {}", updatedWorkOrder.getTechnician().getId());
                }
            } catch (Exception e) {
                log.warn("Failed to decrement technician workload on DONE status change: {}", e.getMessage());
            }
        }

        // Attempt to update claim status when work order becomes DONE
        if (request.getStatus() != null && "DONE".equals(request.getStatus()) && !"DONE".equals(oldStatus)) {
            try {
                updateClaimStatusToHandoverPending(updatedWorkOrder.getClaim());
            } catch (Exception e) {
                log.warn("Failed to update claim status to HANDOVER_PENDING: {}", e.getMessage());
            }
        }

        return workOrderMapper.toResponseDTO(updatedWorkOrder);
    }

    @Override
    public WorkOrderResponseDTO completeWorkOrder(Integer id) {
        // Convenience method to mark work order as completed without providing stats
        log.info("Completing work order ID: {}", id);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));

        if (workOrder.getEndTime() != null) {
            // Already completed -> reject
            throw new ValidationException("Work order is already completed");
        }

        // Mark completion time and status
        workOrder.setEndTime(LocalDateTime.now());
        workOrder.setStatus("DONE"); // Set status to DONE when completing
        WorkOrder completedWorkOrder = workOrderRepository.save(workOrder);

        // Free technician workload (best-effort)
        if (completedWorkOrder.getTechnician() != null) {
            try {
                technicianProfileService.decrementWorkload(completedWorkOrder.getTechnician().getId());
                log.info("Decremented workload for technician: {}", completedWorkOrder.getTechnician().getUsername());
            } catch (Exception e) {
                log.warn("Failed to update technician profile workload: {}", e.getMessage());
            }
        }

        // Attempt to install all parts associated with this work order on the vehicle
        try {
            installPartsOnVehicle(completedWorkOrder);
        } catch (Exception e) {
            log.warn("Failed to install parts on vehicle: {}", e.getMessage());
        }

        // Try to advance claim status to handover state
        try {
            updateClaimStatusToHandoverPending(completedWorkOrder.getClaim());
        } catch (Exception e) {
            log.warn("Failed to update claim status to HANDOVER_PENDING: {}", e.getMessage());
        }

        log.info("Work order completed successfully");
        return workOrderMapper.toResponseDTO(completedWorkOrder);
    }

    @Override
    public WorkOrderResponseDTO completeWorkOrderWithStats(Integer id, String result, BigDecimal laborHours) {
        // Complete work order and also update result and labor hours, then update technician statistics
        log.info("Completing work order ID: {} with labor hours: {}", id, laborHours);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + id));

        if (workOrder.getEndTime() != null) {
            throw new ValidationException("Work order is already completed");
        }

        if (workOrder.getTechnician() == null) {
            // Cannot complete a work order that doesn't have an assigned technician when using this method
            throw new ValidationException("Cannot complete work order without assigned technician");
        }

        // Set completion data
        workOrder.setEndTime(LocalDateTime.now());
        workOrder.setStatus("DONE");
        workOrder.setResult(result);
        workOrder.setLaborHours(laborHours);

        WorkOrder completedWorkOrder = workOrderRepository.save(workOrder);

        Integer technicianId = completedWorkOrder.getTechnician().getId();
        try {
            // Decrement current workload
            technicianProfileService.decrementWorkload(technicianId);
            log.info("Decremented workload for technician ID: {}", technicianId);
        } catch (Exception e) {
            log.warn("Failed to decrement workload: {}", e.getMessage());
        }

        try {
            // Update technician performance stats (best-effort)
            technicianProfileService.updateWorkOrderCompletion(technicianId, laborHours);
            log.info("Updated completion statistics for technician ID: {}", technicianId);
        } catch (Exception e) {
            log.warn("Failed to update completion statistics: {}", e.getMessage());
        }

        // Install parts associated with the work order
        try {
            installPartsOnVehicle(completedWorkOrder);
        } catch (Exception e) {
            log.warn("Failed to install parts on vehicle: {}", e.getMessage());
        }

        // Update claim status to handover state (best-effort)
        try {
            updateClaimStatusToHandoverPending(completedWorkOrder.getClaim());
        } catch (Exception e) {
            log.warn("Failed to update claim status to HANDOVER_PENDING: {}", e.getMessage());
        }

        log.info("Work order completed with stats successfully");
        return workOrderMapper.toResponseDTO(completedWorkOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderResponseDTO> getWorkOrdersByClaimId(Integer claimId) {
        // Return list of work orders for the given claim, each augmented with parts list
        List<WorkOrder> workOrders = workOrderRepository.findByClaimId(claimId);
        return workOrders.stream()
                .map(wo -> {
                    WorkOrderResponseDTO dto = workOrderMapper.toResponseDTO(wo);
                    // Fetch and populate parts for this work order
                    List<WorkOrderPart> parts = workOrderPartRepository.findByWorkOrderId(wo.getId());
                    List<WorkOrderPartDTO> partDTOs = workOrderMapper.toPartDTOList(parts);
                    dto.setPartsUsed(partDTOs);
                    dto.setParts(partDTOs); // Also set the alias
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderResponseDTO> getWorkOrdersByTechnicianId(Integer technicianId) {
        // Return work orders assigned to a technician
        List<WorkOrder> workOrders = workOrderRepository.findByTechnicianId(technicianId);
        return workOrders.stream()
                .map(workOrderMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderResponseDTO> getAllWorkOrders(Pageable pageable) {
        // Paginated retrieval of all work orders
        Page<WorkOrder> workOrders = workOrderRepository.findAll(pageable);
        return workOrders.map(workOrderMapper::toResponseDTO);
    }

    @Override
    public WorkOrderResponseDTO addPartToWorkOrder(Integer workOrderId, WorkOrderPartDTO partDTO) {
        log.info("Adding part to work order ID: {}", workOrderId);

        // Load work order
        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + workOrderId));

        // Default quantity to 1 if not provided or invalid
        if (partDTO.getQuantity() == null || partDTO.getQuantity() <= 0) {
            partDTO.setQuantity(1);
        }

        // Determine source of the part (THIRD_PARTY or EVM_WAREHOUSE)
        String source = (partDTO.getPartSource() != null ? partDTO.getPartSource() : "EVM_WAREHOUSE").toUpperCase();
        WorkOrderPart workOrderPart;
        switch (source) {
            case "THIRD_PARTY" -> {
                // For third-party parts, require thirdPartyPartId and optional serial number
                if (partDTO.getThirdPartyPartId() == null) {
                    throw new ValidationException("thirdPartyPartId is required for THIRD_PARTY source");
                }
                ThirdPartyPart tpPart = thirdPartyPartRepository.findById(partDTO.getThirdPartyPartId())
                        .orElseThrow(() -> new NotFoundException("Third-party part not found with ID: " + partDTO.getThirdPartyPartId()));
                workOrderPart = WorkOrderPart.builder()
                        .workOrder(workOrder)
                        .part(null) // No internal 'Part' entity for third-party items
                        .partSerial(null)
                        .quantity(partDTO.getQuantity())
                        .partSource("THIRD_PARTY")
                        .thirdPartyPart(tpPart)
                        .thirdPartySerialNumber(partDTO.getThirdPartySerialNumber())
                        .build();
            }
            case "EVM_WAREHOUSE" -> {
                // For internal EVM parts, require a specific part serial id
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

        // Save the association between work order and part
        workOrderPartRepository.save(workOrderPart);
        log.info("Part added to work order successfully (source: {})", source);

        // Return updated work order info with parts populated
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

        // Find the work order part record and validate ownership
        WorkOrderPart workOrderPart = workOrderPartRepository.findById(partId)
                .orElseThrow(() -> new NotFoundException("Work order part not found with ID: " + partId));

        if (!workOrderPart.getWorkOrder().getId().equals(workOrderId)) {
            throw new ValidationException("Part does not belong to the specified work order");
        }

        // Delete the association record
        workOrderPartRepository.delete(workOrderPart);
        log.info("Part removed from work order successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderPartDTO> getWorkOrderParts(Integer workOrderId) {
        // Retrieve parts for a work order and map to DTOs
        List<WorkOrderPart> parts = workOrderPartRepository.findByWorkOrderId(workOrderId);
        return parts.stream()
                .map(workOrderMapper::toPartDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canTechnicianTakeNewWorkOrder(Integer technicianId, int maxActiveWorkOrders) {
        // Proxy call to technician profile service to determine availability/capacity
        return technicianProfileService.canAssignWork(technicianId);
    }

    @Override
    public WorkOrderResponseDTO assignTechnician(Integer workOrderId, Integer technicianId) {
        log.info("Assigning technician ID: {} to work order ID: {}", technicianId, workOrderId);

        // Load work order and technician user
        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + workOrderId));

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new NotFoundException("Technician not found with ID: " + technicianId));

        // Validate role and active status
        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
            throw new ValidationException("User is not a technician");
        }

        if (!Boolean.TRUE.equals(technician.getActive())) {
            throw new ValidationException("Technician is not active");
        }

        // Check if technician can be assigned at the work order's start time
        LocalDateTime requestedStart = workOrder.getStartTime();
        if (!technicianProfileService.canAssignWork(technicianId, requestedStart)) {
            throw new ValidationException(
                    String.format("Technician %s cannot be assigned at the requested time or is at capacity", technician.getUsername())
            );
        }

        // If previously assigned to a different technician, decrement previous workload
        if (workOrder.getTechnician() != null && !workOrder.getTechnician().getId().equals(technicianId)) {
            Integer previousTechnicianId = workOrder.getTechnician().getId();
            try {
                technicianProfileService.decrementWorkload(previousTechnicianId);
                log.info("Decremented workload for previous technician ID: {}", previousTechnicianId);
            } catch (Exception e) {
                log.warn("Failed to decrement previous technician workload: {}", e.getMessage());
            }
        }

        // Assign new technician and persist
        workOrder.setTechnician(technician);
        WorkOrder updatedWorkOrder = workOrderRepository.save(workOrder);

        try {
            // Increment new technician workload
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

        // Prevent reassigning completed work orders
        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new NotFoundException("Work order not found with ID: " + workOrderId));

        if (workOrder.getEndTime() != null) {
            throw new ValidationException("Cannot reassign completed work order");
        }

        // Delegate to assignTechnician which handles workload adjustments
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

        // Mark as ended and set cancellation reason
        workOrder.setEndTime(LocalDateTime.now());
        workOrder.setResult("CANCELLED: " + reason);

        WorkOrder cancelledWorkOrder = workOrderRepository.save(workOrder);

        // Free technician workload if assigned
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

        // Ensure technician is assigned before starting
        if (workOrder.getTechnician() == null) {
            throw new ValidationException("Cannot start work order without assigned technician");
        }

        if (workOrder.getEndTime() != null) {
            throw new ValidationException("Work order is already completed");
        }

        // If start time already set, possibly update claim status and return current state
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

        // Set start time now and persist
        workOrder.setStartTime(LocalDateTime.now());
        WorkOrder startedWorkOrder = workOrderRepository.save(workOrder);

        // Ensure claim status reflects repair in progress
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

        // Load technician user and validate role
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new NotFoundException("Technician not found with ID: " + technicianId));

        if (!"SC_TECHNICIAN".equals(technician.getRole().getRoleName())) {
            throw new ValidationException("User is not a technician");
        }

        // Fetch all work orders assigned to this technician
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

        // Compute average completion time in hours for completed work orders
        double averageCompletionTimeHours = allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() != null && wo.getStartTime() != null)
                .mapToDouble(wo -> {
                    long hours = java.time.Duration.between(wo.getStartTime(), wo.getEndTime()).toHours();
                    return hours;
                })
                .average()
                .orElse(0.0);

        // Count total parts used across all work orders
        int totalPartsUsed = allWorkOrders.stream()
                .mapToInt(wo -> workOrderPartRepository.findByWorkOrderId(wo.getId()).size())
                .sum();

        double averagePartsPerWorkOrder = totalWorkOrders > 0 ? (double) totalPartsUsed / totalWorkOrders : 0.0;

        // Determine last created and last completed timestamps
        LocalDateTime lastWorkOrderCreated = allWorkOrders.stream()
                .map(wo -> wo.getStartTime() != null ? wo.getStartTime() : LocalDateTime.now())
                .max(LocalDateTime::compareTo)
                .orElse(null);

        LocalDateTime lastWorkOrderCompleted = allWorkOrders.stream()
                .filter(wo -> wo.getEndTime() != null)
                .map(WorkOrder::getEndTime)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        int maxCapacity = 5; // Default max capacity if profile not available
        int currentLoad = activeWorkOrders;
        boolean canTakeNewWorkOrder = false;

        try {
            // Try to fetch profile-based capacity and current workload
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

        // Build lists of active and recent completed work order summaries
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

        // Build workload DTO containing aggregated metrics and summaries
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
        // Map a single WorkOrder entity into a lightweight summary DTO for display
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

    /**
     * Updates claim status when work order is marked as DONE
     * For SC_REPAIR: updates to READY_FOR_HANDOVER
     * For EVM_REPAIR: updates to HANDOVER_PENDING
     */
    private void updateClaimStatusToHandoverPending(Claim claim) {
        // Guard clause: nothing to do if claim is null
        if (claim == null) {
            return;
        }

        // Determine current status code and repair type
        String currentStatus = claim.getStatus() != null ? claim.getStatus().getCode() : null;
        String repairType = claim.getRepairType();
        
        // Only update if claim not already in a handover or final state
        if ("READY_FOR_HANDOVER".equals(currentStatus) ||
            "HANDOVER_PENDING".equals(currentStatus) || 
            "CLAIM_DONE".equals(currentStatus) || 
            "CLOSED".equals(currentStatus)) {
            log.debug("Claim {} already in status {}, skipping update", claim.getId(), currentStatus);
            return;
        }

        // Choose target status based on repair type
        String targetStatusCode;
        if ("SC_REPAIR".equals(repairType)) {
            // SC Repair flow expects READY_FOR_HANDOVER
            targetStatusCode = "READY_FOR_HANDOVER";
        } else {
            // EVM Repair flow expects HANDOVER_PENDING
            targetStatusCode = "HANDOVER_PENDING";
        }

        // Fetch the ClaimStatus entity for target code or throw if not found
        ClaimStatus targetStatus = claimStatusRepository.findByCode(targetStatusCode)
                .orElseThrow(() -> new NotFoundException("Status " + targetStatusCode + " not found"));

        // Persist claim status change
        ClaimStatus oldStatus = claim.getStatus();
        claim.setStatus(targetStatus);
        claim = claimRepository.save(claim);

        // Create a status history entry recording who caused the change
        User currentUser = getCurrentUser();
        createStatusHistory(claim, targetStatus, currentUser,
                String.format("Work order completed. Claim status automatically updated from %s to %s", 
                        oldStatus != null ? oldStatus.getCode() : "unknown", targetStatusCode));

        log.info("Claim {} status updated to {} after work order completion (Repair type: {})", 
                claim.getId(), targetStatusCode, repairType);
    }

    /**
     * Install all parts and serials from work order on the vehicle
     */
    private void installPartsOnVehicle(WorkOrder workOrder) {
        // Ensure necessary context exists (work order -> claim -> vehicle)
        if (workOrder == null || workOrder.getClaim() == null || workOrder.getClaim().getVehicle() == null) {
            log.warn("Cannot install parts: work order, claim, or vehicle is null");
            return;
        }

        Claim claim = workOrder.getClaim();
        Vehicle vehicle = claim.getVehicle();
        String vehicleVin = vehicle.getVin();
        String installedBy = workOrder.getTechnician() != null ? workOrder.getTechnician().getUsername() : "system";
        Integer workOrderId = workOrder.getId();
        Integer claimId = claim.getId();

        log.info("Installing parts from work order {} on vehicle {} (claim {})", workOrderId, vehicleVin, claimId);

        // Get all parts associated with this work order
        List<WorkOrderPart> workOrderParts = workOrderPartRepository.findByWorkOrderId(workOrderId);

        for (WorkOrderPart workOrderPart : workOrderParts) {
            try {
                if ("THIRD_PARTY".equals(workOrderPart.getPartSource())) {
                    // Third-party parts: locate serial and call thirdPartyPartService to install
                    if (workOrderPart.getThirdPartySerialNumber() != null && !workOrderPart.getThirdPartySerialNumber().isEmpty()) {
                        ThirdPartyPartSerial serial = thirdPartyPartSerialRepository.findBySerialNumber(workOrderPart.getThirdPartySerialNumber())
                                .orElse(null);
                        
                        if (serial != null) {
                            // Only install if not already installed and serial is in an appropriate status
                            if (serial.getInstalledOnVehicle() == null &&
                                ("AVAILABLE".equals(serial.getStatus()) || "RESERVED".equals(serial.getStatus()))) {
                                try {
                                    thirdPartyPartService.installSerialOnVehicle(
                                        serial.getId(), 
                                        vehicleVin, 
                                        workOrderId, 
                                        installedBy
                                    );
                                    log.info("Installed third-party serial {} on vehicle {}", 
                                            workOrderPart.getThirdPartySerialNumber(), vehicleVin);
                                } catch (Exception e) {
                                    log.warn("Failed to install third-party serial {}: {}", 
                                            workOrderPart.getThirdPartySerialNumber(), e.getMessage());
                                }
                            } else {
                                // Serial already installed or not in installable status
                                log.debug("Third-party serial {} already installed or not available. Status: {}, Vehicle: {}",
                                        workOrderPart.getThirdPartySerialNumber(), 
                                        serial.getStatus(),
                                        serial.getInstalledOnVehicle() != null ? serial.getInstalledOnVehicle().getVin() : "none");
                            }
                        } else {
                            // Serial number not found in DB
                            log.warn("Third-party serial {} not found in database", workOrderPart.getThirdPartySerialNumber());
                        }
                    }
                } else {
                    // EVM internal parts: use partSerialService to install
                    if (workOrderPart.getPartSerial() != null) {
                        PartSerial partSerial = workOrderPart.getPartSerial();
                        
                        // Only install if not already installed and part serial in appropriate status
                        if (partSerial.getInstalledOnVehicle() == null &&
                            ("in_stock".equals(partSerial.getStatus()) || "allocated".equals(partSerial.getStatus()))) {
                            try {
                                InstallPartSerialRequestDTO installRequest = InstallPartSerialRequestDTO.builder()
                                        .serialNumber(partSerial.getSerialNumber())
                                        .vehicleVin(vehicleVin)
                                        .workOrderId(workOrderId)
                                        .notes("Auto-installed when work order completed")
                                        .build();
                                
                                partSerialService.installPartSerial(installRequest);
                                log.info("Installed EVM part serial {} on vehicle {}", 
                                        partSerial.getSerialNumber(), vehicleVin);
                            } catch (Exception e) {
                                log.warn("Failed to install EVM part serial {}: {}", 
                                        partSerial.getSerialNumber(), e.getMessage());
                            }
                        } else {
                            // Serial already installed or not available for installation
                            log.debug("EVM part serial {} already installed or not available. Status: {}, Vehicle: {}",
                                    partSerial.getSerialNumber(), 
                                    partSerial.getStatus(),
                                    partSerial.getInstalledOnVehicle() != null ? partSerial.getInstalledOnVehicle().getVin() : "none");
                        }
                    }
                }
            } catch (Exception e) {
                // Catch-all to ensure one failing part doesn't stop processing of others
                log.error("Error processing work order part {}: {}", workOrderPart.getId(), e.getMessage(), e);
            }
        }

        // Also install any RESERVED third-party serials that were reserved for this claim
        // (These might not be in WorkOrderPart yet, but were reserved during diagnostic)
        try {
            List<ThirdPartyPartSerial> reservedSerials = thirdPartyPartSerialRepository
                    .findByReservedForClaimIdAndStatus(claimId, "RESERVED")
                    .stream()
                    .filter(serial -> serial.getInstalledOnVehicle() == null)
                    .collect(Collectors.toList());

            for (ThirdPartyPartSerial reservedSerial : reservedSerials) {
                try {
                    thirdPartyPartService.installSerialOnVehicle(
                        reservedSerial.getId(),
                        vehicleVin,
                        workOrderId,
                        installedBy
                    );
                    log.info("Installed reserved third-party serial {} on vehicle {} (from claim reservation)", 
                            reservedSerial.getSerialNumber(), vehicleVin);
                } catch (Exception e) {
                    log.warn("Failed to install reserved third-party serial {}: {}", 
                            reservedSerial.getSerialNumber(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Error installing reserved serials for claim {}: {}", claimId, e.getMessage());
        }

        // Install EVM reserved parts from StockReservations (for EVM repair flow)
        // These are parts that EVM sent to the service center for this claim/work order
        try {
            List<StockReservation> stockReservations = stockReservationRepository
                    .findByClaimOrWorkOrder(claimId, workOrderId)
                    .stream()
                    .filter(reservation -> 
                        reservation.getPartSerial() != null && // Has a specific serial assigned
                        ("COMMITTED".equals(reservation.getStatus()) || "CREATED".equals(reservation.getStatus())) && // Reservation is active
                        reservation.getPartSerial().getInstalledOnVehicle() == null && // Not already installed
                        ("allocated".equals(reservation.getPartSerial().getStatus()) || "in_stock".equals(reservation.getPartSerial().getStatus())) // Available for installation
                    )
                    .collect(Collectors.toList());

            for (StockReservation reservation : stockReservations) {
                PartSerial partSerial = reservation.getPartSerial();
                if (partSerial != null) {
                    try {
                        InstallPartSerialRequestDTO installRequest = InstallPartSerialRequestDTO.builder()
                                .serialNumber(partSerial.getSerialNumber())
                                .vehicleVin(vehicleVin)
                                .workOrderId(workOrderId)
                                .notes("Auto-installed from EVM reservation when work order completed")
                                .build();
                        
                        partSerialService.installPartSerial(installRequest);
                        log.info("Installed EVM reserved part serial {} on vehicle {} (from StockReservation {})", 
                                partSerial.getSerialNumber(), vehicleVin, reservation.getId());
                    } catch (Exception e) {
                        log.warn("Failed to install EVM reserved part serial {}: {}", 
                                partSerial.getSerialNumber(), e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error installing EVM reserved parts for claim {} / work order {}: {}", 
                    claimId, workOrderId, e.getMessage());
        }

        log.info("Completed installing parts from work order {} on vehicle {}", workOrderId, vehicleVin);
    }

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        try {
            // Attempt to read currently authenticated principal from security context
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) {
                // Fallback to 'system' user when no auth context available
                return userRepository.findByUsername("system")
                        .orElseThrow(() -> new NotFoundException("System user not found"));
            }
            String username = auth.getName();
            return userRepository.findByUsername(username)
                    .orElseThrow(() -> new NotFoundException("Current user not found"));
        } catch (Exception e) {
            // On any error, log and fallback to 'system' user
            log.warn("Could not get current user, using system user: {}", e.getMessage());
            return userRepository.findByUsername("system")
                    .orElseThrow(() -> new NotFoundException("System user not found"));
        }
    }

    /**
     * Create status history entry
     */
    private void createStatusHistory(Claim claim, ClaimStatus status, User changedBy, String note) {
        // Build and persist a ClaimStatusHistory entry for auditing and traceability
        ClaimStatusHistory history = ClaimStatusHistory.builder()
                .claim(claim)
                .status(status)
                .changedBy(changedBy)
                .note(note)
                .build();
        claimStatusHistoryRepository.save(history);
    }
}
