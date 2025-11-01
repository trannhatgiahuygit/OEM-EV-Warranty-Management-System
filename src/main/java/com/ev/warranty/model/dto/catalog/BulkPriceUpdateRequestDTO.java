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
public class BulkPriceUpdateRequestDTO {

    @Valid
    @NotEmpty(message = "At least one price update is required")
    private List<PriceUpdateItemDTO> priceUpdates;

    private String reason; // Reason for bulk update
    private String effectiveDate; // When the updates take effect
}
