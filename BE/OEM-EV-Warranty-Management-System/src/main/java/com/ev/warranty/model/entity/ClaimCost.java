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
@Table(name = "claim_costs")
public class ClaimCost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false, unique = true)
    private Claim claim;

    @Column(name = "warranty_cost", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal warrantyCost = BigDecimal.ZERO;

    @Column(name = "company_paid_cost", precision = 12, scale = 2)
    private BigDecimal companyPaidCost;

    @Column(name = "total_service_cost", precision = 12, scale = 2)
    private BigDecimal totalServiceCost;

    @Column(name = "total_third_party_parts_cost", precision = 12, scale = 2)
    private BigDecimal totalThirdPartyPartsCost;

    @Column(name = "total_estimated_cost", precision = 12, scale = 2)
    private BigDecimal totalEstimatedCost;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

