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

        var builder = WorkOrderResponseDTO.builder()
                .id(workOrder.getId())
                .startTime(workOrder.getStartTime())
                .endTime(workOrder.getEndTime())
                .result(workOrder.getResult())
                .laborHours(workOrder.getLaborHours())
                .status(workOrder.getStatus() != null ? workOrder.getStatus() : 
                        (workOrder.getEndTime() != null ? "COMPLETED" : "IN_PROGRESS")) // Fallback to old logic
                .workOrderType(workOrder.getWorkOrderType())
                .statusDescription(workOrder.getStatusDescription())
                .partsUsed(new ArrayList<>())
                .parts(new ArrayList<>());

        // Claim flattened fields and nested ref
        if (workOrder.getClaim() != null) {
            builder.claimId(workOrder.getClaim().getId())
                   .claimNumber(workOrder.getClaim().getClaimNumber())
                   .claim(WorkOrderResponseDTO.ClaimRef.builder()
                           .id(workOrder.getClaim().getId())
                           .claimNumber(workOrder.getClaim().getClaimNumber())
                           .build());
        }

        // Technician flattened fields and nested ref
        if (workOrder.getTechnician() != null) {
            builder.technicianId(workOrder.getTechnician().getId())
                   .technicianName(workOrder.getTechnician().getUsername())
                   .technician(WorkOrderResponseDTO.TechnicianRef.builder()
                           .id(workOrder.getTechnician().getId())
                           .username(workOrder.getTechnician().getUsername())
                           .fullName(workOrder.getTechnician().getFullName())
                           .build());
        }

        return builder.build();
    }

    public WorkOrderPartDTO toPartDTO(WorkOrderPart workOrderPart) {
        if (workOrderPart == null) {
            return null;
        }

        WorkOrderPartDTO dto = WorkOrderPartDTO.builder()
                .id(workOrderPart.getId())
                .partSerialId(workOrderPart.getPartSerial() != null ? workOrderPart.getPartSerial().getId() : null)
                .partSerialNumber(workOrderPart.getPartSerial() != null ? workOrderPart.getPartSerial().getSerialNumber() : null)
                .partName(workOrderPart.getPart() != null ? workOrderPart.getPart().getName() :
                        (workOrderPart.getThirdPartyPart() != null ? workOrderPart.getThirdPartyPart().getName() : null))
                .quantity(workOrderPart.getQuantity())
                .build();

        // Map third-party fields
        dto.setPartSource(workOrderPart.getPartSource());
        dto.setThirdPartyPartId(workOrderPart.getThirdPartyPart() != null ? workOrderPart.getThirdPartyPart().getId() : null);
        dto.setThirdPartySerialNumber(workOrderPart.getThirdPartySerialNumber());
        return dto;
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
