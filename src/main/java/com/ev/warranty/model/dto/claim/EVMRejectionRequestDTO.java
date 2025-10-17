package com.ev.warranty.model.dto.claim;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EVMRejectionRequestDTO {

    @NotNull(message = "Rejection reason is required")
    private String rejectionReason; // OUT_OF_WARRANTY, NOT_COVERED, INSUFFICIENT_EVIDENCE, etc.

    @NotNull(message = "Rejection notes are required")
    private String rejectionNotes;

    private String suggestedAction; // SUGGEST_CUSTOMER_PAY, SUGGEST_INSURANCE, etc.

    @Builder.Default
    private Boolean requiresAdditionalInfo = false;

    private String additionalInfoRequired; // What additional information is needed

    private String internalNotes; // Internal notes for EVM staff only

    @Builder.Default
    private Boolean notifyCustomer = true; // Whether to notify customer about rejection
}