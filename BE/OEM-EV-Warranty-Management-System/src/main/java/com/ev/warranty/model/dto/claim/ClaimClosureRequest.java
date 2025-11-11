package com.ev.warranty.model.dto.claim;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClaimClosureRequest {

    @NotNull(message = "Closure date is required")
    private LocalDateTime closedAt;

    @NotBlank(message = "Closure reason is required")
    private String closureReason; // COMPLETED, CANCELLED, RESOLVED, etc.

    @NotBlank(message = "Closure summary is required")
    private String closureSummary;

    private String lessonsLearned;

    private String followUpActions;

    private Boolean customerSatisfied;

    private String finalNotes;

    private String closedBy; // Username of person closing the claim
}