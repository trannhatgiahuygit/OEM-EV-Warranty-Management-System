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
@Table(name = "recall_campaigns")
public class RecallCampaign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code", length = 100, nullable = false, unique = true)
    private String code;

    @Column(name = "title", columnDefinition = "NVARCHAR(500)")
    private String title;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "draft";

    @Column(name = "priority", length = 50)
    private String priority; // low, medium, high, critical

    @Column(name = "action_required", columnDefinition = "NVARCHAR(500)")
    private String actionRequired; // inspection, replacement, software_update, etc.

    @Column(name = "estimated_repair_hours", precision = 5, scale = 2)
    private BigDecimal estimatedRepairHours; // Estimated repair hours for scheduling technicians
}
