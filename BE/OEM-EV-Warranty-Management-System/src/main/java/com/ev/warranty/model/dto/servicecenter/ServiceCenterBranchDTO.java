package com.ev.warranty.model.dto.servicecenter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceCenterBranchDTO {
    private Integer id;
    private String code;
    private String name;
    private String location;
    private String phone;
    private String email;
    private Boolean active;
}

