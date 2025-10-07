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
@Table(name = "technician_tasks")
public class TechnicianTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false)
    private Claim claim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy; // SC Staff who assigned the task

    @Column(nullable = false)
    private String taskType; // DIAGNOSIS, REPAIR, REPLACEMENT, INSPECTION, TESTING

    @Column(nullable = false)
    private String status; // ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(nullable = false)
    private String priority; // LOW, MEDIUM, HIGH, URGENT

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String workNotes;

    @Column(columnDefinition = "TEXT")
    private String completionNotes;

    @Column
    private LocalDateTime assignedDate;

    @Column
    private LocalDateTime startedDate;

    @Column
    private LocalDateTime completedDate;

    @Column
    private LocalDateTime estimatedCompletionDate;

    @Column
    private Double estimatedHours;

    @Column
    private Double actualHours;

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;
}
