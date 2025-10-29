package com.ev.warranty.model.dto.workorder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderResponseDTO {

    private Integer id;
    private Integer claimId;
    private String claimNumber;
    private Integer technicianId;
    private String technicianName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String result;
    private BigDecimal laborHours;
    private String status;
    private List<WorkOrderPartDTO> partsUsed;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}
