package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "campaigns")
public class Campaign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String campaignNumber;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String type; // RECALL, SERVICE_CAMPAIGN, TECHNICAL_SERVICE_BULLETIN

    @Column(nullable = false)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(nullable = false)
    private String status; // ACTIVE, INACTIVE, COMPLETED, CANCELLED

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column
    private LocalDateTime endDate;

    @Column
    private String affectedModels; // Comma-separated list of affected vehicle models

    @Column
    private String affectedYears; // Comma-separated list of affected years

    @Column
    private String affectedVinRange; // VIN range if applicable

    @Column(columnDefinition = "TEXT")
    private String remedyDescription;

    @Column
    private String requiredParts; // Comma-separated list of part numbers

    @Column
    private Double estimatedLaborHours;

    @Column
    private Double reimbursementAmount;

    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CampaignVehicle> affectedVehicles;

    @Column
    private Integer totalAffectedVehicles;

    @Column
    private Integer completedVehicles;

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
