package com.ev.warranty.model.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicyRuleUpdateRequestDTO {

    private String componentCategory; // Battery, Motor, BMS, Electronics, etc.

    private String coverageType; // time_km, time_only, km_only

    private Integer maxYears; // Max warranty years

    private Integer maxKm; // Max warranty kilometers

    private String exclusions; // Text description of exclusions

    private String conditionsJson; // JSON expression for additional conditions

    private Integer priority; // Rule priority (higher = more specific)
}
