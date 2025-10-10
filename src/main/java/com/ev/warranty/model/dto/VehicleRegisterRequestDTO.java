package com.ev.warranty.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VehicleRegisterRequestDTO {

    @NotBlank(message = "VIN is required")
    @Size(min = 17, max = 17, message = "VIN must be exactly 17 characters")
    @Pattern(regexp = "^[A-HJ-NPR-Z0-9]{17}$", message = "Invalid VIN format - no I, O, Q allowed")
    private String vin;

    @NotBlank(message = "Model is required")
    @Size(max = 100, message = "Model cannot exceed 100 characters")
    private String model;

    @NotNull(message = "Year is required")
    @Min(value = 2020, message = "Year must be 2020 or later")
    @Max(value = 2030, message = "Year cannot exceed 2030")
    private Integer year;

    @Min(value = 0, message = "Mileage cannot be negative")
    @Max(value = 999999, message = "Mileage cannot exceed 999,999 km")
    private Integer mileageKm; // Optional - defaults to 0 if not provided

    // Customer selection - Either customerId OR customerInfo (not both)
    private Integer customerId; // For existing customer

    @Valid
    private CustomerInfoDTO customerInfo; // For new customer

    @NotNull(message = "Registration date is required")
    private LocalDate registrationDate;

    private LocalDate warrantyStart; // Optional - defaults to registrationDate

    // Factory installed parts - REQUIRED for complete vehicle registration
    @NotEmpty(message = "At least one installed part is required")
    @Valid
    private List<PartSerialDTO> installedParts;

    // Nested DTO for new customer info
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CustomerInfoDTO {
        @NotBlank(message = "Customer name is required")
        @Size(min = 1, max = 200, message = "Name must be between 1 and 200 characters")
        private String name;

        @Email(message = "Invalid email format")
        @Size(max = 150, message = "Email cannot exceed 150 characters")
        private String email;

        @Size(max = 30, message = "Phone cannot exceed 30 characters")
        private String phone;

        @Size(max = 300, message = "Address cannot exceed 300 characters")
        private String address;
    }

    // Nested DTO for factory installed parts
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class PartSerialDTO {
        @NotNull(message = "Part ID is required")
        private Integer partId;

        @NotBlank(message = "Serial number is required")
        @Size(min = 1, max = 150, message = "Serial number must be between 1 and 150 characters")
        private String serialNumber;

        private LocalDate manufactureDate; // Optional
    }
}