package com.ev.warranty.model.dto.part;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplacePartSerialRequestDTO {
    @NotBlank(message = "Old serial number is required")
    private String oldSerialNumber;

    @NotBlank(message = "New serial number is required")
    private String newSerialNumber;

    @NotBlank(message = "Vehicle VIN is required")
    private String vehicleVin;

    private Integer workOrderId;
    private String reason;
    private String notes;
}

