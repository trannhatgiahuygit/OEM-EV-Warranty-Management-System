package com.ev.warranty.model.dto.servicecenter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceCenterResponseDTO {
    private Integer id;
    private String code;
    private String name;
    private String location;
    private String address;
    private String phone;
    private String email;
    private String managerName;
    private String region;
    private Integer parentServiceCenterId;
    private String parentServiceCenterName;
    private String parentServiceCenterCode;
    private Boolean isMainBranch;
    private Boolean active;
    private Integer capacity;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private Integer branchCount; // Number of branches
    private List<ServiceCenterBranchDTO> branches; // List of branches
}

