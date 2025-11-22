package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "work_orders")
public class WorkOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false)
    private Claim claim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "result", columnDefinition = "NVARCHAR(MAX)")
    private String result;

    @Column(name = "test_results", columnDefinition = "NVARCHAR(MAX)")
    private String testResults;

    @Column(name = "repair_notes", columnDefinition = "NVARCHAR(MAX)")
    private String repairNotes;

    @Column(name = "labor_hours", precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal laborHours = BigDecimal.ZERO;

    // ===== NEW: Work Order type and status =====
    @Column(name = "work_order_type", length = 50)
    @Builder.Default
    private String workOrderType = "EVM"; // EVM or SC

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "OPEN"; // Valid statuses: OPEN, DONE

    @Column(name = "status_description", columnDefinition = "NVARCHAR(MAX)")
    private String statusDescription; // For problem descriptions during work
}
