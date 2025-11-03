package com.ev.warranty.model.dto.notification;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmailNotificationRequestDTO {
    @Email
    @NotBlank
    private String recipientEmail;

    @NotBlank
    private String subject;

    @NotBlank
    private String body;

    private Integer claimId; // optional
}

