package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "claim_warranty_eligibility")
public class ClaimWarrantyEligibility {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false, unique = true)
    private Claim claim;

    // Auto check results
    @Column(name = "auto_warranty_eligible")
    private Boolean autoWarrantyEligible;

    @Column(name = "auto_warranty_reasons", columnDefinition = "NVARCHAR(MAX)")
    private String autoWarrantyReasons;

    @Column(name = "auto_warranty_checked_at")
    private LocalDateTime autoWarrantyCheckedAt;

    @Column(name = "auto_warranty_applied_years")
    private Integer autoWarrantyAppliedYears;

    @Column(name = "auto_warranty_applied_km")
    private Integer autoWarrantyAppliedKm;

    // Manual assessment
    @Column(name = "warranty_eligibility_assessment", columnDefinition = "NVARCHAR(MAX)")
    private String warrantyEligibilityAssessment;

    @Column(name = "is_warranty_eligible")
    private Boolean isWarrantyEligible;

    @Column(name = "warranty_eligibility_notes", columnDefinition = "NVARCHAR(MAX)")
    private String warrantyEligibilityNotes;

    // Manual override
    @Column(name = "manual_warranty_override")
    private Boolean manualWarrantyOverride;

    @Column(name = "manual_override_confirmed")
    private Boolean manualOverrideConfirmed;

    @Column(name = "manual_override_confirmed_at")
    private LocalDateTime manualOverrideConfirmedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manual_override_confirmed_by")
    private User manualOverrideConfirmedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

