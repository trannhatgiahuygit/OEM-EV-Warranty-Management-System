package com.ev.warranty.model.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyValidationResponseDTO {

    // Main validation result
    private Boolean isCovered;
    private String reason; // Why covered or not covered
    private String coverageType; // "Full", "Partial", "Not Covered"

    // Vehicle information
    private String vin;
    private String model;
    private Integer year;
    private LocalDate warrantyStart;
    private LocalDate warrantyEnd;
    private Integer currentMileageKm;

    // Component information
    private String componentCategory;
    private LocalDate failureDate;

    // Applied warranty policy and rule
    private Integer appliedPolicyId;
    private String appliedPolicyName;
    private Integer appliedRuleId;
    private String appliedRuleDescription;

    // Coverage details
    private Integer maxWarrantyYears;
    private Integer maxWarrantyKm;
    private Integer yearsUsed;
    private Integer kmUsed;
    private Integer remainingYears;
    private Integer remainingKm;

    // Exclusions and conditions
    private List<String> exclusions;
    private List<String> failedConditions; // Conditions that failed validation
    private String additionalNotes;

    // Timestamps
    private String validatedAt;
    private String validatedBy;
}
