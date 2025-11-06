package com.ev.warranty.model.dto.servicecenter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceCenterRequestDTO {
    @NotBlank(message = "Service center code is required")
    private String code;

    @NotBlank(message = "Service center name is required")
    private String name;

    private String location;
    
    private String address;
    
    private String phone;
    
    private String email;
    
    private String managerName;
    
    private String region;
    
    private Integer parentServiceCenterId; // For branch relationships
    
    private Boolean isMainBranch;
    
    private Boolean active;
    
    private Integer capacity;
    
    private String notes;
}

