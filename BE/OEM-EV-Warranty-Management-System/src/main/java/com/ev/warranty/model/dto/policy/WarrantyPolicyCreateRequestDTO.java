package com.ev.warranty.model.dto.policy;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyPolicyCreateRequestDTO {

    @NotBlank(message = "Policy code is required")
    @JsonProperty("code")
    private String code;

    @NotBlank(message = "Policy name is required")
    @JsonProperty("policy_name")
    private String policyName;

    @JsonProperty("description")
    private String description;

    @NotBlank(message = "Vehicle model is required")
    @JsonProperty("vehicle_model")
    private String vehicleModel;

    @NotNull(message = "Policy duration (months) is required")
    @JsonProperty("policy_duration_months")
    private Integer policyDurationMonths;

    @NotNull(message = "Mileage limit is required")
    @JsonProperty("mileage_limit_km")
    private Integer mileageLimitKm;

    @JsonProperty("effective_from")
    private LocalDateTime effectiveFrom;

    @JsonProperty("effective_to")
    private LocalDateTime effectiveTo;

    @JsonProperty("terms_conditions")
    private String termsConditions;

    @JsonProperty("coverage_details")
    private String coverageDetails;

    @NotBlank(message = "Status is required")
    @JsonProperty("status")
    private String status;
}
