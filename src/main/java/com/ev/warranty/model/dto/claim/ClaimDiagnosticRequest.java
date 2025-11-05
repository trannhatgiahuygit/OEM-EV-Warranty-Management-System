package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ClaimDiagnosticRequest {
    @NotNull(message = "Claim ID is required")
    private Integer claimId;

    private String diagnosticSummary;

    private String diagnosticData; // JSON string for error codes, BMS readings, etc.

    private String testResults; // Voltages, temperatures, cell imbalance data

    private String repairNotes;

    private String diagnosticDetails; // Additional details beyond summary/data

    private BigDecimal laborHours; // Changed from Double to BigDecimal for precision

    // 🆕 Warranty cost estimate
    private BigDecimal warrantyCost;

    // Parts used during diagnostic/repair
    private List<ClaimPartUsageDto> partsUsed;

    // Attachment file paths (uploaded separately)
    private List<String> attachmentPaths;

    private String initialDiagnosis;

    // Mark as ready for EVM submission
    private Boolean readyForSubmission = false;

    @Data
    public static class ClaimPartUsageDto {
        private Integer partId;
        private Integer partSerialId; // Optional, for tracked parts
        private Integer quantity;
        private String notes;
    }
}
