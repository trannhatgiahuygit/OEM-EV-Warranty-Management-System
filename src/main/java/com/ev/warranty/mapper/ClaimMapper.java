package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.ClaimAttachmentRepository;
import com.ev.warranty.repository.ClaimStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ClaimMapper {

    private final ClaimAttachmentRepository attachmentRepository;
    private final ClaimStatusHistoryRepository statusHistoryRepository;

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
        dto.setReportedFailure(entity.getReportedFailure());
        dto.setInitialDiagnosis(entity.getInitialDiagnosis());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setApprovedAt(entity.getApprovedAt());
        dto.setWarrantyCost(entity.getWarrantyCost());
        dto.setCompanyPaidCost(entity.getCompanyPaidCost());

        // Status mapping
        if (entity.getStatus() != null) {
            dto.setStatus(entity.getStatus().getCode());
            dto.setStatusLabel(entity.getStatus().getLabel());
        }

        // Customer info
        if (entity.getCustomer() != null) {
            dto.setCustomer(mapCustomerInfo(entity.getCustomer()));
        }

        // Vehicle info
        if (entity.getVehicle() != null) {
            dto.setVehicle(mapVehicleInfo(entity.getVehicle()));
        }

        // Users mapping
        dto.setCreatedBy(mapUserInfo(entity.getCreatedBy()));
        dto.setAssignedTechnician(mapUserInfo(entity.getAssignedTechnician()));
        dto.setApprovedBy(mapUserInfo(entity.getApprovedBy()));

        // Related data
        dto.setAttachments(mapAttachments(entity.getId()));
        dto.setStatusHistory(mapStatusHistory(entity.getId()));

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
        return attachmentRepository.findByClaimIdOrderByUploadedAtDesc(claimId)
                .stream()
                .map(this::mapAttachment)
                .collect(Collectors.toList());
    }

    public ClaimAttachmentDto mapAttachment(ClaimAttachment attachment) {
        ClaimAttachmentDto dto = new ClaimAttachmentDto();
        dto.setId(attachment.getId());
        dto.setFilePath(attachment.getFilePath());
        dto.setFileType(attachment.getFileType());
        dto.setUploadedAt(attachment.getUploadedAt());
        dto.setUploadedBy(mapUserInfo(attachment.getUploadedBy()));
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