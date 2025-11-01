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
public class CatalogImportRequestDTO {

    @Valid
    @NotEmpty(message = "At least one service item is required")
    private List<ServiceItemCreateRequestDTO> serviceItems;

    @Valid
    private List<CatalogPriceCreateRequestDTO> catalogPrices;

    private String region; // Target region for import
    private Integer serviceCenterId; // Target service center for import
    private Boolean overwriteExisting; // Whether to overwrite existing items
}
