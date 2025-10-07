package com.ev.warranty.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartDto {
    private Integer id;
    private String partNumber;
    private String partName;
    private String description;
    private String category;
    private String serialNumber;
    private Double price;
    private String supplier;
    private Integer warrantyPeriodMonths;
    private String status;
    private Integer installedVehicleId;
    private String installedVehicleVin;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime installationDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime manufacturingDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime receivedDate;

    private Integer stockQuantity;
    private Integer minimumStock;
    private String notes;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // For creating new part
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String partNumber;
        private String partName;
        private String description;
        private String category;
        private String serialNumber;
        private Double price;
        private String supplier;
        private Integer warrantyPeriodMonths;
        private LocalDateTime manufacturingDate;
        private Integer stockQuantity;
        private Integer minimumStock;
        private String notes;
    }

    // For installing part to vehicle
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InstallRequest {
        private Integer vehicleId;
        private String serialNumber;
        private LocalDateTime installationDate;
        private String notes;
    }

    // For updating part information
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String description;
        private Double price;
        private String supplier;
        private String status;
        private Integer stockQuantity;
        private Integer minimumStock;
        private String notes;
    }
}
