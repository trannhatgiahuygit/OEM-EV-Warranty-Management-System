package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "diagnostic_reports")
public class DiagnosticReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false)
    private Claim claim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false)
    private String reportNumber;

    @Column(columnDefinition = "TEXT")
    private String symptomDescription;

    @Column(columnDefinition = "TEXT")
    private String visualInspection;

    @Column(columnDefinition = "TEXT")
    private String diagnosticResults;

    @Column(columnDefinition = "TEXT")
    private String troubleCodes;

    @Column(columnDefinition = "TEXT")
    private String rootCauseAnalysis;

    @Column(columnDefinition = "TEXT")
    private String recommendedActions;

    @Column
    private String diagnosisStatus; // IN_PROGRESS, COMPLETED, VERIFIED

    @Column
    private Integer currentMileage;

    @Column
    private String batteryStatus;

    @Column
    private String motorStatus;

    @Column
    private String controllerStatus;

    @Column
    private String chargingSystemStatus;

    @Column(columnDefinition = "TEXT")
    private String additionalNotes;

    @Column
    private LocalDateTime diagnosisDate;

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;
}
