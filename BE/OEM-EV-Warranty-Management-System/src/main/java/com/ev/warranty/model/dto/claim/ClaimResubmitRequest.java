package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ClaimResubmitRequest {

    @NotBlank
    @Size(min = 20, max = 2000)
    private String revisedDiagnostic;

    private List<String> additionalEvidence;

    @NotBlank
    @Size(min = 10, max = 1000)
    private String responseToRejection;
}
