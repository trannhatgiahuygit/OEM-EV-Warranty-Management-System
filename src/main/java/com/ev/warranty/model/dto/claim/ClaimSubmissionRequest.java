package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClaimSubmissionRequest {
    @NotNull(message = "Claim ID is required")
    private Integer claimId;

    private String submissionNotes;

    // Force submission even if some requirements are missing (admin only)
    private Boolean forceSubmit = false;
}
