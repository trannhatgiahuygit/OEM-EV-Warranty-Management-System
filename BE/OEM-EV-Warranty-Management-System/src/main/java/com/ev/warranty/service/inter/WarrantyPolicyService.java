package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.policy.*;
import org.springframework.data.domain.Page;

import java.util.List;

public interface WarrantyPolicyService {

    // Policy Management
    WarrantyPolicyResponseDTO createPolicy(WarrantyPolicyCreateRequestDTO request, String createdBy);

    Page<WarrantyPolicyResponseDTO> getAllPolicies(int page, int size, String status, String model);

    WarrantyPolicyResponseDTO getPolicyById(Integer id);

    WarrantyPolicyResponseDTO updatePolicy(Integer id, WarrantyPolicyUpdateRequestDTO request, String updatedBy);

    WarrantyPolicyResponseDTO updatePolicyStatus(Integer id, String status, String updatedBy);

    // Policy Rules Management
    PolicyRuleResponseDTO addPolicyRule(Integer policyId, PolicyRuleCreateRequestDTO request);

    List<PolicyRuleResponseDTO> getPolicyRules(Integer policyId);

    PolicyRuleResponseDTO updatePolicyRule(Integer ruleId, PolicyRuleUpdateRequestDTO request);

    void deletePolicyRule(Integer ruleId);

    // Warranty Validation
    WarrantyValidationResponseDTO validateWarrantyCoverage(WarrantyValidationRequestDTO request);

    List<WarrantyPolicyResponseDTO> getActivePolicies();

    List<WarrantyPolicyResponseDTO> getPoliciesByModel(String model);
}
