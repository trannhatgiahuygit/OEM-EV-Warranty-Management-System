package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConfirmResolutionRequest {
    @NotNull
    private Boolean confirmed;
    @NotNull
    private String nextAction; // READY_FOR_REPAIR or REPORT_NEW_PROBLEM
    private String confirmationNotes;
}
