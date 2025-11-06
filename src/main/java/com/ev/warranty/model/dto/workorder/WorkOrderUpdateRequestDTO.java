package com.ev.warranty.model.dto.workorder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderUpdateRequestDTO {

    private LocalDateTime endTime;
    private String result;
    private BigDecimal laborHours;
    private String status; // OPEN, DONE, CLOSED
    private String statusDescription; // For problem descriptions
}
