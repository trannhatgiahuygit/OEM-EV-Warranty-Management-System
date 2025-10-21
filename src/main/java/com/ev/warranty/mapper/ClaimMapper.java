package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.Customer;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.ClaimStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ClaimMapper {

    public Claim toEntity(ClaimIntakeRequest dto) {
        return Claim.builder()
                .reportedFailure(dto.getReportedFailure())
                .warrantyCost(BigDecimal.ZERO)
                .build();
    }

    public ClaimResponseDto toResponseDto(Claim entity) {
        ClaimResponseDto dto = new ClaimResponseDto();
        dto.setId(entity.getId());
        dto.setClaimNumber(entity.getClaimNumber());
        dto.setReportedFailure(entity.getReportedFailure());
        dto.setInitialDiagnosis(entity.getInitialDiagnosis());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setApprovedAt(entity.getApprovedAt());
        dto.setWarrantyCost(entity.getWarrantyCost());
        dto.setCompanyPaidCost(entity.getCompanyPaidCost()); // ánh xạ chi phí bảo hành hãng chi trả

        // Map status
        if (entity.getStatus() != null) {
            dto.setStatus(entity.getStatus().getCode());
            dto.setStatusLabel(entity.getStatus().getLabel());
        }

        // Map customer info
        if (entity.getCustomer() != null) {
            CustomerInfoDto customerInfo = new CustomerInfoDto();
            customerInfo.setId(entity.getCustomer().getId());
            customerInfo.setName(entity.getCustomer().getName());
            customerInfo.setPhone(entity.getCustomer().getPhone());
            customerInfo.setEmail(entity.getCustomer().getEmail());
            customerInfo.setAddress(entity.getCustomer().getAddress());
            dto.setCustomer(customerInfo);
        }

        // Map vehicle info
        if (entity.getVehicle() != null) {
            VehicleInfoDto vehicleInfo = new VehicleInfoDto();
            vehicleInfo.setId(entity.getVehicle().getId());
            vehicleInfo.setVin(entity.getVehicle().getVin());
            vehicleInfo.setModel(entity.getVehicle().getModel());
            vehicleInfo.setYear(entity.getVehicle().getYear());
            vehicleInfo.setMileageKm(entity.getVehicle().getMileageKm());
            dto.setVehicle(vehicleInfo);
        }

        // Map user info
        if (entity.getCreatedBy() != null) {
            UserInfoDto createdByInfo = new UserInfoDto();
            createdByInfo.setId(entity.getCreatedBy().getId());
            createdByInfo.setUsername(entity.getCreatedBy().getUsername());
            createdByInfo.setFullName(entity.getCreatedBy().getFullName());
            dto.setCreatedBy(createdByInfo);
        }

        if (entity.getAssignedTechnician() != null) {
            UserInfoDto technicianInfo = new UserInfoDto();
            technicianInfo.setId(entity.getAssignedTechnician().getId());
            technicianInfo.setUsername(entity.getAssignedTechnician().getUsername());
            technicianInfo.setFullName(entity.getAssignedTechnician().getFullName());
            dto.setAssignedTechnician(technicianInfo);
        }

        if (entity.getApprovedBy() != null) {
            UserInfoDto approvedByInfo = new UserInfoDto();
            approvedByInfo.setId(entity.getApprovedBy().getId());
            approvedByInfo.setUsername(entity.getApprovedBy().getUsername());
            approvedByInfo.setFullName(entity.getApprovedBy().getFullName());
            dto.setApprovedBy(approvedByInfo);
        }

        return dto;
    }

    public void updateEntityFromDiagnosticRequest(Claim entity, ClaimDiagnosticRequest dto) {
        if (dto.getDiagnosticSummary() != null) {
            entity.setInitialDiagnosis(dto.getDiagnosticSummary());
        }
        // Additional diagnostic data would be handled in separate entities/services
    }

    // Helper method to set relationships
    public void setRelationships(Claim claim, Customer customer, Vehicle vehicle, User createdBy, ClaimStatus status) {
        claim.setCustomer(customer);
        claim.setVehicle(vehicle);
        claim.setCreatedBy(createdBy);
        claim.setStatus(status);
    }

    // Helper method to assign technician
    public void assignTechnician(Claim claim, User technician) {
        claim.setAssignedTechnician(technician);
    }

    // Helper method to approve claim
    public void approveClaim(Claim claim, User approver) {
        claim.setApprovedBy(approver);
        claim.setApprovedAt(java.time.LocalDateTime.now());
    }
}
