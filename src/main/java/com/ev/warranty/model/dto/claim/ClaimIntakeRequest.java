package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClaimIntakeRequest {
    // Customer info (required for intake)
    @NotBlank(message = "Customer name is required")
    @Size(max = 200)
    private String customerName;

    @Size(max = 30)
    private String customerPhone;

    @Size(max = 150)
    private String customerEmail;

    @Size(max = 300)
    private String customerAddress;

    // Vehicle info (required)
    @NotBlank(message = "VIN is required")
    @Size(min = 17, max = 17, message = "VIN must be exactly 17 characters")
    private String vin;

    private Integer mileageKm;

    // Basic claim info (required)
    @NotBlank(message = "Claim title is required")
    @Size(max = 200)
    private String claimTitle;

    @NotBlank(message = "Reported failure description is required")
    @Size(min = 10, message = "Description must be at least 10 characters")
    private String reportedFailure;

    private String appointmentDate; // ISO datetime string

    private Boolean customerConsent = false;

    // Optional technician assignment
    private Integer assignedTechnicianId;
}
