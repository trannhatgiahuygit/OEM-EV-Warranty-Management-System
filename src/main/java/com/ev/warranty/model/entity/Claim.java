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
@Table(name = "claims")
public class Claim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String claimNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sc_staff_id")
    private User scStaff; // SC Staff who created the claim

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_technician_id")
    private User assignedTechnician; // Technician assigned to handle the claim

    @Column(nullable = false)
    private String issueDescription;

    @Column
    private String symptomDescription;

    @Column
    private String diagnosisResult;

    @Column(nullable = false)
    private String status; // SUBMITTED, PENDING, APPROVED, REJECTED, IN_PROGRESS, COMPLETED, CLOSED

    @Column(nullable = false)
    private String priority; // LOW, MEDIUM, HIGH, URGENT

    @Column
    private String failedPartNumber;

    @Column
    private String replacementPartNumber;

    @Column
    private Double estimatedCost;

    @Column
    private Double actualCost;

    @Column
    private LocalDateTime claimDate;

    @Column
    private LocalDateTime approvalDate;

    @Column
    private LocalDateTime completionDate;

    @Column
    private LocalDateTime closedDate;

    @Column
    private Integer mileage;

    @Column
    private String laborHours;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column
    private String oemResponse;

    @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ClaimDocument> documents;

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (claimDate == null) {
            claimDate = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
