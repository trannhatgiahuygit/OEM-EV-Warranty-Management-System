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
@Table(name = "policy_rules")
public class PolicyRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private WarrantyPolicy policy;

    @Column(name = "component_category", length = 100)
    private String componentCategory; // Battery/Motor/BMS/...

    @Column(name = "coverage_type", length = 30)
    private String coverageType; // time_km/time_only/km_only

    @Column(name = "max_years")
    private Integer maxYears;

    @Column(name = "max_km")
    private Integer maxKm;

    @Column(name = "exclusions", columnDefinition = "TEXT")
    private String exclusions;

    @Column(name = "conditions_json", columnDefinition = "TEXT")
    private String conditionsJson; // JSON expression for conditions

    @Column(name = "priority")
    @Builder.Default
    private Integer priority = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
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


