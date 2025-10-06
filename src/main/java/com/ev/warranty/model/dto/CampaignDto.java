package com.ev.warranty.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignDto {
    private Integer id;
    private String campaignNumber;
    private String title;
    private String description;
    private String type;
    private String severity;
    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endDate;

    private String affectedModels;
    private String affectedYears;
    private String affectedVinRange;
    private String remedyDescription;
    private String requiredParts;
    private Double estimatedLaborHours;
    private Double reimbursementAmount;
    private List<CampaignVehicleDto> affectedVehicles;
    private Integer totalAffectedVehicles;
    private Integer completedVehicles;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // For campaign progress summary
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProgressSummary {
        private Integer totalVehicles;
        private Integer identifiedVehicles;
        private Integer notifiedVehicles;
        private Integer scheduledVehicles;
        private Integer completedVehicles;
        private Double completionPercentage;
    }
}
