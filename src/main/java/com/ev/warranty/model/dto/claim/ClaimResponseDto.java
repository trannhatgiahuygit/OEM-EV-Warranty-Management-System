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
}
