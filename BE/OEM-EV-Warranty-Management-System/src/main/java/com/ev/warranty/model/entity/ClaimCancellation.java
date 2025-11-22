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
@Table(name = "claim_cancellations")
public class ClaimCancellation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false, unique = true)
    private Claim claim;

    @Column(name = "cancel_request_count", nullable = false)
    @Builder.Default
    private Integer cancelRequestCount = 0;

    @Column(name = "cancel_previous_status_code", length = 50)
    private String cancelPreviousStatusCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancel_requested_by")
    private User cancelRequestedBy;

    @Column(name = "cancel_requested_at")
    private LocalDateTime cancelRequestedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancel_handled_by")
    private User cancelHandledBy;

    @Column(name = "cancel_handled_at")
    private LocalDateTime cancelHandledAt;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

