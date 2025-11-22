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

    // Reported failure description (can be updated during diagnostic)
    private String reportedFailure;

    // Mark as ready for EVM submission
    private Boolean readyForSubmission = false;

    // ===== NEW: Warranty eligibility assessment fields =====
    private String warrantyEligibilityAssessment; // Technician assessment text
    private Boolean isWarrantyEligible; // true/false
    private String warrantyEligibilityNotes; // extra notes

    // ===== NEW: Repair type and service catalog =====
    private String repairType; // EVM_REPAIR or SC_REPAIR
    private List<ServiceCatalogItemDto> serviceCatalogItems; // Don gia - service items from catalog
    private BigDecimal totalServiceCost; // Calculated total from service catalog
    
    // ===== NEW: Third party parts cost totals (for SC Repair) =====
    private BigDecimal totalThirdPartyPartsCost; // Total cost for third-party parts replacement
    private BigDecimal totalEstimatedCost; // Combined total: service cost + third-party parts cost

    // ===== NEW: Manual override flags for warranty eligibility =====
    private Boolean manualWarrantyOverride; // technician chooses to override auto-check
    private Boolean manualOverrideConfirmed; // must be true if override is true

    @Data
    public static class ClaimPartUsageDto {
        private Integer partId;
        private Integer partSerialId; // Optional, for tracked parts
        private Integer quantity;
        private String notes;
        
        // ===== NEW: Third party parts support for SC Repair =====
        private Integer thirdPartyPartId; // For SC Repair flow
        private BigDecimal unitPrice; // Price for third party parts
        private BigDecimal totalPrice; // Calculated: unitPrice * quantity
        
        // ===== NEW: Reserved serials and status for third-party parts =====
        private List<String> reservedSerials; // List of reserved serial numbers
        private String serialStatus; // ALL_RESERVED, PARTIAL, NONE_AVAILABLE
    }

    @Data
    public static class ServiceCatalogItemDto {
        private Integer serviceItemId; // ID from service catalog
        private String serviceItemCode;
        private String serviceItemName;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal totalPrice;
        private String notes;
    }
}
