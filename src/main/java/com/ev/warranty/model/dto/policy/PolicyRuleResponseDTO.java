package com.ev.warranty.model.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicyRuleResponseDTO {

    private Integer id;
    private Integer policyId;
    private String componentCategory;
    private String coverageType;
    private Integer maxYears;
    private Integer maxKm;
    private String exclusions;
    private String conditionsJson;
    private Integer priority;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Computed fields
    private String coverageDescription; // E.g., "8 years or 160,000 km"
    private Boolean hasExclusions;
    private Boolean hasConditions;
}
