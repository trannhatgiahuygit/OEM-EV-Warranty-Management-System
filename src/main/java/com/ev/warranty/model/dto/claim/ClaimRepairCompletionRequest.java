package com.ev.warranty.model.dto.claim;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClaimRepairCompletionRequest {

    @NotNull(message = "Completion date is required")
    private LocalDateTime completedAt;

    @NotBlank(message = "Repair summary is required")
    private String repairSummary;

    private String repairNotes;

    private List<String> partsReplaced; // List of part serial numbers replaced

    private Integer totalLaborHours;

    private String qualityCheckResults;

    @Builder.Default
    private Boolean requiresCustomerApproval = false;

    private String additionalNotes;
}