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
@Table(name = "service_histories")
public class ServiceHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id")
    private Claim claim; // If this service is related to a warranty claim

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id")
    private Part part; // Part that was serviced/replaced

    @Column(nullable = false)
    private String serviceType; // MAINTENANCE, REPAIR, REPLACEMENT, INSPECTION, RECALL

    @Column(nullable = false)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sc_staff_id", nullable = false)
    private User scStaff;

    @Column(nullable = false)
    private LocalDateTime serviceDate;

    @Column
    private Integer mileage;

    @Column
    private String laborHours;

    @Column
    private Double cost;

    @Column
    private String status; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(columnDefinition = "TEXT")
    private String workPerformed;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column
    private String oldPartSerialNumber;

    @Column
    private String newPartSerialNumber;

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
