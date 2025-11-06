package com.ev.warranty.model.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AppointmentCreateResponseDTO {
    private Integer id;
    private LocalDateTime scheduledAt;
    private String status;
    private Boolean notifiedCustomer;
    private LocalDateTime createdAt;
    private String notes;

    // Vehicle information
    private VehicleBasicDTO vehicle;

    // Claim information (if applicable)
    private ClaimBasicDTO claim;

    // Created by information
    private UserBasicDTO createdBy;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class VehicleBasicDTO {
        private Integer id;
        private String vin;
        private String model;
        private Integer year;
        private CustomerBasicDTO customer;

        @Data
        @AllArgsConstructor
        @NoArgsConstructor
        @Builder
        public static class CustomerBasicDTO {
            private Integer id;
            private String name;
            private String email;
            private String phone;
        }
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ClaimBasicDTO {
        private Integer id;
        private String claimNumber;
        private String reportedFailure;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class UserBasicDTO {
        private Integer id;
        private String username;
        private String fullName;
        private String role;
    }
}
