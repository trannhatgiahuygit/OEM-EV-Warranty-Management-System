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
public class BulkPriceUpdateResponseDTO {

    private Integer totalRequested;
    private Integer successCount;
    private Integer failureCount;

    private List<PriceUpdateResultDTO> results;
    private List<String> errors;

    private String updatedBy;
    private String updatedAt;
    private String reason;
}
