package com.ev.warranty.controller;

import com.ev.warranty.model.dto.policy.*;
import com.ev.warranty.service.inter.WarrantyPolicyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warranty-policies")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Warranty Policy Engine", description = "APIs for managing warranty policies and rules (EVM Staff)")
public class WarrantyPolicyController {

    private final WarrantyPolicyService warrantyPolicyService;

    // ==================== POLICY MANAGEMENT ====================

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Create warranty policy",
               description = "Create a new warranty policy with rules (EVM Staff only)")
    public ResponseEntity<WarrantyPolicyResponseDTO> createPolicy(
            @Valid @RequestBody WarrantyPolicyCreateRequestDTO request,
            Authentication authentication) {

        String createdBy = authentication.getName();
        log.info("Creating warranty policy: {} by user: {}", request.getCode(), createdBy);

        WarrantyPolicyResponseDTO response = warrantyPolicyService.createPolicy(request, createdBy);

        log.info("Warranty policy created successfully: {}", response.getCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get all warranty policies",
               description = "Get paginated list of warranty policies with filtering")
    public ResponseEntity<Page<WarrantyPolicyResponseDTO>> getAllPolicies(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @Parameter(description = "Filter by model") @RequestParam(required = false) String model) {

        log.info("Getting warranty policies - page: {}, size: {}, status: {}, model: {}", page, size, status, model);

        Page<WarrantyPolicyResponseDTO> policies = warrantyPolicyService.getAllPolicies(page, size, status, model);

        log.info("Retrieved {} policies", policies.getTotalElements());
        return ResponseEntity.ok(policies);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get policy by ID", description = "Get detailed warranty policy information")
    public ResponseEntity<WarrantyPolicyResponseDTO> getPolicyById(@PathVariable Integer id) {
        log.debug("Getting warranty policy with ID: {}", id);

        WarrantyPolicyResponseDTO policy = warrantyPolicyService.getPolicyById(id);
        return ResponseEntity.ok(policy);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Update warranty policy", description = "Update existing warranty policy")
    public ResponseEntity<WarrantyPolicyResponseDTO> updatePolicy(
            @PathVariable Integer id,
            @Valid @RequestBody WarrantyPolicyUpdateRequestDTO request,
            Authentication authentication) {

        String updatedBy = authentication.getName();
        log.info("Updating warranty policy ID: {} by user: {}", id, updatedBy);

        WarrantyPolicyResponseDTO response = warrantyPolicyService.updatePolicy(id, request, updatedBy);

        log.info("Warranty policy updated successfully: {}", response.getCode());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Update policy status", description = "Activate/Deactivate warranty policy")
    public ResponseEntity<WarrantyPolicyResponseDTO> updatePolicyStatus(
            @PathVariable Integer id,
            @RequestParam String status,
            Authentication authentication) {

        String updatedBy = authentication.getName();
        log.info("Updating policy status - ID: {}, status: {}, by: {}", id, status, updatedBy);

        WarrantyPolicyResponseDTO response = warrantyPolicyService.updatePolicyStatus(id, status, updatedBy);

        return ResponseEntity.ok(response);
    }

    // ==================== POLICY RULES MANAGEMENT ====================

    @PostMapping("/{policyId}/rules")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Add policy rule", description = "Add new rule to warranty policy")
    public ResponseEntity<PolicyRuleResponseDTO> addPolicyRule(
            @PathVariable Integer policyId,
            @Valid @RequestBody PolicyRuleCreateRequestDTO request) {

        log.info("Adding rule to policy ID: {}", policyId);

        PolicyRuleResponseDTO response = warrantyPolicyService.addPolicyRule(policyId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{policyId}/rules")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get policy rules", description = "Get all rules for a warranty policy")
    public ResponseEntity<List<PolicyRuleResponseDTO>> getPolicyRules(@PathVariable Integer policyId) {
        log.debug("Getting rules for policy ID: {}", policyId);

        List<PolicyRuleResponseDTO> rules = warrantyPolicyService.getPolicyRules(policyId);
        return ResponseEntity.ok(rules);
    }

    @PutMapping("/rules/{ruleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Update policy rule", description = "Update existing policy rule")
    public ResponseEntity<PolicyRuleResponseDTO> updatePolicyRule(
            @PathVariable Integer ruleId,
            @Valid @RequestBody PolicyRuleUpdateRequestDTO request) {

        log.info("Updating policy rule ID: {}", ruleId);

        PolicyRuleResponseDTO response = warrantyPolicyService.updatePolicyRule(ruleId, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/rules/{ruleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Delete policy rule", description = "Remove rule from warranty policy")
    public ResponseEntity<Void> deletePolicyRule(@PathVariable Integer ruleId) {
        log.info("Deleting policy rule ID: {}", ruleId);

        warrantyPolicyService.deletePolicyRule(ruleId);

        return ResponseEntity.noContent().build();
    }

    // ==================== WARRANTY VALIDATION ====================

    @PostMapping("/validate")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Validate warranty coverage",
               description = "Check if a claim/part is covered under warranty policy")
    public ResponseEntity<WarrantyValidationResponseDTO> validateWarrantyCoverage(
            @Valid @RequestBody WarrantyValidationRequestDTO request) {

        log.info("Validating warranty coverage for VIN: {}, Component: {}",
                request.getVin(), request.getComponentCategory());

        WarrantyValidationResponseDTO response = warrantyPolicyService.validateWarrantyCoverage(request);

        log.info("Warranty validation result - VIN: {}, Covered: {}, Reason: {}",
                request.getVin(), response.getIsCovered(), response.getReason());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get active policies", description = "Get all currently active warranty policies")
    public ResponseEntity<List<WarrantyPolicyResponseDTO>> getActivePolicies() {
        log.debug("Getting active warranty policies");

        List<WarrantyPolicyResponseDTO> policies = warrantyPolicyService.getActivePolicies();

        log.debug("Found {} active policies", policies.size());
        return ResponseEntity.ok(policies);
    }

    @GetMapping("/model/{model}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get policies by model", description = "Get warranty policies applicable to specific vehicle model")
    public ResponseEntity<List<WarrantyPolicyResponseDTO>> getPoliciesByModel(@PathVariable String model) {
        log.debug("Getting warranty policies for model: {}", model);

        List<WarrantyPolicyResponseDTO> policies = warrantyPolicyService.getPoliciesByModel(model);

        log.debug("Found {} policies for model: {}", policies.size(), model);
        return ResponseEntity.ok(policies);
    }
}
