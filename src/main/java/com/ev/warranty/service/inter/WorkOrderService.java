package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.workorder.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface WorkOrderService {

    WorkOrderResponseDTO createWorkOrder(WorkOrderCreateRequestDTO request);

    WorkOrderResponseDTO getWorkOrderById(Integer id);

    WorkOrderResponseDTO updateWorkOrder(Integer id, WorkOrderUpdateRequestDTO request);

    WorkOrderResponseDTO completeWorkOrder(Integer id);

    List<WorkOrderResponseDTO> getWorkOrdersByClaimId(Integer claimId);

    List<WorkOrderResponseDTO> getWorkOrdersByTechnicianId(Integer technicianId);

    Page<WorkOrderResponseDTO> getAllWorkOrders(Pageable pageable);

    WorkOrderResponseDTO addPartToWorkOrder(Integer workOrderId, WorkOrderPartDTO partDTO);

    void removePartFromWorkOrder(Integer workOrderId, Integer partId);

    List<WorkOrderPartDTO> getWorkOrderParts(Integer workOrderId);

    boolean canTechnicianTakeNewWorkOrder(Integer technicianId, int maxActiveWorkOrders);

    WorkOrderWorkloadDTO getTechnicianWorkload(Integer technicianId);

    // ✅ NEW METHODS - Integration with TechnicianProfile

    /**
     * Assign technician to work order with availability check
     * Automatically updates TechnicianProfile workload
     */
    WorkOrderResponseDTO assignTechnician(Integer workOrderId, Integer technicianId);

    /**
     * Reassign work order to different technician
     * Updates both old and new technician's workload
     */
    WorkOrderResponseDTO reassignTechnician(Integer workOrderId, Integer newTechnicianId);

    /**
     * Complete work order with labor hours
     * Automatically updates TechnicianProfile statistics
     */
    WorkOrderResponseDTO completeWorkOrderWithStats(Integer id, String result, BigDecimal laborHours);

    /**
     * Cancel work order
     * Frees up technician's workload
     */
    WorkOrderResponseDTO cancelWorkOrder(Integer id, String reason);

    /**
     * Start work order (set status to IN_PROGRESS)
     */
    WorkOrderResponseDTO startWorkOrder(Integer id);
}