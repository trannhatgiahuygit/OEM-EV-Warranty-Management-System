package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimInspectionRequest {

    @NotBlank(message = "Inspection result is required")
    private String inspectionResult;

    @NotBlank(message = "Inspector name is required")
    private String inspectorName;

    private String qualityNotes;
    private Boolean passedInspection;
    private String issuesFound;
    private LocalDateTime inspectedAt;
}
