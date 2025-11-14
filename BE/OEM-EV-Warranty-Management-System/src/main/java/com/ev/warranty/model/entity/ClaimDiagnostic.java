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
@Table(name = "claim_diagnostics")
public class ClaimDiagnostic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false, unique = true)
    private Claim claim;

    @Column(name = "reported_failure", columnDefinition = "NVARCHAR(MAX)")
    private String reportedFailure;

    @Column(name = "initial_diagnosis", columnDefinition = "NVARCHAR(MAX)")
    private String initialDiagnosis;

    @Column(name = "diagnostic_details", columnDefinition = "NVARCHAR(MAX)")
    private String diagnosticDetails;

    @Column(name = "problem_description", columnDefinition = "NVARCHAR(MAX)")
    private String problemDescription;

    @Column(name = "problem_type", length = 50)
    private String problemType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

