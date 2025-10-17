package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimRepairCompletionRequest {

    @NotBlank(message = "Repair summary is required")
    private String repairSummary;

    private String partsUsed;
    private String laborHours;
    private String testResults;
    private String qualityCheckNotes;

    private LocalDateTime completedAt;
    private List<String> completionPhotos;
}
