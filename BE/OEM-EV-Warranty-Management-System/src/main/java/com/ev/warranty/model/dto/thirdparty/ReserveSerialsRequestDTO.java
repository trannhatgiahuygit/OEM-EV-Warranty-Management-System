package com.ev.warranty.model.dto.thirdparty;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class ReserveSerialsRequestDTO {
    @NotNull(message = "Claim ID is required")
    private Integer claimId;
    
    @NotNull(message = "Vehicle ID is required")
    private Integer vehicleId;
    
    @NotEmpty(message = "Parts to reserve are required")
    private List<PartReservationDTO> parts;
    
    @Data
    public static class PartReservationDTO {
        @NotNull(message = "Third party part ID is required")
        private Integer thirdPartyPartId;
        
        @NotNull(message = "Quantity is required")
        private Integer quantity;
    }
}

