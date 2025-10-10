package com.ev.warranty.model.dto.claim;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class ClaimValidationResult {
    private Boolean canSubmit;
    private List<String> missingRequirements;

    public ClaimValidationResult() {
        this.missingRequirements = new ArrayList<>();
    }

    public ClaimValidationResult(Boolean canSubmit) {
        this.canSubmit = canSubmit;
        this.missingRequirements = new ArrayList<>();
    }

    public ClaimValidationResult(Boolean canSubmit, List<String> missingRequirements) {
        this.canSubmit = canSubmit;
        this.missingRequirements = missingRequirements != null ? missingRequirements : new ArrayList<>();
    }
}
