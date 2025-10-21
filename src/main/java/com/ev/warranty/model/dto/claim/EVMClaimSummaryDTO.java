package com.ev.warranty.model.dto.claim;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EVMClaimSummaryDTO {
    private Integer id;
    private String claimNumber;
    private String status;
    private String statusLabel;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private BigDecimal warrantyCost;
    private BigDecimal companyPaidCost; // Chi phí bảo hành hãng chi trả

    // Vehicle summary
    private VehicleSummaryDTO vehicle;

    // Customer summary
    private CustomerSummaryDTO customer;

    // Service center info
    private ServiceCenterSummaryDTO serviceCenter;

    // Business intelligence fields for EVM
    private String priority; // HIGH, MEDIUM, LOW
    private String riskLevel; // CRITICAL, HIGH, MEDIUM, LOW
    private Boolean requiresApproval;

    // Performance metrics (calculated from current date 2025-10-16)
    private Long daysInProgress;    // Days since creation to today
    private Long daysToApproval;    // Days from creation to approval (null if not approved)

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class VehicleSummaryDTO {
        private Integer id;
        private String vin;
        private String model;
        private Integer year;
        private String warrantyStatus; // ACTIVE, EXPIRED, EXPIRING_SOON
        private Integer warrantyMonthsRemaining;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CustomerSummaryDTO {
        private Integer id;
        private String name;
        private String phone;
        private String email;
        private Integer totalClaims; // Total claims by this customer
        private Boolean isRepeatCustomer;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ServiceCenterSummaryDTO {
        private String createdByUsername;
        private String createdByFullName;
        private String assignedTechnicianName;
        private String region; // NORTH, SOUTH, CENTRAL
    }
}