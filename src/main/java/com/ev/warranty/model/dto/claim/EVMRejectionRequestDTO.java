package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EVMRejectionRequestDTO {

    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;

    @NotBlank(message = "Rejection notes are required")
    private String rejectionNotes;

    private String rejectedBy;

    private String customerNotificationMessage;
}
