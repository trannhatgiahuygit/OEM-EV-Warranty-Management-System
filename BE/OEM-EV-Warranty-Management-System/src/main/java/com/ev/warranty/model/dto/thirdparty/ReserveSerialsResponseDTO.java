package com.ev.warranty.model.dto.thirdparty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReserveSerialsResponseDTO {
    private Boolean allReserved;
    private String message; // Vietnamese message
    private List<PartReservationResultDTO> results;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartReservationResultDTO {
        private Integer thirdPartyPartId;
        private String partName;
        private Integer requestedQuantity;
        private Integer reservedQuantity;
        private Integer availableQuantity;
        private List<String> reservedSerialNumbers;
        private String status; // "ALL_RESERVED", "PARTIAL", "NONE_AVAILABLE"
        private String message; // Vietnamese message
    }
}

