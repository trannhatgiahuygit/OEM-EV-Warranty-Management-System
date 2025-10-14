package com.ev.warranty.model.dto.vehicle;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VehicleResponseDTO {
    private Integer id;
    private String vin;
    private String model;
    private Integer year;
    private LocalDate registrationDate;
    private LocalDate warrantyStart;
    private LocalDate warrantyEnd;
    private Integer mileageKm;
    private String warrantyStatus; // ACTIVE, EXPIRED, EXPIRING_SOON
    private Integer warrantyYearsRemaining;
    private LocalDateTime createdAt;

    // Customer information
    private CustomerSummaryDTO customer;

    // Factory installed parts
    private List<InstalledPartDTO> installedParts;

    // Registration summary
    private RegistrationSummaryDTO registrationSummary;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CustomerSummaryDTO {
        private Integer id;
        private String name;
        private String email;
        private String phone;
        private String address;
        private Boolean isNewCustomer; // True if created during this registration
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class InstalledPartDTO {
        private Integer partId;
        private String partNumber;
        private String partName;
        private String category;
        private String serialNumber;
        private LocalDate manufactureDate;
        private LocalDateTime installedAt;
        private String status; // installed, removed, replaced
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class RegistrationSummaryDTO {
        private String registeredBy;
        private Integer totalPartsInstalled;
        private String warrantyPeriod; // "3 years" or "5 years"
        private String registrationStatus; // "COMPLETED", "PENDING_VERIFICATION"
    }
}