package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProblemResolutionRequest {
    private Integer claimId;

    @NotBlank
    private String resolutionAction; // PARTS_SHIPPED, APPROVED_ALTERNATIVE, CUSTOMER_CONTACTED

    @NotBlank
    private String resolutionNotes;

    private String trackingNumber;

    private LocalDate estimatedArrival;
}
