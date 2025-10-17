package com.ev.warranty.model.dto.claim;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClaimInspectionRequest {

    @NotNull(message = "Inspection date is required")
    private java.time.LocalDateTime inspectedAt;

    @NotNull(message = "Inspection passed status is required")
    private Boolean inspectionPassed;

    private String inspectionNotes;

    private String qualityCheckItems; // JSON or comma-separated list

    private String defectsFound;

    private String correctiveActions;

    private String inspectorName;

    private String inspectorSignature; // Could be digital signature or initials
}