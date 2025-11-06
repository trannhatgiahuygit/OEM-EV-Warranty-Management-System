package com.ev.warranty.model.dto.claim;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClaimCompletionStatusDTO {

    private Integer claimId;
    private String claimNumber;
    private String currentStatus;
    private Integer completionPercentage;
    
    // Workflow steps
    private Boolean repairCompleted;
    private Boolean inspectionPassed;
    private Boolean readyForHandover;
    private Boolean vehicleHandedOver;
    private Boolean claimClosed;
    
    // Timestamps
    private LocalDateTime repairCompletedAt;
    private LocalDateTime inspectionCompletedAt;
    private LocalDateTime handoverScheduledAt;
    private LocalDateTime handoverCompletedAt;
    private LocalDateTime claimClosedAt;
    
    // Next steps
    private String nextStep;
    private String nextStepDescription;
    private List<String> requiredActions;
    
    // Progress tracking
    private Integer workOrdersCompleted;
    private Integer totalWorkOrders;
    private Integer partsReplaced;
    private Integer laborHoursCompleted;
    
    // Quality checks
    private Boolean qualityCheckPassed;
    private String qualityCheckNotes;
    
    // Customer information
    private Boolean customerNotified;
    private LocalDateTime customerNotificationSent;
}