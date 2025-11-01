package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.policy.*;
import com.ev.warranty.model.entity.PolicyRule;
import com.ev.warranty.model.entity.WarrantyPolicy;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class WarrantyPolicyMapper {

    public WarrantyPolicyResponseDTO toResponseDTO(WarrantyPolicy policy) {
        return WarrantyPolicyResponseDTO.builder()
                .id(policy.getId())
                .code(policy.getCode())
                .name(policy.getName())
                .description(policy.getDescription())
                .applicableModel(policy.getApplicableModel())
                .applicableYearFrom(policy.getApplicableYearFrom())
                .applicableYearTo(policy.getApplicableYearTo())
                .effectiveFrom(policy.getEffectiveFrom())
                .effectiveTo(policy.getEffectiveTo())
                .status(policy.getStatus())
                .createdBy(policy.getCreatedBy() != null ? policy.getCreatedBy().getUsername() : null)
                .createdAt(policy.getCreatedAt())
                .updatedAt(policy.getUpdatedAt())
                .isActive("active".equals(policy.getStatus()))
                .isApplicableToday(isApplicableToday(policy))
                .build();
    }

    public PolicyRuleResponseDTO toRuleResponseDTO(PolicyRule rule) {
        return PolicyRuleResponseDTO.builder()
                .id(rule.getId())
                .policyId(rule.getPolicy().getId())
                .componentCategory(rule.getComponentCategory())
                .coverageType(rule.getCoverageType())
                .maxYears(rule.getMaxYears())
                .maxKm(rule.getMaxKm())
                .exclusions(rule.getExclusions())
                .conditionsJson(rule.getConditionsJson())
                .priority(rule.getPriority())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .coverageDescription(buildCoverageDescription(rule))
                .hasExclusions(rule.getExclusions() != null && !rule.getExclusions().trim().isEmpty())
                .hasConditions(rule.getConditionsJson() != null && !rule.getConditionsJson().trim().isEmpty())
                .build();
    }

    public List<WarrantyPolicyResponseDTO> toResponseDTOList(List<WarrantyPolicy> policies) {
        return policies.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<PolicyRuleResponseDTO> toRuleResponseDTOList(List<PolicyRule> rules) {
        return rules.stream()
                .map(this::toRuleResponseDTO)
                .collect(Collectors.toList());
    }

    private boolean isApplicableToday(WarrantyPolicy policy) {
        LocalDate today = LocalDate.now();
        return !policy.getEffectiveFrom().isAfter(today) &&
               (policy.getEffectiveTo() == null || !policy.getEffectiveTo().isBefore(today));
    }

    private String buildCoverageDescription(PolicyRule rule) {
        StringBuilder desc = new StringBuilder();
        if (rule.getComponentCategory() != null) {
            desc.append(rule.getComponentCategory()).append(": ");
        }

        if ("time_km".equals(rule.getCoverageType())) {
            desc.append(rule.getMaxYears()).append(" years or ")
                .append(rule.getMaxKm()).append(" km, whichever comes first");
        } else if ("time_only".equals(rule.getCoverageType())) {
            desc.append(rule.getMaxYears()).append(" years");
        } else if ("km_only".equals(rule.getCoverageType())) {
            desc.append(rule.getMaxKm()).append(" km");
        }

        return desc.toString();
    }
}
