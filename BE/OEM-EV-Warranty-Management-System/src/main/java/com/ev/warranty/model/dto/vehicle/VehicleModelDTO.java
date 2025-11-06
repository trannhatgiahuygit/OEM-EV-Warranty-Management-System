package com.ev.warranty.model.dto.vehicle;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VehicleModelDTO {
    private Integer id;

    @NotBlank
    private String code;

    @NotBlank
    private String name;

    private String brand;
    private String description;
    private Boolean active;
}
