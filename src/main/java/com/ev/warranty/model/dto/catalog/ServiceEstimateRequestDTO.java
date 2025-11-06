package com.ev.warranty.model.dto.catalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceEstimateRequestDTO {

    @Valid
    @NotEmpty(message = "At least one item is required")
    private List<ServiceEstimateItemDTO> partItems;

    @Valid
    private List<ServiceEstimateItemDTO> serviceItems;

    private String region; // For regional pricing
    private Integer serviceCenterId; // For service center specific pricing
    private String currency; // Default VND
}
