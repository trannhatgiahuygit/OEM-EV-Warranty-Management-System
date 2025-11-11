package com.ev.warranty.model.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyPolicyUpdateRequestDTO {

    private String name;
    private String description;
    private String applicableModel;
    private Integer applicableYearFrom;
    private Integer applicableYearTo;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private String status;
}
