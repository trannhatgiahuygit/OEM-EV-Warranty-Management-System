package com.ev.warranty.model.dto.part;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePartSerialRequestDTO {
    @NotNull(message = "Part ID is required")
    private Integer partId;

    @NotBlank(message = "Serial number is required")
    private String serialNumber;

    private LocalDate manufactureDate;
}

