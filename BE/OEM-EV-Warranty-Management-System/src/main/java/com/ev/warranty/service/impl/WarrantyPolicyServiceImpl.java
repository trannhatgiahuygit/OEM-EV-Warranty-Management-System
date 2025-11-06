package com.ev.warranty.service.impl;

import com.ev.warranty.exception.BadRequestException;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.model.dto.policy.*;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import com.ev.warranty.service.inter.WarrantyPolicyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarrantyPolicyServiceImpl implements WarrantyPolicyService {

    private final WarrantyPolicyRepository warrantyPolicyRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

    // ==================== POLICY MANAGEMENT ====================

    @Override
    @Transactional
    public WarrantyPolicyResponseDTO createPolicy(WarrantyPolicyCreateRequestDTO request, String createdBy) {
        log.info("Creating warranty policy: {} by user: {}", request.getCode(), createdBy);

        // Validate policy code uniqueness
        if (warrantyPolicyRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Policy code already exists: " + request.getCode());
        }

        // Get creator user
        User creator = userRepository.findByUsername(createdBy)
                .orElseThrow(() -> new NotFoundException("User not found: " + createdBy));

        // Create policy
        WarrantyPolicy policy = WarrantyPolicy.builder()
                .code(request.getCode())
                .name(request.getPolicyName())
                .description(request.getDescription())
                .applicableModel(request.getVehicleModel())
                .applicableYearFrom(null) // Set default or get from another source
                .applicableYearTo(null)   // Set default or get from another source
                .effectiveFrom(request.getEffectiveFrom() != null ? request.getEffectiveFrom().toLocalDate() : LocalDate.now())
                .effectiveTo(request.getEffectiveTo() != null ? request.getEffectiveTo().toLocalDate() : null)
                .status(request.getStatus())
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        WarrantyPolicy savedPolicy = warrantyPolicyRepository.save(policy);

        // Initial rules can be added separately through addPolicyRule method

        log.info("Warranty policy created successfully: {}", savedPolicy.getCode());
        return mapToResponseDTO(savedPolicy);
    }

    @Override
    public Page<WarrantyPolicyResponseDTO> getAllPolicies(int page, int size, String status, String model) {
        Pageable pageable = PageRequest.of(page, size);
        Page<WarrantyPolicy> policies;

        if (status != null && model != null) {
            policies = warrantyPolicyRepository.findByStatusAndApplicableModel(status, model, pageable);
        } else if (status != null) {
            policies = warrantyPolicyRepository.findByStatus(status, pageable);
        } else if (model != null) {
            policies = warrantyPolicyRepository.findByApplicableModel(model, pageable);
        } else {
            policies = warrantyPolicyRepository.findAll(pageable);
        }

        return policies.map(this::mapToResponseDTO);
    }

    @Override
    public WarrantyPolicyResponseDTO getPolicyById(Integer id) {
        WarrantyPolicy policy = warrantyPolicyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Warranty policy not found with ID: " + id));

        return mapToResponseDTO(policy);
    }

    @Override
    @Transactional
    public WarrantyPolicyResponseDTO updatePolicy(Integer id, WarrantyPolicyUpdateRequestDTO request, String updatedBy) {
        WarrantyPolicy policy = warrantyPolicyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Warranty policy not found with ID: " + id));

        // Update fields
        if (request.getName() != null) policy.setName(request.getName());
        if (request.getDescription() != null) policy.setDescription(request.getDescription());
        if (request.getApplicableModel() != null) policy.setApplicableModel(request.getApplicableModel());
        if (request.getApplicableYearFrom() != null) policy.setApplicableYearFrom(request.getApplicableYearFrom());
        if (request.getApplicableYearTo() != null) policy.setApplicableYearTo(request.getApplicableYearTo());
        if (request.getEffectiveFrom() != null) policy.setEffectiveFrom(request.getEffectiveFrom());
        if (request.getEffectiveTo() != null) policy.setEffectiveTo(request.getEffectiveTo());
        if (request.getStatus() != null) policy.setStatus(request.getStatus());

        policy.setUpdatedAt(LocalDateTime.now());

        WarrantyPolicy savedPolicy = warrantyPolicyRepository.save(policy);
        return mapToResponseDTO(savedPolicy);
    }

    @Override
    @Transactional
    public WarrantyPolicyResponseDTO updatePolicyStatus(Integer id, String status, String updatedBy) {
        WarrantyPolicy policy = warrantyPolicyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Warranty policy not found with ID: " + id));

        policy.setStatus(status);
        policy.setUpdatedAt(LocalDateTime.now());

        WarrantyPolicy savedPolicy = warrantyPolicyRepository.save(policy);
        return mapToResponseDTO(savedPolicy);
    }

    @Override
    public List<WarrantyPolicyResponseDTO> getActivePolicies() {
        List<WarrantyPolicy> policies = warrantyPolicyRepository.findActivePolicies(LocalDate.now());
        return policies.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<WarrantyPolicyResponseDTO> getPoliciesByModel(String model) {
        List<WarrantyPolicy> policies = warrantyPolicyRepository.findActivePoliciesByModel(model, LocalDate.now());
        return policies.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    // ==================== POLICY RULES MANAGEMENT ====================

    @Override
    @Transactional
    public PolicyRuleResponseDTO addPolicyRule(Integer policyId, PolicyRuleCreateRequestDTO request) {
        WarrantyPolicy policy = warrantyPolicyRepository.findById(policyId)
                .orElseThrow(() -> new NotFoundException("Warranty policy not found with ID: " + policyId));

        return createPolicyRule(policy, request);
    }

    @Override
    public List<PolicyRuleResponseDTO> getPolicyRules(Integer policyId) {
        List<PolicyRule> rules = policyRuleRepository.findByPolicyId(policyId);
        return rules.stream()
                .map(this::mapToRuleResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PolicyRuleResponseDTO updatePolicyRule(Integer ruleId, PolicyRuleUpdateRequestDTO request) {
        PolicyRule rule = policyRuleRepository.findById(ruleId)
                .orElseThrow(() -> new NotFoundException("Policy rule not found with ID: " + ruleId));

        // Update fields
        if (request.getComponentCategory() != null) rule.setComponentCategory(request.getComponentCategory());
        if (request.getCoverageType() != null) rule.setCoverageType(request.getCoverageType());
        if (request.getMaxYears() != null) rule.setMaxYears(request.getMaxYears());
        if (request.getMaxKm() != null) rule.setMaxKm(request.getMaxKm());
        if (request.getExclusions() != null) rule.setExclusions(request.getExclusions());
        if (request.getConditionsJson() != null) rule.setConditionsJson(request.getConditionsJson());
        if (request.getPriority() != null) rule.setPriority(request.getPriority());

        rule.setUpdatedAt(LocalDateTime.now());

        PolicyRule savedRule = policyRuleRepository.save(rule);
        return mapToRuleResponseDTO(savedRule);
    }

    @Override
    @Transactional
    public void deletePolicyRule(Integer ruleId) {
        PolicyRule rule = policyRuleRepository.findById(ruleId)
                .orElseThrow(() -> new NotFoundException("Policy rule not found with ID: " + ruleId));

        policyRuleRepository.delete(rule);
    }

    // ==================== WARRANTY VALIDATION ====================

    @Override
    public WarrantyValidationResponseDTO validateWarrantyCoverage(WarrantyValidationRequestDTO request) {
        log.info("Validating warranty coverage for VIN: {}, Component: {}",
                request.getVin(), request.getComponentCategory());

        // Get vehicle information
        Vehicle vehicle = vehicleRepository.findByVin(request.getVin())
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + request.getVin()));

        // Get applicable policies
        List<WarrantyPolicy> applicablePolicies = warrantyPolicyRepository
                .findActivePoliciesByModelAndYear(vehicle.getModel(), vehicle.getYear(), LocalDate.now());

        if (applicablePolicies.isEmpty()) {
            return buildNotCoveredResponse(request, vehicle, "No applicable warranty policy found");
        }

        // Find the most specific rule
        for (WarrantyPolicy policy : applicablePolicies) {
            PolicyRule applicableRule = policyRuleRepository.findMostSpecificRule(policy.getId(), request.getComponentCategory());

            if (applicableRule != null) {
                return validateAgainstRule(request, vehicle, policy, applicableRule);
            }
        }

        return buildNotCoveredResponse(request, vehicle, "No applicable warranty rule found for component category");
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private List<PolicyRuleResponseDTO> getApplicableRules(String vin, String componentCategory) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + vin));

        List<WarrantyPolicy> applicablePolicies = warrantyPolicyRepository
                .findActivePoliciesByModelAndYear(vehicle.getModel(), vehicle.getYear(), LocalDate.now());

        return applicablePolicies.stream()
                .flatMap(policy -> policyRuleRepository.findApplicableRules(policy.getId(), componentCategory).stream())
                .map(this::mapToRuleResponseDTO)
                .collect(Collectors.toList());
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private PolicyRuleResponseDTO createPolicyRule(WarrantyPolicy policy, PolicyRuleCreateRequestDTO request) {
        PolicyRule rule = PolicyRule.builder()
                .policy(policy)
                .componentCategory(request.getComponentCategory())
                .coverageType("percentage") // Default coverage type since DTO doesn't have this field
                .maxYears(null) // Will be set based on policy configuration
                .maxKm(null) // Will be set based on policy configuration
                .exclusions(request.getConditions())
                .conditionsJson(request.getConditions())
                .priority(request.getPriority())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        PolicyRule savedRule = policyRuleRepository.save(rule);
        return mapToRuleResponseDTO(savedRule);
    }

    private WarrantyValidationResponseDTO validateAgainstRule(WarrantyValidationRequestDTO request,
                                                             Vehicle vehicle,
                                                             WarrantyPolicy policy,
                                                             PolicyRule rule) {
        LocalDate warrantyStart = vehicle.getWarrantyStart();
        LocalDate currentDate = request.getFailureDate();

        // Calculate time and mileage used
        Period timePeriod = Period.between(warrantyStart, currentDate);
        int yearsUsed = timePeriod.getYears();
        int kmUsed = request.getCurrentMileageKm();

        // Check coverage based on rule type
        boolean isCovered;
        String reason;

        switch (rule.getCoverageType()) {
            case "time_km" -> {
                isCovered = yearsUsed <= rule.getMaxYears() && kmUsed <= rule.getMaxKm();
                reason = isCovered ?
                    String.format("Within warranty: %d years/%d km", rule.getMaxYears(), rule.getMaxKm()) :
                    String.format("Exceeded warranty: %d years used (max %d), %d km used (max %d)",
                                 yearsUsed, rule.getMaxYears(), kmUsed, rule.getMaxKm());
            }
            case "time_only" -> {
                isCovered = yearsUsed <= rule.getMaxYears();
                reason = isCovered ?
                    String.format("Within warranty: %d years", rule.getMaxYears()) :
                    String.format("Exceeded warranty: %d years used (max %d)", yearsUsed, rule.getMaxYears());
            }
            case "km_only" -> {
                isCovered = kmUsed <= rule.getMaxKm();
                reason = isCovered ?
                    String.format("Within warranty: %d km", rule.getMaxKm()) :
                    String.format("Exceeded warranty: %d km used (max %d)", kmUsed, rule.getMaxKm());
            }
            default -> {
                isCovered = false;
                reason = "Unknown coverage type: " + rule.getCoverageType();
            }
        }

        return WarrantyValidationResponseDTO.builder()
                .isCovered(isCovered)
                .reason(reason)
                .coverageType(isCovered ? "Full" : "Not Covered")
                .vin(vehicle.getVin())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .warrantyStart(vehicle.getWarrantyStart())
                .warrantyEnd(vehicle.getWarrantyEnd())
                .currentMileageKm(request.getCurrentMileageKm())
                .componentCategory(request.getComponentCategory())
                .failureDate(request.getFailureDate())
                .appliedPolicyId(policy.getId())
                .appliedPolicyName(policy.getName())
                .appliedRuleId(rule.getId())
                .appliedRuleDescription(buildRuleDescription(rule))
                .maxWarrantyYears(rule.getMaxYears())
                .maxWarrantyKm(rule.getMaxKm())
                .yearsUsed(yearsUsed)
                .kmUsed(kmUsed)
                .remainingYears(Math.max(0, rule.getMaxYears() - yearsUsed))
                .remainingKm(Math.max(0, rule.getMaxKm() - kmUsed))
                .validatedAt(LocalDateTime.now().toString())
                .build();
    }

    private WarrantyValidationResponseDTO buildNotCoveredResponse(WarrantyValidationRequestDTO request,
                                                                 Vehicle vehicle,
                                                                 String reason) {
        return WarrantyValidationResponseDTO.builder()
                .isCovered(false)
                .reason(reason)
                .coverageType("Not Covered")
                .vin(vehicle.getVin())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .warrantyStart(vehicle.getWarrantyStart())
                .warrantyEnd(vehicle.getWarrantyEnd())
                .currentMileageKm(request.getCurrentMileageKm())
                .componentCategory(request.getComponentCategory())
                .failureDate(request.getFailureDate())
                .validatedAt(LocalDateTime.now().toString())
                .build();
    }

    private String buildRuleDescription(PolicyRule rule) {
        StringBuilder desc = new StringBuilder();
        desc.append(rule.getComponentCategory()).append(": ");

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

    private WarrantyPolicyResponseDTO mapToResponseDTO(WarrantyPolicy policy) {
        List<PolicyRuleResponseDTO> rules = policyRuleRepository.findByPolicyId(policy.getId())
                .stream()
                .map(this::mapToRuleResponseDTO)
                .collect(Collectors.toList());

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
                .rules(rules)
                .isActive("active".equals(policy.getStatus()))
                .isApplicableToday(isApplicableToday(policy))
                .totalRules(rules.size())
                .build();
    }

    private PolicyRuleResponseDTO mapToRuleResponseDTO(PolicyRule rule) {
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
                .coverageDescription(buildRuleDescription(rule))
                .hasExclusions(rule.getExclusions() != null && !rule.getExclusions().trim().isEmpty())
                .hasConditions(rule.getConditionsJson() != null && !rule.getConditionsJson().trim().isEmpty())
                .build();
    }

    private boolean isApplicableToday(WarrantyPolicy policy) {
        LocalDate today = LocalDate.now();
        return !policy.getEffectiveFrom().isAfter(today) &&
               (policy.getEffectiveTo() == null || !policy.getEffectiveTo().isBefore(today));
    }
}
