package com.ev.warranty.model.dto.workorder;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WorkOrderAssignTechnicianRequestDTO {
    @NotNull(message = "Technician ID is required")
    private Integer technicianId;
}
