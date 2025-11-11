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
@Table(name = "approval_tasks")
public class ApprovalTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false)
    private Claim claim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_item_id")
    private ClaimItem claimItem; // optional link to a specific item

    @Column(name = "type", length = 20, nullable = false)
    private String type; // EVM or CUSTOMER

    @Column(name = "status", length = 30, nullable = false)
    private String status; // PENDING/APPROVED/REJECTED/NEED_MORE_INFO

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by")
    private User requestedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver")
    private User approver; // nullable for CUSTOMER type

    @Column(name = "quoted_amount", precision = 12, scale = 2)
    private java.math.BigDecimal quotedAmount; // for CUSTOMER type

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "attachments_json", columnDefinition = "TEXT")
    private String attachmentsJson;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "decision_at")
    private LocalDateTime decisionAt;

    @PrePersist
    protected void onCreate() {
        if (requestedAt == null) requestedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }
}


