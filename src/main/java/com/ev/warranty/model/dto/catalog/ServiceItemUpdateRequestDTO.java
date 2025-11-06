package com.ev.warranty.model.dto.catalog;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceItemUpdateRequestDTO {

    private String name;
    private String description;
    private BigDecimal standardLaborHours;
    private String category;
    private Boolean active;
}
