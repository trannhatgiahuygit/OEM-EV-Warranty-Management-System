package com.ev.warranty.model.dto.policy;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicyRuleCreateRequestDTO {

    @NotBlank(message = "Rule name is required")
    @JsonProperty("rule_name")
    private String ruleName;

    @JsonProperty("description")
    private String description;

    @NotBlank(message = "Component category is required")
    @JsonProperty("component_category")
    private String componentCategory;

    @NotNull(message = "Coverage percentage is required")
    @JsonProperty("coverage_percentage")
    private Double coveragePercentage;

    @JsonProperty("max_claim_amount")
    private Double maxClaimAmount;

    @JsonProperty("conditions")
    private String conditions;

    @NotBlank(message = "Rule status is required")
    @JsonProperty("status")
    private String status;

    @JsonProperty("priority")
    private Integer priority;
}
