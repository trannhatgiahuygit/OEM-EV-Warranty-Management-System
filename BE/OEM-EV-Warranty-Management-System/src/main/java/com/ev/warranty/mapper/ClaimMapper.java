package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.ClaimAttachmentRepository;
import com.ev.warranty.repository.ClaimStatusHistoryRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class ClaimMapper {

    private final ClaimAttachmentRepository attachmentRepository;
    private final ClaimStatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final WorkOrderRepository workOrderRepository; // 195 ADD WorkOrderRepository

    public Claim toEntity(ClaimIntakeRequest dto) {
        Claim claim = Claim.builder().build();
        
        // Create diagnostic if there's data
        if (dto.getReportedFailure() != null || dto.getClaimTitle() != null) {
            ClaimDiagnostic diagnostic = ClaimDiagnostic.builder()
                    .claim(claim)
                    .reportedFailure(dto.getReportedFailure())
                    .initialDiagnosis(dto.getClaimTitle())
                    .build();
            claim.setDiagnostic(diagnostic);
        }
        
        // Initialize cost with zero
        ClaimCost cost = ClaimCost.builder()
                .claim(claim)
                .warrantyCost(BigDecimal.ZERO)
                .build();
        claim.setCost(cost);
        
        return claim;
    }

    /**
     * Complete mapping for ClaimResponseDto - replaces mapToResponseDto in service
     */
    public ClaimResponseDto toResponseDto(Claim entity) {
        ClaimResponseDto dto = new ClaimResponseDto();

        // Basic info
        dto.setId(entity.getId());
        dto.setClaimNumber(entity.getClaimNumber());
        dto.setCreatedAt(entity.getCreatedAt());
        
        // Diagnostic info from ClaimDiagnostic
        ClaimDiagnostic diagnostic = entity.getDiagnostic();
        dto.setReportedFailure(diagnostic != null && diagnostic.getReportedFailure() != null ? diagnostic.getReportedFailure() : "");
        dto.setInitialDiagnosis(diagnostic != null && diagnostic.getInitialDiagnosis() != null ? diagnostic.getInitialDiagnosis() : "");
        dto.setDiagnosticDetails(diagnostic != null && diagnostic.getDiagnosticDetails() != null ? diagnostic.getDiagnosticDetails() : "");
        dto.setProblemDescription(diagnostic != null && diagnostic.getProblemDescription() != null ? diagnostic.getProblemDescription() : "");
        dto.setProblemType(diagnostic != null ? diagnostic.getProblemType() : null);
        
        // Approval info from ClaimApproval
        ClaimApproval approval = entity.getApproval();
        dto.setApprovedAt(approval != null ? approval.getApprovedAt() : null);
        dto.setRejectedAt(approval != null ? approval.getRejectedAt() : null);
        dto.setRejectionReason(approval != null ? approval.getRejectionReason() : null);
        dto.setRejectionNotes(approval != null ? approval.getRejectionNotes() : null);
        dto.setResubmitCount(approval != null && approval.getResubmitCount() != null ? approval.getResubmitCount() : 0);
        dto.setRejectionCount(approval != null && approval.getRejectionCount() != null ? approval.getRejectionCount() : 0);
        dto.setCanResubmit(approval != null && approval.getCanResubmit() != null ? approval.getCanResubmit() : true);
        
        // Cost info from ClaimCost
        ClaimCost cost = entity.getCost();
        dto.setWarrantyCost(cost != null && cost.getWarrantyCost() != null ? cost.getWarrantyCost() : BigDecimal.ZERO);
        dto.setCompanyPaidCost(cost != null ? cost.getCompanyPaidCost() : null);
        dto.setTotalServiceCost(cost != null ? cost.getTotalServiceCost() : null);
        dto.setTotalThirdPartyPartsCost(cost != null ? cost.getTotalThirdPartyPartsCost() : null);
        dto.setTotalEstimatedCost(cost != null ? cost.getTotalEstimatedCost() : null);

        // Status mapping
        if (entity.getStatus() != null) {
            dto.setStatus(entity.getStatus().getCode());
            dto.setStatusLabel(entity.getStatus().getLabel());
        }

        // Customer & vehicle
        dto.setCustomer(mapCustomerInfo(entity.getCustomer()));
        dto.setVehicle(mapVehicleInfo(entity.getVehicle()));

        // Assignment info
        dto.setCreatedBy(mapUserInfo(entity.getCreatedBy()));
        
        // Assignment from ClaimAssignment
        ClaimAssignment assignment = entity.getAssignment();
        dto.setAssignedTechnician(assignment != null ? mapUserInfo(assignment.getAssignedTechnician()) : null);
        
        // Approval from ClaimApproval
        dto.setApprovedBy(approval != null ? mapUserInfo(approval.getApprovedBy()) : null);
        dto.setRejectedBy(approval != null ? mapUserInfo(approval.getRejectedBy()) : null);

        // Diagnostic info (already set above)
        dto.setDiagnosticSummary(diagnostic != null && diagnostic.getInitialDiagnosis() != null ? diagnostic.getInitialDiagnosis() : "");
        dto.setDiagnosticData(""); // keep as empty until a dedicated field is persisted
        // testResults & repairNotes from latest WorkOrder
        List<WorkOrder> workOrders = workOrderRepository.findByClaimId(entity.getId());
        if (workOrders != null && !workOrders.isEmpty()) {
            WorkOrder latest = workOrders.get(workOrders.size() - 1);
            dto.setTestResults(latest.getTestResults());
            dto.setRepairNotes(latest.getRepairNotes());
        } else {
            dto.setTestResults("");
            dto.setRepairNotes("");
        }

        // Warranty eligibility from ClaimWarrantyEligibility
        ClaimWarrantyEligibility warrantyEligibility = entity.getWarrantyEligibility();
        dto.setWarrantyEligibilityAssessment(warrantyEligibility != null ? warrantyEligibility.getWarrantyEligibilityAssessment() : null);
        dto.setIsWarrantyEligible(warrantyEligibility != null ? warrantyEligibility.getIsWarrantyEligible() : null);
        dto.setWarrantyEligibilityNotes(warrantyEligibility != null ? warrantyEligibility.getWarrantyEligibilityNotes() : null);

        // Auto warranty check fields
        dto.setAutoWarrantyEligible(warrantyEligibility != null ? warrantyEligibility.getAutoWarrantyEligible() : null);
        dto.setAutoWarrantyCheckedAt(warrantyEligibility != null ? warrantyEligibility.getAutoWarrantyCheckedAt() : null);
        
        // Parse reasons JSON if available
        if (warrantyEligibility != null && warrantyEligibility.getAutoWarrantyReasons() != null && !warrantyEligibility.getAutoWarrantyReasons().isEmpty()) {
            try {
                ObjectMapper om = new ObjectMapper();
                java.util.List<String> reasons = om.readValue(warrantyEligibility.getAutoWarrantyReasons(),
                        new TypeReference<java.util.List<String>>() {
                        });
                dto.setAutoWarrantyReasons(reasons);
            } catch (Exception ex) {
                // fallback: single string entry
                dto.setAutoWarrantyReasons(java.util.List.of(warrantyEligibility.getAutoWarrantyReasons()));
            }
        } else {
            dto.setAutoWarrantyReasons(java.util.List.of());
        }

        // Manual override info
        dto.setManualWarrantyOverride(warrantyEligibility != null ? warrantyEligibility.getManualWarrantyOverride() : null);
        dto.setManualOverrideConfirmed(warrantyEligibility != null ? warrantyEligibility.getManualOverrideConfirmed() : null);
        dto.setManualOverrideConfirmedAt(warrantyEligibility != null ? warrantyEligibility.getManualOverrideConfirmedAt() : null);
        dto.setManualOverrideConfirmedBy(warrantyEligibility != null ? mapUserInfo(warrantyEligibility.getManualOverrideConfirmedBy()) : null);

        // Applied coverage numbers
        dto.setAppliedCoverageYears(warrantyEligibility != null ? warrantyEligibility.getAutoWarrantyAppliedYears() : null);
        dto.setAppliedCoverageKm(warrantyEligibility != null ? warrantyEligibility.getAutoWarrantyAppliedKm() : null);

        // FE hint flags
        boolean notEligible = warrantyEligibility != null && warrantyEligibility.getAutoWarrantyEligible() != null && !warrantyEligibility.getAutoWarrantyEligible();
        boolean overrideConfirmed = Boolean.TRUE.equals(warrantyEligibility != null ? warrantyEligibility.getManualOverrideConfirmed() : null);
        dto.setRequireOverrideConfirmation(notEligible && !overrideConfirmed);
        dto.setLockEvmRepairFields(notEligible && !overrideConfirmed);

        // Attachments and history
        List<ClaimAttachmentDto> attachments = attachmentRepository.findByClaimIdOrderByUploadDateDesc(entity.getId())
                .stream().map(this::mapAttachment).collect(Collectors.toList());
        dto.setAttachments(attachments != null ? attachments : List.of());
        List<ClaimStatusHistoryDto> statusHistory = statusHistoryRepository
                .findByClaimIdOrderByChangedAtDesc(entity.getId())
                .stream().map(this::mapStatusHistory).collect(Collectors.toList());
        dto.setStatusHistory(statusHistory != null ? statusHistory : List.of());

        // Map laborHours from WorkOrder
        if (workOrders != null && !workOrders.isEmpty()) {
            BigDecimal totalLaborHours = workOrders.stream()
                    .map(WorkOrder::getLaborHours)
                    .filter(hours -> hours != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setLaborHours(totalLaborHours);
        } else {
            dto.setLaborHours(BigDecimal.ZERO);
        }

        // Validation flags
        dto.setCanSubmitToEvm(false); // Nếu chưa có trường này trong entity, trả về false
        dto.setMissingRequirements(List.of()); // Nếu chưa có trường này trong entity, trả về danh sách rỗng

        // Repair configuration from ClaimRepairConfiguration
        ClaimRepairConfiguration repairConfig = entity.getRepairConfiguration();
        dto.setRepairType(repairConfig != null ? repairConfig.getRepairType() : null);
        dto.setCustomerPaymentStatus(repairConfig != null ? repairConfig.getCustomerPaymentStatus() : null);

        // Parse service catalog items from JSON
        if (repairConfig != null && repairConfig.getServiceCatalogItems() != null && !repairConfig.getServiceCatalogItems().isEmpty()) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                List<ClaimResponseDto.ServiceCatalogItemDto> items = objectMapper.readValue(
                        repairConfig.getServiceCatalogItems(),
                        new TypeReference<List<ClaimResponseDto.ServiceCatalogItemDto>>() {
                        });
                dto.setServiceCatalogItems(items);
            } catch (Exception e) {
                log.warn("Failed to parse service catalog items JSON for claim {}: {}", entity.getId(), e.getMessage());
                dto.setServiceCatalogItems(List.of());
            }
        } else {
            dto.setServiceCatalogItems(List.of());
        }

        return dto;
    }

    /**
     * Map to ClaimSummaryDto for summary endpoint
     */
    public ClaimSummaryDto toSummaryDto(Claim entity) {
        ClaimSummaryDto dto = new ClaimSummaryDto();

        // Basic info
        dto.setId(entity.getId());
        dto.setClaimNumber(entity.getClaimNumber());
        dto.setStatus(entity.getStatus().getCode());
        dto.setStatusLabel(entity.getStatus().getLabel());

        // Customer & Vehicle
        dto.setCustomer(mapCustomerInfo(entity.getCustomer()));
        dto.setVehicle(mapVehicleInfo(entity.getVehicle()));

        // Timeline
        dto.setCreatedAt(entity.getCreatedAt());
        ClaimApproval approval = entity.getApproval();
        dto.setApprovedAt(approval != null ? approval.getApprovedAt() : null);
        // completedAt would come from status history

        // Costs
        ClaimCost cost = entity.getCost();
        dto.setWarrantyCost(cost != null && cost.getWarrantyCost() != null ? cost.getWarrantyCost() : BigDecimal.ZERO);
        dto.setCompanyPaidCost(cost != null ? cost.getCompanyPaidCost() : null);

        // Summary
        ClaimDiagnostic diagnostic = entity.getDiagnostic();
        dto.setReportedFailure(diagnostic != null && diagnostic.getReportedFailure() != null ? diagnostic.getReportedFailure() : "");
        dto.setFinalDiagnosis(diagnostic != null && diagnostic.getInitialDiagnosis() != null ? diagnostic.getInitialDiagnosis() : "");

        // Status history
        dto.setStatusHistory(mapStatusHistory(entity.getId()));

        // Calculate completion percentage
        dto.setCompletionPercentage(calculateCompletionPercentage(entity.getStatus().getCode()));

        return dto;
    }

    /**
     * Customer info mapping
     */
    public CustomerInfoDto mapCustomerInfo(Customer customer) {
        if (customer == null)
            return null;

        CustomerInfoDto dto = new CustomerInfoDto();
        dto.setId(customer.getId());
        dto.setName(customer.getName());
        dto.setPhone(customer.getPhone());
        dto.setEmail(customer.getEmail());
        dto.setAddress(customer.getAddress());
        return dto;
    }

    /**
     * Vehicle info mapping
     */
    public VehicleInfoDto mapVehicleInfo(Vehicle vehicle) {
        if (vehicle == null)
            return null;

        VehicleInfoDto dto = new VehicleInfoDto();
        dto.setId(vehicle.getId());
        dto.setVin(vehicle.getVin());
        dto.setModel(vehicle.getModel());
        dto.setYear(vehicle.getYear());
        dto.setMileageKm(vehicle.getMileageKm());
        return dto;
    }

    /**
     * User info mapping
     */
    public UserInfoDto mapUserInfo(User user) {
        if (user == null)
            return null;

        UserInfoDto dto = new UserInfoDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        if (user.getRole() != null) {
            dto.setRoleName(user.getRole().getRoleName());
        }
        return dto;
    }

    /**
     * Attachments mapping
     */
    public List<ClaimAttachmentDto> mapAttachments(Integer claimId) {
        return attachmentRepository.findByClaimIdOrderByUploadDateDesc(claimId)
                .stream()
                .map(this::mapAttachment)
                .collect(Collectors.toList());
    }

    public ClaimAttachmentDto mapAttachment(ClaimAttachment attachment) {
        ClaimAttachmentDto dto = new ClaimAttachmentDto();
        dto.setId(attachment.getId());
        dto.setFilePath(attachment.getFilePath());
        dto.setFileName(attachment.getFileName());
        dto.setOriginalFileName(attachment.getOriginalFileName());
        dto.setFileType(attachment.getFileType());
        dto.setFileSize(attachment.getFileSize());
        dto.setContentType(attachment.getContentType());
        dto.setUploadedAt(attachment.getUploadDate());

        // Generate download and view URLs
        // Extract filename from filePath (could be full path or just filename)
        String fileName = attachment.getFileName();
        if (fileName == null || fileName.isEmpty()) {
            // Fallback: extract from filePath
            String path = attachment.getFilePath();
            if (path != null && path.contains("/")) {
                fileName = path.substring(path.lastIndexOf("/") + 1);
            } else if (path != null) {
                fileName = path;
            }
        }

        // Set download and view URLs - use attachment ID for security
        if (attachment.getId() != null && attachment.getClaimId() != null) {
            dto.setDownloadUrl(
                    "/api/claims/" + attachment.getClaimId() + "/attachments/" + attachment.getId() + "/download");
            dto.setViewUrl("/api/claims/" + attachment.getClaimId() + "/attachments/" + attachment.getId() + "/view");
        } else {
            // Fallback to static file serving if IDs not available
            dto.setDownloadUrl("/uploads/attachments/" + fileName);
            dto.setViewUrl("/uploads/attachments/" + fileName);
        }

        // Map uploadedBy as UserInfoDto
        UserInfoDto uploadedByDto = null;
        if (attachment.getUploadedBy() != null) {
            var userOpt = userRepository.findByUsername(attachment.getUploadedBy());
            if (userOpt.isPresent()) {
                uploadedByDto = mapUserInfo(userOpt.get());
            } else {
                uploadedByDto = new UserInfoDto();
                uploadedByDto.setUsername(attachment.getUploadedBy());
            }
        }
        dto.setUploadedBy(uploadedByDto);
        return dto;
    }

    /**
     * Status history mapping
     */
    public List<ClaimStatusHistoryDto> mapStatusHistory(Integer claimId) {
        return statusHistoryRepository.findByClaimIdOrderByChangedAtDesc(claimId)
                .stream()
                .map(this::mapStatusHistory)
                .collect(Collectors.toList());
    }

    public ClaimStatusHistoryDto mapStatusHistory(ClaimStatusHistory history) {
        ClaimStatusHistoryDto dto = new ClaimStatusHistoryDto();
        dto.setId(history.getId());
        dto.setStatusCode(history.getStatus().getCode());
        dto.setStatusLabel(history.getStatus().getLabel());
        dto.setChangedAt(history.getChangedAt());
        dto.setChangedBy(mapUserInfo(history.getChangedBy()));
        dto.setNote(history.getNote());
        return dto;
    }

    /**
     * Update entity from diagnostic request
     */
    public void updateEntityFromDiagnosticRequest(Claim entity, ClaimDiagnosticRequest dto) {
        // Update diagnostic
        ClaimDiagnostic diagnostic = entity.getOrCreateDiagnostic();
        if (dto.getDiagnosticSummary() != null) {
            diagnostic.setInitialDiagnosis(dto.getDiagnosticSummary());
        }
        if (dto.getDiagnosticDetails() != null) {
            diagnostic.setDiagnosticDetails(dto.getDiagnosticDetails());
        }
        if (dto.getReportedFailure() != null) {
            diagnostic.setReportedFailure(dto.getReportedFailure());
        }
        // Note: problemDescription and problemType are set via ProblemReportRequest, not ClaimDiagnosticRequest
        entity.setDiagnostic(diagnostic);

        // Update cost
        ClaimCost cost = entity.getOrCreateCost();
        if (dto.getWarrantyCost() != null) {
            cost.setWarrantyCost(dto.getWarrantyCost());
        }
        if (dto.getTotalServiceCost() != null) {
            cost.setTotalServiceCost(dto.getTotalServiceCost());
        }
        if (dto.getTotalThirdPartyPartsCost() != null) {
            cost.setTotalThirdPartyPartsCost(dto.getTotalThirdPartyPartsCost());
        }
        if (dto.getTotalEstimatedCost() != null) {
            cost.setTotalEstimatedCost(dto.getTotalEstimatedCost());
        }
        entity.setCost(cost);

        // Update warranty eligibility
        ClaimWarrantyEligibility warrantyEligibility = entity.getOrCreateWarrantyEligibility();
        if (dto.getWarrantyEligibilityAssessment() != null) {
            warrantyEligibility.setWarrantyEligibilityAssessment(dto.getWarrantyEligibilityAssessment());
        }
        if (dto.getIsWarrantyEligible() != null) {
            warrantyEligibility.setIsWarrantyEligible(dto.getIsWarrantyEligible());
        }
        if (dto.getWarrantyEligibilityNotes() != null) {
            warrantyEligibility.setWarrantyEligibilityNotes(dto.getWarrantyEligibilityNotes());
        }
        entity.setWarrantyEligibility(warrantyEligibility);

        // Update repair configuration
        ClaimRepairConfiguration repairConfig = entity.getOrCreateRepairConfiguration();
        if (dto.getRepairType() != null) {
            repairConfig.setRepairType(dto.getRepairType());
        }
        // Note: customerPaymentStatus is set via updatePaymentStatus, not ClaimDiagnosticRequest
        
        // Serialize service catalog items to JSON
        if (dto.getServiceCatalogItems() != null && !dto.getServiceCatalogItems().isEmpty()) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                String json = objectMapper.writeValueAsString(dto.getServiceCatalogItems());
                repairConfig.setServiceCatalogItems(json);
            } catch (Exception e) {
                log.warn("Failed to serialize service catalog items to JSON: {}", e.getMessage());
            }
        }
        entity.setRepairConfiguration(repairConfig);

        // Note: laborHours, testResults, repairNotes are stored in WorkOrder
    }

    /**
     * Update entity from intake request (for draft update)
     */
    public void updateEntityFromIntakeRequest(Claim entity, ClaimIntakeRequest dto, Vehicle vehicle) {
        ClaimDiagnostic diagnostic = entity.getOrCreateDiagnostic();
        if (dto.getReportedFailure() != null) {
            diagnostic.setReportedFailure(dto.getReportedFailure());
        }
        if (dto.getClaimTitle() != null) {
            diagnostic.setInitialDiagnosis(dto.getClaimTitle());
        }
        entity.setDiagnostic(diagnostic);
        
        // Cập nhật số mile cho vehicle nếu có
        if (dto.getMileageKm() != null && vehicle != null) {
            vehicle.setMileageKm(dto.getMileageKm());
        }
        // Bổ sung các trường intake khác nếu có
        // ...
    }

    /**
     * Helper methods
     */
    public void setRelationships(Claim claim, Customer customer, Vehicle vehicle, User createdBy, ClaimStatus status) {
        claim.setCustomer(customer);
        claim.setVehicle(vehicle);
        claim.setCreatedBy(createdBy);
        claim.setStatus(status);
    }

    public void assignTechnician(Claim claim, User technician) {
        ClaimAssignment assignment = claim.getOrCreateAssignment();
        assignment.setAssignedTechnician(technician);
        assignment.setAssignedAt(LocalDateTime.now());
        claim.setAssignment(assignment);
    }

    public void approveClaim(Claim claim, User approver) {
        ClaimApproval approval = claim.getOrCreateApproval();
        approval.setApprovedBy(approver);
        approval.setApprovedAt(LocalDateTime.now());
        claim.setApproval(approval);
    }

    /**
     * Calculate completion percentage based on status
     */
    private Integer calculateCompletionPercentage(String statusCode) {
        return switch (statusCode) {
            case "DRAFT" -> 10;
            case "OPEN", "ASSIGNED" -> 20;
            case "IN_PROGRESS" -> 40;
            case "PENDING_APPROVAL", "PENDING_EVM_APPROVAL" -> 60;
            case "EVM_APPROVED" -> 70;
            case "REPAIR_COMPLETED" -> 80;
            case "READY_FOR_HANDOVER" -> 90;
            case "COMPLETED" -> 95;
            case "CLOSED" -> 100;
            default -> 0;
        };
    }
}
