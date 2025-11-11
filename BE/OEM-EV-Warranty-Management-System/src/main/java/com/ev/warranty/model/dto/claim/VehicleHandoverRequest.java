package com.ev.warranty.model.dto.claim;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VehicleHandoverRequest {

    @NotNull(message = "Handover date is required")
    private LocalDateTime handoverAt;

    @NotBlank(message = "Customer signature is required")
    private String customerSignature; // Digital signature or initials

    @NotBlank(message = "Handover notes are required")
    private String handoverNotes;

    private String customerFeedback;

    private Boolean customerSatisfied;

    private String handoverLocation; // Service center location

    private String vehicleConditionNotes;

    private String warrantyInfoProvided; // What warranty information was shared

    private String followUpRequired; // Any follow-up actions needed

    private String handoverPersonnel; // Name of staff member conducting handover
}