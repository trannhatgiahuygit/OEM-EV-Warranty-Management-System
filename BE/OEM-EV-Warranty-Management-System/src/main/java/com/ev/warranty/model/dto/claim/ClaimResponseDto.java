package com.ev.warranty.model.dto.claim;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ClaimResponseDto {
    private Integer id;
    private String claimNumber;
    private String status;
    private String statusLabel;

    // Customer info
    private CustomerInfoDto customer;

    // Vehicle info
    private VehicleInfoDto vehicle;

    // Claim details
    private String reportedFailure;
    private String initialDiagnosis;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private BigDecimal warrantyCost;
    private BigDecimal companyPaidCost; // Chi phí bảo hành hãng chi trả
    private BigDecimal laborHours; // Labor hours from work order

    // Assignment info
    private UserInfoDto createdBy;
    private UserInfoDto assignedTechnician;
    private UserInfoDto approvedBy;
    private UserInfoDto rejectedBy;
    private LocalDateTime rejectedAt;

    // Diagnostic info (populated by technician)
    private String diagnosticSummary;
    private String diagnosticData;
    private String diagnosticDetails; // newly added
    private String testResults;
    private String repairNotes; // newly added

    // ===== NEW: Warranty eligibility assessment =====
    private String warrantyEligibilityAssessment;
    private Boolean isWarrantyEligible;
    private String warrantyEligibilityNotes;

    // Attachments and history
    private List<ClaimAttachmentDto> attachments;
    private List<ClaimStatusHistoryDto> statusHistory;

    // Validation flags
    private Boolean canSubmitToEvm;
    private List<String> missingRequirements;

    // 🆕 Problem & rejection tracking (surface to client)
    private Integer resubmitCount;
    private Integer rejectionCount;
    private String rejectionReason;
    private String rejectionNotes;
    private String problemDescription;
    private String problemType;
    private Boolean canResubmit;

    // ===== NEW: Repair type and service catalog =====
    private String repairType; // EVM_REPAIR or SC_REPAIR
    private List<ServiceCatalogItemDto> serviceCatalogItems; // Don gia items
    private BigDecimal totalServiceCost; // Total service cost
    private BigDecimal totalThirdPartyPartsCost; // Total cost for third-party parts replacement (SC Repair)
    private BigDecimal totalEstimatedCost; // Combined total: service cost + third-party parts cost (SC Repair)
    private String customerPaymentStatus; // PENDING, PAID for SC Repair

    @Data
    public static class ServiceCatalogItemDto {
        private Integer serviceItemId;
        private String serviceItemCode;
        private String serviceItemName;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal totalPrice;
        private String notes;
    }
}
