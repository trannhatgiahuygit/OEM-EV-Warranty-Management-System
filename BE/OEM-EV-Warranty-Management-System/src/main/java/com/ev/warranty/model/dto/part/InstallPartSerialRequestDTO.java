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
public class InstallPartSerialRequestDTO {
    @NotBlank(message = "Serial number is required")
    private String serialNumber;

    @NotBlank(message = "Vehicle VIN is required")
    private String vehicleVin;

    private Integer workOrderId;
    private String notes;
}

