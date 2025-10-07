package com.ev.warranty.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceHistoryDto {
    private Integer id;
    private Integer vehicleId;
    private String vehicleVin;
    private String vehicleModel;
    private Integer claimId;
    private String claimNumber;
    private Integer partId;
    private String partNumber;
    private String partName;
    private String serviceType;
    private String description;
    private Integer technicianId;
    private String technicianName;
    private Integer scStaffId;
    private String scStaffName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime serviceDate;

    private Integer mileage;
    private String laborHours;
    private Double cost;
    private String status;
    private String workPerformed;
    private String notes;
    private String oldPartSerialNumber;
    private String newPartSerialNumber;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // For creating service history record
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Integer vehicleId;
        private Integer claimId;
        private Integer partId;
        private String serviceType;
        private String description;
        private Integer technicianId;
        private LocalDateTime serviceDate;
        private Integer mileage;
        private String laborHours;
        private Double cost;
        private String workPerformed;
        private String notes;
        private String oldPartSerialNumber;
        private String newPartSerialNumber;
    }

    // For updating service status
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String status;
        private String workPerformed;
        private String notes;
        private Double cost;
        private String laborHours;
        private LocalDateTime serviceDate;
    }
}
