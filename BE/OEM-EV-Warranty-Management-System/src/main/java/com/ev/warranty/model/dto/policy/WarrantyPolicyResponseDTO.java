package com.ev.warranty.model.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyPolicyResponseDTO {

    private Integer id;
    private String code;
    private String name;
    private String description;
    private String applicableModel;
    private Integer applicableYearFrom;
    private Integer applicableYearTo;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private String status;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Related policy rules
    private List<PolicyRuleResponseDTO> rules;

    // Computed fields
    private Boolean isActive;
    private Boolean isApplicableToday;
    private Integer totalRules;
}
