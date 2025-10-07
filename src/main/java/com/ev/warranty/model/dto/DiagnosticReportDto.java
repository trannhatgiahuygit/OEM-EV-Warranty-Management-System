package com.ev.warranty.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiagnosticReportDto {
    private Integer id;
    private Integer claimId;
    private String claimNumber;
    private Integer technicianId;
    private String technicianName;
    private Integer vehicleId;
    private String vehicleVin;
    private String reportNumber;
    private String symptomDescription;
    private String visualInspection;
    private String diagnosticResults;
    private String troubleCodes;
    private String rootCauseAnalysis;
    private String recommendedActions;
    private String diagnosisStatus;
    private Integer currentMileage;
    private String batteryStatus;
    private String motorStatus;
    private String controllerStatus;
    private String chargingSystemStatus;
    private String additionalNotes;
    private LocalDateTime diagnosisDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
