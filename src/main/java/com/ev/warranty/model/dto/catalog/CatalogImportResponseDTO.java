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
public class CatalogImportResponseDTO {

    private Integer totalRequested;
    private Integer successCount;
    private Integer failureCount;
    private Integer skippedCount;

    private List<String> successItems;
    private List<String> failedItems;
    private List<String> errors;

    private String importedBy;
    private String importedAt;
    private String region;
    private Integer serviceCenterId;
}
