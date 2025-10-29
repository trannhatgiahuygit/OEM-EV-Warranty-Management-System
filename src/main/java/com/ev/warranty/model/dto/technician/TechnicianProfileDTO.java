package com.ev.warranty.model.dto.technician;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianProfileDTO {

    // Profile info
    private Integer id;

    // User info
    private Integer userId;
    private String username;
    private String fullName;
    private String email;
    private String phone;

    // Assignment info
    private String assignmentStatus;
    private Integer currentWorkload;
    private Integer maxWorkload;
    private Integer remainingCapacity;
    private Double workloadPercentage;

    // Specialization info
    private String specialization;
    private String certificationLevel;

    // Performance stats
    private Integer totalCompletedWorkOrders;
    private Double averageCompletionHours;

    // Availability
    private LocalDateTime availableFrom;
    private Boolean canTakeMoreWork;
    private Boolean isAvailable;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
