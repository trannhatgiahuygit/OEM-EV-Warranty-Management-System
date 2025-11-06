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
@Table(name = "technician_profiles")
public class TechnicianProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "assignment_status", length = 20, nullable = false)
    private String assignmentStatus; // AVAILABLE, BUSY

    @Column(name = "current_workload", nullable = false)
    private Integer currentWorkload = 0;

    @Column(name = "max_workload", nullable = false)
    private Integer maxWorkload = 5;

    @Column(name = "specialization", length = 100)
    private String specialization; // Battery Systems, Motor & Drivetrain, Electronics & Software, etc.

    @Column(name = "certification_level", length = 50)
    private String certificationLevel; // Junior, Senior, Expert

    @Column(name = "total_completed_work_orders")
    private Integer totalCompletedWorkOrders = 0;

    @Column(name = "average_completion_hours")
    private Double averageCompletionHours = 0.0;

    @Column(name = "available_from")
    private LocalDateTime availableFrom;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (assignmentStatus == null) {
            assignmentStatus = "AVAILABLE";
        }
        if (currentWorkload == null) {
            currentWorkload = 0;
        }
        if (maxWorkload == null) {
            maxWorkload = 5;
        }
        if (totalCompletedWorkOrders == null) {
            totalCompletedWorkOrders = 0;
        }
        if (averageCompletionHours == null) {
            averageCompletionHours = 0.0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ==================== BUSINESS LOGIC METHODS ====================

    /**
     * Check if technician can take more work
     * @return true if current workload < max workload
     */
    public boolean canTakeMoreWork() {
        return currentWorkload < maxWorkload;
    }

    /**
     * Check if technician is available for assignment
     * @return true if status is AVAILABLE and has capacity
     */
    public boolean isAvailable() {
        return "AVAILABLE".equalsIgnoreCase(assignmentStatus) && canTakeMoreWork();
    }

    /**
     * Increment workload when new work is assigned
     * Automatically updates status to BUSY when reaching max capacity
     */
    public void incrementWorkload() {
        this.currentWorkload++;
        if (this.currentWorkload >= this.maxWorkload) {
            this.assignmentStatus = "BUSY";
            this.availableFrom = null; // Not available anymore
        }
    }

    /**
     * Decrement workload when work is completed or cancelled
     * Automatically updates status to AVAILABLE when below max capacity
     */
    public void decrementWorkload() {
        if (this.currentWorkload > 0) {
            this.currentWorkload--;
        }
        if (this.currentWorkload < this.maxWorkload) {
            this.assignmentStatus = "AVAILABLE";
            this.availableFrom = LocalDateTime.now();
        }
    }

    /**
     * Get remaining capacity (how many more work orders can be assigned)
     * @return remaining capacity
     */
    public Integer getRemainingCapacity() {
        return maxWorkload - currentWorkload;
    }

    /**
     * Get workload as percentage
     * @return workload percentage (0-100)
     */
    public Double getWorkloadPercentage() {
        if (maxWorkload == 0) return 0.0;
        return (currentWorkload.doubleValue() / maxWorkload.doubleValue()) * 100;
    }

    /**
     * Update completion statistics when work order is completed
     * @param laborHours hours spent on the completed work order
     */
    public void updateCompletionStats(BigDecimal laborHours) {
        // Convert BigDecimal to Double for calculation
        double hours = laborHours.doubleValue();

        int totalOrders = this.totalCompletedWorkOrders;
        double currentAvg = this.averageCompletionHours;

        // Calculate new average
        double newAvg = ((currentAvg * totalOrders) + hours) / (totalOrders + 1);

        this.averageCompletionHours = newAvg;
        this.totalCompletedWorkOrders = totalOrders + 1;
    }
}