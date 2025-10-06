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
public class ClaimDto {
    private Integer id;
    private String claimNumber;
    private Integer vehicleId;
    private String vehicleVin;
    private String vehicleModel;
    private Integer customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private Integer scStaffId;
    private String scStaffName;
    private Integer assignedTechnicianId;
    private String assignedTechnicianName;
    private String issueDescription;
    private String symptomDescription;
    private String diagnosisResult;
    private String status;
    private String priority;
    private String failedPartNumber;
    private String replacementPartNumber;
    private Double estimatedCost;
    private Double actualCost;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime claimDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime approvalDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completionDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime closedDate;

    private Integer mileage;
    private String laborHours;
    private String notes;
    private String oemResponse;
    private List<ClaimDocumentDto> documents;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // For creating warranty claim request
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Integer vehicleId;
        private Integer customerId;
        private String issueDescription;
        private String symptomDescription;
        private String priority;
        private String failedPartNumber;
        private Integer mileage;
        private String notes;
    }

    // For updating claim status and progress
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String diagnosisResult;
        private String status;
        private String priority;
        private String replacementPartNumber;
        private Double estimatedCost;
        private Double actualCost;
        private String laborHours;
        private String notes;
        private String oemResponse;
        private Integer assignedTechnicianId;
    }

    // For technician assignment
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignTechnicianRequest {
        private Integer technicianId;
        private String notes;
    }
}
