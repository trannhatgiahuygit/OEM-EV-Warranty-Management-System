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

    // Các repository và dependency được inject thông qua constructor (lombok @RequiredArgsConstructor)
    // ... các biến dưới đây là các cổng vào để truy vấn/ghi dữ liệu liên quan đến chính sách bảo hành
    private final WarrantyPolicyRepository warrantyPolicyRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

    // ==================== POLICY MANAGEMENT ====================

    @Override
    @Transactional
    public WarrantyPolicyResponseDTO createPolicy(WarrantyPolicyCreateRequestDTO request, String createdBy) {
        // Hàm tạo mới một chính sách bảo hành
        // - request: DTO chứa dữ liệu do client gửi lên để tạo policy
        // - createdBy: username của user thực hiện thao tác (dùng để ghi createdBy)
        log.info("Creating warranty policy: {} by user: {}", request.getCode(), createdBy);

        // Validate: mã policy phải duy nhất
        // Nếu đã tồn tại mã policy thì trả về lỗi BadRequestException
        if (warrantyPolicyRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Policy code already exists: " + request.getCode());
        }

        // Lấy thông tin user tạo policy từ DB
        // Nếu không tìm thấy user, ném NotFoundException
        User creator = userRepository.findByUsername(createdBy)
                .orElseThrow(() -> new NotFoundException("User not found: " + createdBy));

        // Build thực thể WarrantyPolicy từ dữ liệu request
        // Gán các trường cơ bản như code, name, description, model áp dụng, effective dates, status
        WarrantyPolicy policy = WarrantyPolicy.builder()
                .code(request.getCode())
                .name(request.getPolicyName())
                .description(request.getDescription())
                .applicableModel(request.getVehicleModel())
                .applicableYearFrom(null) // Mặc định chưa set - có thể thay đổi trong update
                .applicableYearTo(null)   // Mặc định chưa set - có thể thay đổi trong update
                // effectiveFrom/To: convert từ LocalDateTime (DTO) nếu có, ngược lại dùng ngày hiện tại
                .effectiveFrom(request.getEffectiveFrom() != null ? request.getEffectiveFrom().toLocalDate() : LocalDate.now())
                .effectiveTo(request.getEffectiveTo() != null ? request.getEffectiveTo().toLocalDate() : null)
                .status(request.getStatus())
                .createdBy(creator) // tham chiếu đến user tạo
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Lưu policy vào DB
        WarrantyPolicy savedPolicy = warrantyPolicyRepository.save(policy);

        // Ghi log thành công
        log.info("Warranty policy created successfully: {}", savedPolicy.getCode());
        // Chuyển entity sang DTO trả về cho client
        return mapToResponseDTO(savedPolicy);
    }

    @Override
    public Page<WarrantyPolicyResponseDTO> getAllPolicies(int page, int size, String status, String model) {
        // Trả về danh sách phân trang các policy
        // Tham số filter: status và model có thể được dùng để lọc kết quả
        Pageable pageable = PageRequest.of(page, size);
        Page<WarrantyPolicy> policies;

        // Các nhánh xử lý filter khác nhau tùy theo tham số có null hay không
        if (status != null && model != null) {
            // Lọc theo cả status và model
            policies = warrantyPolicyRepository.findByStatusAndApplicableModel(status, model, pageable);
        } else if (status != null) {
            // Chỉ lọc theo status
            policies = warrantyPolicyRepository.findByStatus(status, pageable);
        } else if (model != null) {
            // Chỉ lọc theo model
            policies = warrantyPolicyRepository.findByApplicableModel(model, pageable);
        } else {
            // Không có filter, lấy tất cả
            policies = warrantyPolicyRepository.findAll(pageable);
        }

        // Map từng entity sang DTO trả về
        return policies.map(this::mapToResponseDTO);
    }

    @Override
    public WarrantyPolicyResponseDTO getPolicyById(Integer id) {
        // Lấy policy theo id, nếu không tìm thấy thì ném NotFoundException
        WarrantyPolicy policy = warrantyPolicyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Warranty policy not found with ID: " + id));

        return mapToResponseDTO(policy);
    }

    @Override
    @Transactional
    public WarrantyPolicyResponseDTO updatePolicy(Integer id, WarrantyPolicyUpdateRequestDTO request, String updatedBy) {
        // Cập nhật các trường của policy với dữ liệu mới có trong request
        WarrantyPolicy policy = warrantyPolicyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Warranty policy not found with ID: " + id));

        // Cập nhật từng trường nếu client cung cấp (partial update)
        if (request.getName() != null) policy.setName(request.getName());
        if (request.getDescription() != null) policy.setDescription(request.getDescription());
        if (request.getApplicableModel() != null) policy.setApplicableModel(request.getApplicableModel());
        if (request.getApplicableYearFrom() != null) policy.setApplicableYearFrom(request.getApplicableYearFrom());
        if (request.getApplicableYearTo() != null) policy.setApplicableYearTo(request.getApplicableYearTo());
        if (request.getEffectiveFrom() != null) policy.setEffectiveFrom(request.getEffectiveFrom());
        if (request.getEffectiveTo() != null) policy.setEffectiveTo(request.getEffectiveTo());
        if (request.getStatus() != null) policy.setStatus(request.getStatus());

        // Ghi thời gian update
        policy.setUpdatedAt(LocalDateTime.now());

        // Lưu thay đổi và trả về DTO
        WarrantyPolicy savedPolicy = warrantyPolicyRepository.save(policy);
        return mapToResponseDTO(savedPolicy);
    }

    @Override
    @Transactional
    public WarrantyPolicyResponseDTO updatePolicyStatus(Integer id, String status, String updatedBy) {
        // Cập nhật riêng trường status của policy
        WarrantyPolicy policy = warrantyPolicyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Warranty policy not found with ID: " + id));

        policy.setStatus(status);
        policy.setUpdatedAt(LocalDateTime.now());

        WarrantyPolicy savedPolicy = warrantyPolicyRepository.save(policy);
        return mapToResponseDTO(savedPolicy);
    }

    @Override
    public List<WarrantyPolicyResponseDTO> getActivePolicies() {
        // Lấy danh sách policy đang active (theo ngày hôm nay)
        List<WarrantyPolicy> policies = warrantyPolicyRepository.findActivePolicies(LocalDate.now());
        return policies.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<WarrantyPolicyResponseDTO> getPoliciesByModel(String model) {
        // Lấy policy active theo model
        List<WarrantyPolicy> policies = warrantyPolicyRepository.findActivePoliciesByModel(model, LocalDate.now());
        return policies.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    // ==================== POLICY RULES MANAGEMENT ====================

    @Override
    @Transactional
    public PolicyRuleResponseDTO addPolicyRule(Integer policyId, PolicyRuleCreateRequestDTO request) {
        // Thêm rule vào policy cụ thể
        WarrantyPolicy policy = warrantyPolicyRepository.findById(policyId)
                .orElseThrow(() -> new NotFoundException("Warranty policy not found with ID: " + policyId));

        return createPolicyRule(policy, request);
    }

    @Override
    public List<PolicyRuleResponseDTO> getPolicyRules(Integer policyId) {
        // Trả về danh sách rule cho một policy
        List<PolicyRule> rules = policyRuleRepository.findByPolicyId(policyId);
        return rules.stream()
                .map(this::mapToRuleResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PolicyRuleResponseDTO updatePolicyRule(Integer ruleId, PolicyRuleUpdateRequestDTO request) {
        // Cập nhật rule
        PolicyRule rule = policyRuleRepository.findById(ruleId)
                .orElseThrow(() -> new NotFoundException("Policy rule not found with ID: " + ruleId));

        // Chỉ cập nhật các trường mà client cung cấp
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
        // Xóa rule theo id
        PolicyRule rule = policyRuleRepository.findById(ruleId)
                .orElseThrow(() -> new NotFoundException("Policy rule not found with ID: " + ruleId));

        policyRuleRepository.delete(rule);
    }

    // ==================== WARRANTY VALIDATION ====================

    @Override
    public WarrantyValidationResponseDTO validateWarrantyCoverage(WarrantyValidationRequestDTO request) {
        // Kiểm tra xem một hư hỏng (component) cho một VIN có được bảo hành hay không
        // Tham số request chứa VIN, componentCategory, currentMileage, failureDate...
        log.info("Validating warranty coverage for VIN: {}, Component: {}",
                request.getVin(), request.getComponentCategory());

        // Lấy thông tin xe từ DB theo VIN
        Vehicle vehicle = vehicleRepository.findByVin(request.getVin())
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + request.getVin()));

        // Lấy tất cả policy active áp dụng cho model và năm của xe (tính đến ngày hôm nay)
        List<WarrantyPolicy> applicablePolicies = warrantyPolicyRepository
                .findActivePoliciesByModelAndYear(vehicle.getModel(), vehicle.getYear(), LocalDate.now());

        // Nếu không có policy nào áp dụng -> trả về response Not Covered
        if (applicablePolicies.isEmpty()) {
            return buildNotCoveredResponse(request, vehicle, "No applicable warranty policy found");
        }

        // Duyệt các policy để tìm rule phù hợp nhất cho component
        // Lưu ý: logic ưu tiên/độ chính xác của rule do repository (query) quyết định
        for (WarrantyPolicy policy : applicablePolicies) {
            PolicyRule applicableRule = policyRuleRepository.findMostSpecificRule(policy.getId(), request.getComponentCategory());

            if (applicableRule != null) {
                // Nếu tìm thấy rule, tiến hành validate chi tiết
                return validateAgainstRule(request, vehicle, policy, applicableRule);
            }
        }

        // Nếu hết policy vẫn không có rule -> không được bảo hành
        return buildNotCoveredResponse(request, vehicle, "No applicable warranty rule found for component category");
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private List<PolicyRuleResponseDTO> getApplicableRules(String vin, String componentCategory) {
        // Helper: trả về danh sách các rule áp dụng cho một VIN và component
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
        // Tạo mới một PolicyRule gắn với một policy cụ thể
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
        // Hàm chính để kiểm tra chi tiết một rule có phủ hống hư hỏng hay không

        // Ngày bắt đầu bảo hành và ngày xảy ra hư hỏng
        LocalDate warrantyStart = vehicle.getWarrantyStart();
        LocalDate currentDate = request.getFailureDate();

        // Tính thời gian (số năm) và km đã sử dụng kể từ khi bắt đầu bảo hành
        Period timePeriod = Period.between(warrantyStart, currentDate);
        int yearsUsed = timePeriod.getYears();
        int kmUsed = request.getCurrentMileageKm();

        // Các biến kết quả
        boolean isCovered;
        String reason;

        // Xử lý theo kiểu coverageType (time_km, time_only, km_only)
        switch (rule.getCoverageType()) {
            case "time_km" -> {
                // Cả thời gian và km phải thỏa điều kiện
                isCovered = yearsUsed <= rule.getMaxYears() && kmUsed <= rule.getMaxKm();
                reason = isCovered ?
                    String.format("Within warranty: %d years/%d km", rule.getMaxYears(), rule.getMaxKm()) :
                    String.format("Exceeded warranty: %d years used (max %d), %d km used (max %d)",
                                 yearsUsed, rule.getMaxYears(), kmUsed, rule.getMaxKm());
            }
            case "time_only" -> {
                // Chỉ kiểm tra theo thời gian
                isCovered = yearsUsed <= rule.getMaxYears();
                reason = isCovered ?
                    String.format("Within warranty: %d years", rule.getMaxYears()) :
                    String.format("Exceeded warranty: %d years used (max %d)", yearsUsed, rule.getMaxYears());
            }
            case "km_only" -> {
                // Chỉ kiểm tra theo số km
                isCovered = kmUsed <= rule.getMaxKm();
                reason = isCovered ?
                    String.format("Within warranty: %d km", rule.getMaxKm()) :
                    String.format("Exceeded warranty: %d km used (max %d)", kmUsed, rule.getMaxKm());
            }
            default -> {
                // Nếu rule có coverage type không hợp lệ -> không được bảo hành
                isCovered = false;
                reason = "Unknown coverage type: " + rule.getCoverageType();
            }
        }

        // Build và trả về DTO chi tiết kết quả validate
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
        // Trả về DTO khi không có policy/rule nào phủ
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
        // Tạo mô tả ngắn gọn cho rule để hiển thị trong response
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
        // Chuyển entity WarrantyPolicy sang DTO trả về
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
        // Map PolicyRule entity sang DTO
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
        // Kiểm tra policy có đang hiệu lực vào ngày hôm nay hay không
        LocalDate today = LocalDate.now();
        return !policy.getEffectiveFrom().isAfter(today) &&
               (policy.getEffectiveTo() == null || !policy.getEffectiveTo().isBefore(today));
    }
}
