package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleHandoverRequest {

    @NotBlank(message = "Customer signature is required")
    private String customerSignature;

    @NotBlank(message = "Handover notes are required")
    private String handoverNotes;

    private String customerFeedback;
    private String warrantyExplanation;
    private LocalDateTime handoverTime;
    private Integer mileageAtHandover;
    private Boolean customerSatisfied;
}
