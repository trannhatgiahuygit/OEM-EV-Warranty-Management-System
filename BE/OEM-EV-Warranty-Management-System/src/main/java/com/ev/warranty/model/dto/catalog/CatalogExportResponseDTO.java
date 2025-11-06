package com.ev.warranty.model.dto.catalog;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogExportResponseDTO {

    private Integer totalItems;
    private Integer totalParts;
    private Integer totalServices;

    private List<ServiceItemResponseDTO> serviceItems;
    private List<CatalogPriceResponseDTO> prices;

    private String region;
    private Integer serviceCenterId;
    private String exportedBy;
    private String exportedAt;
    private String fileFormat; // JSON, CSV, Excel
    private String downloadUrl; // URL to download the export file
}
