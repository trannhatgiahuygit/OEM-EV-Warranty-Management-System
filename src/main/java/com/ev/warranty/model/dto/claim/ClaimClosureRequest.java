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
public class ClaimClosureRequest {

    @NotBlank(message = "Closure reason is required")
    private String closureReason;

    private String finalNotes;
    private String lessonsLearned;
    private LocalDateTime closedAt;
    private Boolean customerNotified;
}
