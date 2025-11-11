package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ProblemReportRequest {
    private Integer claimId;

    @NotBlank
    private String problemType; // PARTS_SHORTAGE, WRONG_DIAGNOSIS, CUSTOMER_ISSUE, OTHER

    @NotBlank
    @Size(min = 10, max = 1000)
    private String problemDescription;

    private List<String> missingPartSerials;

    private Integer estimatedResolutionDays;
}
