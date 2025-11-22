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

/**
 * Core Claim entity - chỉ chứa thông tin cơ bản và relationships chính.
 * Các thông tin chi tiết được tách ra thành các entity riêng:
 * - ClaimDiagnostic: Thông tin chẩn đoán
 * - ClaimApproval: Thông tin phê duyệt/từ chối
 * - ClaimCancellation: Thông tin hủy
 * - ClaimWarrantyEligibility: Đánh giá bảo hành
 * - ClaimCost: Thông tin chi phí
 * - ClaimRepairConfiguration: Cấu hình sửa chữa
 * - ClaimAssignment: Phân công kỹ thuật viên
 */
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private ClaimStatus status;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===== 1:1 Relationships với các entity tách riêng =====

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private ClaimDiagnostic diagnostic;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private ClaimApproval approval;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private ClaimCancellation cancellation;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private ClaimWarrantyEligibility warrantyEligibility;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private ClaimCost cost;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private ClaimRepairConfiguration repairConfiguration;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private ClaimAssignment assignment;

    // ===== Helper Methods để truy cập các entity con dễ dàng =====

    /**
     * Get or create ClaimDiagnostic
     */
    public ClaimDiagnostic getOrCreateDiagnostic() {
        if (this.diagnostic == null) {
            this.diagnostic = ClaimDiagnostic.builder()
                    .claim(this)
                    .build();
        }
        return this.diagnostic;
    }

    /**
     * Get or create ClaimApproval
     */
    public ClaimApproval getOrCreateApproval() {
        if (this.approval == null) {
            this.approval = ClaimApproval.builder()
                    .claim(this)
                    .build();
        }
        return this.approval;
    }

    /**
     * Get or create ClaimCancellation
     */
    public ClaimCancellation getOrCreateCancellation() {
        if (this.cancellation == null) {
            this.cancellation = ClaimCancellation.builder()
                    .claim(this)
                    .build();
        }
        return this.cancellation;
    }

    /**
     * Get or create ClaimWarrantyEligibility
     */
    public ClaimWarrantyEligibility getOrCreateWarrantyEligibility() {
        if (this.warrantyEligibility == null) {
            this.warrantyEligibility = ClaimWarrantyEligibility.builder()
                    .claim(this)
                    .build();
        }
        return this.warrantyEligibility;
    }

    /**
     * Get or create ClaimCost
     */
    public ClaimCost getOrCreateCost() {
        if (this.cost == null) {
            this.cost = ClaimCost.builder()
                    .claim(this)
                    .build();
        }
        return this.cost;
    }

    /**
     * Get or create ClaimRepairConfiguration
     */
    public ClaimRepairConfiguration getOrCreateRepairConfiguration() {
        if (this.repairConfiguration == null) {
            this.repairConfiguration = ClaimRepairConfiguration.builder()
                    .claim(this)
                    .build();
        }
        return this.repairConfiguration;
    }

    /**
     * Get or create ClaimAssignment
     */
    public ClaimAssignment getOrCreateAssignment() {
        if (this.assignment == null) {
            this.assignment = ClaimAssignment.builder()
                    .claim(this)
                    .build();
        }
        return this.assignment;
    }

    // ===== Convenience Methods để truy cập các thuộc tính nested =====

    /**
     * Get warranty cost from ClaimCost entity
     */
    public BigDecimal getWarrantyCost() {
        return this.cost != null ? this.cost.getWarrantyCost() : null;
    }

    /**
     * Get company paid cost from ClaimCost entity
     */
    public BigDecimal getCompanyPaidCost() {
        return this.cost != null ? this.cost.getCompanyPaidCost() : null;
    }

    /**
     * Get reported failure from ClaimDiagnostic entity
     */
    public String getReportedFailure() {
        return this.diagnostic != null ? this.diagnostic.getReportedFailure() : null;
    }

    /**
     * Get initial diagnosis from ClaimDiagnostic entity
     */
    public String getInitialDiagnosis() {
        return this.diagnostic != null ? this.diagnostic.getInitialDiagnosis() : null;
    }

    /**
     * Get approved at timestamp from ClaimApproval entity
     */
    public LocalDateTime getApprovedAt() {
        return this.approval != null ? this.approval.getApprovedAt() : null;
    }
}