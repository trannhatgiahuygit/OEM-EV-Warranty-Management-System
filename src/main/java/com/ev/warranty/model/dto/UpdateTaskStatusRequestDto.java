package com.ev.warranty.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTaskStatusRequestDto {
    private String status; // ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    private String notes;
    private Double actualHours;
}
