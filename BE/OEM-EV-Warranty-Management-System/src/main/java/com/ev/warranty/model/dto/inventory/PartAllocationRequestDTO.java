package com.ev.warranty.model.dto.inventory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PartAllocationRequestDTO {

    @NotNull(message = "Work order ID is required")
    private Integer workOrderId;

    @NotNull(message = "Claim ID is required")
    private Integer claimId;

    @NotNull(message = "Technician ID is required")
    private Integer technicianId;

    @Builder.Default
    private String priority = "normal"; // low, normal, high, urgent
    private String notes;

    @NotEmpty(message = "Allocation items are required")
    @Valid
    private List<AllocationItemDTO> items;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class AllocationItemDTO {
        @NotNull(message = "Part ID is required")
        private Integer partId;
        
        @NotNull(message = "Quantity is required")
        private Integer quantity;
        
        private String notes;
        @Builder.Default
        private Boolean urgent = false;
    }
}
