package com.ev.warranty.model.dto.notification;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SmsNotificationRequestDTO {
    @NotBlank
    private String recipientPhone;

    @NotBlank
    private String message;

    private Integer claimId; // optional
}

