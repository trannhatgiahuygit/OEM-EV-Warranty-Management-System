package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "claims")
public class Claim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "claim_number", length = 100, nullable = false, unique = true)
    private String claimNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // 🆕 ADD THIS FIELD
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "reported_failure", columnDefinition = "NVARCHAR(MAX)")
    private String reportedFailure;

    @Column(name = "initial_diagnosis", columnDefinition = "NVARCHAR(MAX)")
    private String initialDiagnosis;

    @Column(name = "diagnostic_details", columnDefinition = "NVARCHAR(MAX)")
    private String diagnosticDetails;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private ClaimStatus status;

    @Column(name = "company_paid_cost")
    private BigDecimal companyPaidCost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_technician_id")
    private User assignedTechnician;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Builder.Default
    @Column(name = "warranty_cost", precision = 12, scale = 2)
    private BigDecimal warrantyCost = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by")
    private User rejectedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    // 🆕 Problem & rejection tracking fields
    @Column(name = "resubmit_count")
    @Builder.Default
    private Integer resubmitCount = 0;

    @Column(name = "rejection_count")
    @Builder.Default
    private Integer rejectionCount = 0;

    @Column(name = "rejection_reason", length = 50)
    private String rejectionReason;

    @Column(name = "rejection_notes", columnDefinition = "NVARCHAR(MAX)")
    private String rejectionNotes;

    @Column(name = "problem_description", columnDefinition = "NVARCHAR(MAX)")
    private String problemDescription;

    @Column(name = "problem_type", length = 50)
    private String problemType;

    @Column(name = "can_resubmit")
    @Builder.Default
    private Boolean canResubmit = true;

    // ===== NEW: Warranty eligibility assessment fields =====
    @Column(name = "warranty_eligibility_assessment", columnDefinition = "NVARCHAR(MAX)")
    private String warrantyEligibilityAssessment;

    @Column(name = "is_warranty_eligible")
    private Boolean isWarrantyEligible; // true/false per technician decision

    @Column(name = "warranty_eligibility_notes", columnDefinition = "NVARCHAR(MAX)")
    private String warrantyEligibilityNotes;

    // ===== NEW: Repair type and service catalog fields =====
    @Column(name = "repair_type", length = 50)
    private String repairType; // EVM_REPAIR or SC_REPAIR

    @Column(name = "service_catalog_items", columnDefinition = "NVARCHAR(MAX)")
    private String serviceCatalogItems; // JSON string of service items from catalog

    @Column(name = "total_service_cost", precision = 12, scale = 2)
    private BigDecimal totalServiceCost; // Total cost from service catalog

    @Column(name = "total_third_party_parts_cost", precision = 12, scale = 2)
    private BigDecimal totalThirdPartyPartsCost; // Total cost for third-party parts replacement (SC Repair)

    @Column(name = "total_estimated_cost", precision = 12, scale = 2)
    private BigDecimal totalEstimatedCost; // Combined total: service cost + third-party parts cost (SC Repair)

    @Column(name = "customer_payment_status", length = 50)
    private String customerPaymentStatus; // PENDING, PAID for SC Repair flow

    // ===== NEW: Auto warranty eligibility fields =====
    @Column(name = "auto_warranty_eligible")
    private Boolean autoWarrantyEligible; // kết quả hệ thống tự check

    @Column(name = "auto_warranty_reasons", columnDefinition = "NVARCHAR(MAX)")
    private String autoWarrantyReasons; // JSON array hoặc text lý do

    @Column(name = "auto_warranty_checked_at")
    private java.time.LocalDateTime autoWarrantyCheckedAt;

    @Column(name = "manual_warranty_override")
    private Boolean manualWarrantyOverride; // technician đã ghi đè?

    @Column(name = "manual_override_confirmed")
    private Boolean manualOverrideConfirmed; // trạng thái checkbox xác nhận

    @Column(name = "manual_override_confirmed_at")
    private java.time.LocalDateTime manualOverrideConfirmedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manual_override_confirmed_by")
    private User manualOverrideConfirmedBy;

    // ===== NEW: Lưu coverage áp dụng từ auto-check (WarrantyCondition) =====
    @Column(name = "auto_warranty_applied_years")
    private Integer autoWarrantyAppliedYears;

    @Column(name = "auto_warranty_applied_km")
    private Integer autoWarrantyAppliedKm;
}