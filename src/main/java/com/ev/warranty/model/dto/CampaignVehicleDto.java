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
public class CampaignVehicleDto {
    private Integer id;
    private Integer campaignId;
    private String campaignNumber;
    private String campaignTitle;
    private Integer vehicleId;
    private String vehicleVin;
    private String vehicleModel;
    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime notificationSentDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime scheduledDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedDate;

    private Integer assignedTechnicianId;
    private String assignedTechnicianName;
    private Integer scStaffId;
    private String scStaffName;
    private String workPerformed;
    private String notes;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // For scheduling campaign work
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScheduleRequest {
        private LocalDateTime scheduledDate;
        private Integer assignedTechnicianId;
        private String notes;
    }

    // For updating campaign progress
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String status;
        private String workPerformed;
        private String notes;
        private LocalDateTime completedDate;
    }

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
