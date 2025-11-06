package com.ev.warranty.model.dto.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceItemCreateRequestDTO {

    @NotBlank(message = "Service code is required")
    private String serviceCode;

    @NotBlank(message = "Service name is required")
    private String name;

    private String description;

    @NotNull(message = "Standard labor hours is required")
    @PositiveOrZero(message = "Standard labor hours must be positive or zero")
    private BigDecimal standardLaborHours;

    private String category; // Installation, Repair, Maintenance, Diagnostic, etc.

    @Builder.Default
    private Boolean active = true;
}
