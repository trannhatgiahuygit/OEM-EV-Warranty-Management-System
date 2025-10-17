package com.ev.warranty.model.dto.claim;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimCompletionStatusDTO {

    private Integer claimId;
    private String claimNumber;
    private String currentStatus;
    private String nextStep;

    // Progress indicators
    private Boolean repairCompleted;
    private Boolean inspectionPassed;
    private Boolean readyForHandover;
    private Boolean vehicleHandedOver;
    private Boolean claimClosed;

    // Completion requirements
    private List<String> pendingActions;
    private List<String> completedActions;

    // Progress percentage
    private Integer completionPercentage;
}
