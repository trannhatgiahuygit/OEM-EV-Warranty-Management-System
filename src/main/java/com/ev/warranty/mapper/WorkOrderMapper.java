package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.workorder.WorkOrderResponseDTO;
import com.ev.warranty.model.dto.workorder.WorkOrderPartDTO;
import com.ev.warranty.model.entity.WorkOrder;
import com.ev.warranty.model.entity.WorkOrderPart;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class WorkOrderMapper {

    public WorkOrderResponseDTO toResponseDTO(WorkOrder workOrder) {
        if (workOrder == null) {
            return null;
        }

        return WorkOrderResponseDTO.builder()
                .id(workOrder.getId())
                .claimId(workOrder.getClaim().getId())
                .claimNumber(workOrder.getClaim().getClaimNumber())
                .technicianId(workOrder.getTechnician().getId())
                .technicianName(workOrder.getTechnician().getUsername()) // Fixed: using username instead of getFullName
                .startTime(workOrder.getStartTime())
                .endTime(workOrder.getEndTime())
                .result(workOrder.getResult())
                .laborHours(workOrder.getLaborHours())
                .status(workOrder.getEndTime() != null ? "COMPLETED" : "IN_PROGRESS")
                .partsUsed(new ArrayList<>()) // Will be populated separately if needed
                .build();
    }

    public WorkOrderPartDTO toPartDTO(WorkOrderPart workOrderPart) {
        if (workOrderPart == null) {
            return null;
        }

        return WorkOrderPartDTO.builder()
                .id(workOrderPart.getId())
                .partSerialId(workOrderPart.getPartSerial() != null ? workOrderPart.getPartSerial().getId() : null)
                .partSerialNumber(workOrderPart.getPartSerial() != null ? workOrderPart.getPartSerial().getSerialNumber() : null)
                .partName(workOrderPart.getPart() != null ? workOrderPart.getPart().getName() : null)
                .quantity(workOrderPart.getQuantity())
                .build();
    }

    public List<WorkOrderResponseDTO> toResponseDTOList(List<WorkOrder> workOrders) {
        if (workOrders == null) {
            return new ArrayList<>();
        }
        return workOrders.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<WorkOrderPartDTO> toPartDTOList(List<WorkOrderPart> workOrderParts) {
        if (workOrderParts == null) {
            return new ArrayList<>();
        }
        return workOrderParts.stream()
                .map(this::toPartDTO)
                .collect(Collectors.toList());
    }
}
