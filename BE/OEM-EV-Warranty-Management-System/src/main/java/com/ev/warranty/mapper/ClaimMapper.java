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
    private final WorkOrderRepository workOrderRepository; // 195 ADD WorkOrderRepository

    public Claim toEntity(ClaimIntakeRequest dto) {
        return Claim.builder()
                .reportedFailure(dto.getReportedFailure())
                .initialDiagnosis(dto.getClaimTitle())
                .warrantyCost(BigDecimal.ZERO)
                .build();
    }

    /**
     * Complete mapping for ClaimResponseDto - replaces mapToResponseDto in service
     */
    public ClaimResponseDto toResponseDto(Claim entity) {
        ClaimResponseDto dto = new ClaimResponseDto();

        // Basic info
        dto.setId(entity.getId());
        dto.setClaimNumber(entity.getClaimNumber());
        dto.setReportedFailure(entity.getReportedFailure() != null ? entity.getReportedFailure() : "");
        dto.setInitialDiagnosis(entity.getInitialDiagnosis() != null ? entity.getInitialDiagnosis() : "");
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setApprovedAt(entity.getApprovedAt());
        dto.setWarrantyCost(entity.getWarrantyCost() != null ? entity.getWarrantyCost() : BigDecimal.ZERO);
        dto.setCompanyPaidCost(entity.getCompanyPaidCost() != null ? entity.getCompanyPaidCost() : BigDecimal.ZERO);

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
        dto.setAssignedTechnician(mapUserInfo(entity.getAssignedTechnician()));
        dto.setApprovedBy(mapUserInfo(entity.getApprovedBy()));
        dto.setRejectedBy(mapUserInfo(entity.getRejectedBy()));
        dto.setRejectedAt(entity.getRejectedAt());

        // Diagnostic info
        dto.setDiagnosticSummary(entity.getInitialDiagnosis() != null ? entity.getInitialDiagnosis() : "");
        dto.setDiagnosticData(""); // keep as empty until a dedicated field is persisted
        dto.setDiagnosticDetails(entity.getDiagnosticDetails() != null ? entity.getDiagnosticDetails() : "");
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

        // ===== NEW: map warranty eligibility fields =====
        dto.setWarrantyEligibilityAssessment(entity.getWarrantyEligibilityAssessment());
        dto.setIsWarrantyEligible(entity.getIsWarrantyEligible());
        dto.setWarrantyEligibilityNotes(entity.getWarrantyEligibilityNotes());

        // Attachments and history
        List<ClaimAttachmentDto> attachments = attachmentRepository.findByClaimIdOrderByUploadDateDesc(entity.getId())
                .stream().map(this::mapAttachment).collect(Collectors.toList());
        dto.setAttachments(attachments != null ? attachments : List.of());
        List<ClaimStatusHistoryDto> statusHistory = statusHistoryRepository.findByClaimIdOrderByChangedAtDesc(entity.getId())
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

        // 195 Problem & rejection tracking
        dto.setResubmitCount(entity.getResubmitCount());
        dto.setRejectionCount(entity.getRejectionCount());
        dto.setRejectionReason(entity.getRejectionReason());
        dto.setRejectionNotes(entity.getRejectionNotes());
        dto.setProblemDescription(entity.getProblemDescription());
        dto.setProblemType(entity.getProblemType());
        dto.setCanResubmit(entity.getCanResubmit());

        // ===== NEW: Map repair type and service catalog =====
        dto.setRepairType(entity.getRepairType());
        dto.setTotalServiceCost(entity.getTotalServiceCost());
        dto.setTotalThirdPartyPartsCost(entity.getTotalThirdPartyPartsCost());
        dto.setTotalEstimatedCost(entity.getTotalEstimatedCost());
        dto.setCustomerPaymentStatus(entity.getCustomerPaymentStatus());
        
        // Parse service catalog items from JSON
        if (entity.getServiceCatalogItems() != null && !entity.getServiceCatalogItems().isEmpty()) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                List<ClaimResponseDto.ServiceCatalogItemDto> items = objectMapper.readValue(
                    entity.getServiceCatalogItems(),
                    new TypeReference<List<ClaimResponseDto.ServiceCatalogItemDto>>() {}
                );
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
        dto.setApprovedAt(entity.getApprovedAt());
        // completedAt would come from status history

        // Costs
        dto.setWarrantyCost(entity.getWarrantyCost());
        dto.setCompanyPaidCost(entity.getCompanyPaidCost());

        // Summary
        dto.setReportedFailure(entity.getReportedFailure());
        dto.setFinalDiagnosis(entity.getInitialDiagnosis());

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
        if (customer == null) return null;

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
        if (vehicle == null) return null;

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
        if (user == null) return null;

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
            dto.setDownloadUrl("/api/claims/" + attachment.getClaimId() + "/attachments/" + attachment.getId() + "/download");
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
        if (dto.getDiagnosticSummary() != null) {
            entity.setInitialDiagnosis(dto.getDiagnosticSummary());
        }
        if (dto.getDiagnosticDetails() != null) {
            entity.setDiagnosticDetails(dto.getDiagnosticDetails());
        }

        // Map reportedFailure if provided (for validation when readyForSubmission is true)
        if (dto.getReportedFailure() != null) {
            entity.setReportedFailure(dto.getReportedFailure());
        }

        // Map warrantyCost if provided
        if (dto.getWarrantyCost() != null) {
            entity.setWarrantyCost(dto.getWarrantyCost());
        }

        // ===== NEW: Map warranty eligibility fields =====
        if (dto.getWarrantyEligibilityAssessment() != null) {
            entity.setWarrantyEligibilityAssessment(dto.getWarrantyEligibilityAssessment());
        }
        if (dto.getIsWarrantyEligible() != null) {
            entity.setIsWarrantyEligible(dto.getIsWarrantyEligible());
        }
        if (dto.getWarrantyEligibilityNotes() != null) {
            entity.setWarrantyEligibilityNotes(dto.getWarrantyEligibilityNotes());
        }

        // ===== NEW: Map repair type and service catalog =====
        if (dto.getRepairType() != null) {
            entity.setRepairType(dto.getRepairType());
        }
        if (dto.getTotalServiceCost() != null) {
            entity.setTotalServiceCost(dto.getTotalServiceCost());
        }
        
        // ===== NEW: Map third party parts cost totals (for SC Repair) =====
        if (dto.getTotalThirdPartyPartsCost() != null) {
            entity.setTotalThirdPartyPartsCost(dto.getTotalThirdPartyPartsCost());
        }
        if (dto.getTotalEstimatedCost() != null) {
            entity.setTotalEstimatedCost(dto.getTotalEstimatedCost());
        }
        
        // Serialize service catalog items to JSON
        if (dto.getServiceCatalogItems() != null && !dto.getServiceCatalogItems().isEmpty()) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                String json = objectMapper.writeValueAsString(dto.getServiceCatalogItems());
                entity.setServiceCatalogItems(json);
            } catch (Exception e) {
                log.warn("Failed to serialize service catalog items to JSON: {}", e.getMessage());
            }
        }
        
        // Note: laborHours, testResults, repairNotes are stored in WorkOrder
    }

    /**
     * Update entity from intake request (for draft update)
     */
    public void updateEntityFromIntakeRequest(Claim entity, ClaimIntakeRequest dto, Vehicle vehicle) {
        if (dto.getReportedFailure() != null) {
            entity.setReportedFailure(dto.getReportedFailure());
        }
        if (dto.getClaimTitle() != null) {
            entity.setInitialDiagnosis(dto.getClaimTitle());
        }
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
        claim.setAssignedTechnician(technician);
    }

    public void approveClaim(Claim claim, User approver) {
        claim.setApprovedBy(approver);
        claim.setApprovedAt(LocalDateTime.now());
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
