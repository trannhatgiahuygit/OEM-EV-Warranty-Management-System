package com.ev.warranty.model.dto.claim;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EVMClaimFilterRequestDTO {

    // Status filtering (mapped to claim_statuses table)
    private List<String> statusCodes; // OPEN, IN_PROGRESS, PENDING_APPROVAL, APPROVED, COMPLETED, REJECTED, CANCELLED

    // Date range filtering
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate createdFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate createdTo;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate approvedFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate approvedTo;

    // Cost filtering
    private BigDecimal minWarrantyCost;
    private BigDecimal maxWarrantyCost;

    // Vehicle filtering
    private List<String> vehicleModels; // EV Model X Pro, EV Model Y Standard, EV Model Z Luxury
    private List<Integer> vehicleYears;
    private String warrantyStatus; // ACTIVE, EXPIRED, EXPIRING_SOON

    // Business intelligence filtering
    private List<String> priorities; // HIGH, MEDIUM, LOW
    private List<String> riskLevels; // CRITICAL, HIGH, MEDIUM, LOW
    private Boolean requiresApprovalOnly;

    // Service center filtering
    private List<String> regions; // NORTH, SOUTH, CENTRAL
    private List<Integer> createdByUserIds;
    private List<Integer> assignedTechnicianIds;

    // Performance filtering
    private Integer minDaysInProgress;
    private Integer maxDaysInProgress;

    // Pagination and sorting
    @Builder.Default
    private Integer page = 0;
    @Builder.Default
    private Integer size = 20;
    @Builder.Default
    private String sortBy = "createdAt"; // createdAt, warrantyCost, status, daysInProgress
    @Builder.Default
    private String sortDirection = "DESC"; // ASC, DESC

    // Search across claim number, VIN, customer name, reported failure
    private String searchKeyword;
}