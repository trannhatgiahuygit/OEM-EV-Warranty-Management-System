package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClaimIntakeRequest {
    // Customer info (required for intake)
    @NotBlank(message = "Customer name is required")
    @Size(max = 200)
    private String customerName;

    @NotBlank(message = "Customer phone is required")
    @Size(max = 30)
    @Pattern(regexp = "^\\+?[0-9. ()-]{7,25}$", message = "Invalid phone number")
    private String customerPhone;

    @NotBlank(message = "Customer email is required")
    @Size(max = 150)
    @Email(message = "Invalid email format")
    private String customerEmail;

    @NotBlank(message = "Customer address is required")
    @Size(max = 300)
    private String customerAddress;

    // Vehicle info (required)
    @NotBlank(message = "VIN is required")
    @Size(min = 17, max = 17, message = "VIN must be exactly 17 characters")
    private String vin;

    @NotNull(message = "Mileage is required")
    private Integer mileageKm;

    // Basic claim info (required)
    @NotBlank(message = "Claim title is required")
    @Size(max = 200)
    private String claimTitle;

    @NotBlank(message = "Reported failure description is required")
    @Size(min = 10, message = "Description must be at least 10 characters")
    private String reportedFailure;

    private Boolean customerConsent = false;

    // Optional technician assignment
    private Integer assignedTechnicianId;

    private String flow; // DRAFT, INTAKE, OPEN, ...

    public String getFlow() {
        return flow;
    }

    public void setFlow(String flow) {
        this.flow = flow;
    }
}
