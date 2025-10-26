package com.ev.warranty.model.dto.recall;

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
public class RecallCampaignResponseDTO {

    private Integer id;
    private String code;
    private String title;
    private String description;
    private String status;
    private LocalDateTime releasedAt;
    private LocalDateTime createdAt;
    private String createdBy;

    // Campaign statistics
    private Integer totalAffectedVehicles;
    private Integer notifiedVehicles;
    private Integer processedVehicles;
    private Integer pendingVehicles;

    // Vehicle criteria
    private List<String> affectedModels;
    private List<Integer> affectedYears;
    private String vinRangeStart;
    private String vinRangeEnd;
    private LocalDateTime manufactureDateStart;
    private LocalDateTime manufactureDateEnd;

    // Action details
    private String actionRequired;
    private String priority;
    private Integer estimatedDurationDays;

    // Progress tracking
    private Double completionPercentage;
    private String estimatedCompletionDate;
}
