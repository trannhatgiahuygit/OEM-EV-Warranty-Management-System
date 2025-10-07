package com.ev.warranty.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepairProgressDto {
    private Integer id;
    private Integer claimId;
    private String claimNumber;
    private Integer technicianId;
    private String technicianName;
    private String progressStep;
    private String status;
    private String description;
    private String workPerformed;
    private String issues;
    private String notes;
    private Double hoursSpent;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
