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
public class TechnicianTaskDto {
    private Integer id;
    private Integer technicianId;
    private String technicianName;
    private Integer claimId;
    private String claimNumber;
    private String vehicleVin;
    private String customerName;
    private String taskType;
    private String status;
    private String priority;
    private String description;
    private String workNotes;
    private String completionNotes;
    private LocalDateTime assignedDate;
    private LocalDateTime startedDate;
    private LocalDateTime completedDate;
    private LocalDateTime estimatedCompletionDate;
    private Double estimatedHours;
    private Double actualHours;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
