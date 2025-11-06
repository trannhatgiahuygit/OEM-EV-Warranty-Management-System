package com.ev.warranty.model.dto.policy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyValidationRequestDTO {

    @NotBlank(message = "VIN is required")
    private String vin;

    @NotBlank(message = "Component category is required")
    private String componentCategory; // Battery, Motor, BMS, etc.

    @NotNull(message = "Current mileage is required")
    private Integer currentMileageKm;

    @NotNull(message = "Failure date is required")
    private LocalDate failureDate;

    // Optional fields for more specific validation
    private String failureDescription;
    private String serialNumber; // Serial number of failed component
    private Integer claimId; // If validating for existing claim
    private String failureConditions; // Conditions that may affect coverage (e.g., "water damage")
}
