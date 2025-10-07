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
public class CreateTaskRequestDto {
    private Integer technicianId;
    private Integer claimId;
    private String taskType; // DIAGNOSIS, REPAIR, REPLACEMENT, INSPECTION, TESTING
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    private String description;
    private Double estimatedHours;
    private LocalDateTime estimatedCompletionDate;
}
