package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.workorder.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
    
    // New method for missing API
    WorkOrderWorkloadDTO getTechnicianWorkload(Integer technicianId);
}
