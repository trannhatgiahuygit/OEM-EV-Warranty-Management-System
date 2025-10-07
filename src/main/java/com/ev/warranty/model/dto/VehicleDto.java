package com.ev.warranty.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleDto {
    private Integer id;
    private String vin;
    private String model;
    private String brand;
    private Integer year;
    private String color;
    private String engineType;
    private String batteryCapacity;
    private String licensePlate;
    private Integer ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime registrationDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime warrantyStartDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime warrantyEndDate;

    private String status;
    private List<ClaimDto> claims;
    private List<ServiceHistoryDto> serviceHistories;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // For vehicle registration request
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String vin;
        private String model;
        private String brand;
        private Integer year;
        private String color;
        private String engineType;
        private String batteryCapacity;
        private String licensePlate;
        private Integer ownerId;
        private LocalDateTime warrantyStartDate;
        private LocalDateTime warrantyEndDate;
    }

    // For vehicle update request
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String color;
        private String licensePlate;
        private Integer ownerId;
        private String status;
        private LocalDateTime warrantyEndDate;
    }
}
