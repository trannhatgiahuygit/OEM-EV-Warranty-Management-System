package com.ev.warranty.model.dto.workorder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderResponseDTO {

    private Integer id;
    private Integer claimId;
    private String claimNumber;
    private Integer technicianId;
    private String technicianName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String result;
    private BigDecimal laborHours;
    private String status;
    private List<WorkOrderPartDTO> partsUsed;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    // 🆕 Nested minimal objects to satisfy tests expecting jsonData.claim / jsonData.technician
    private ClaimRef claim; // { id, claimNumber }
    private TechnicianRef technician; // { id, username, fullName }

    // 🆕 Alias expected by tests: jsonData.parts
    private List<WorkOrderPartDTO> parts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClaimRef {
        private Integer id;
        private String claimNumber;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TechnicianRef {
        private Integer id;
        private String username;
        private String fullName;
    }
}
