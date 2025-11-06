package com.ev.warranty.model.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AppointmentUpdateRequestDTO {

    @Future(message = "New scheduled time must be in the future")
    private LocalDateTime scheduledAt; // Optional - to reschedule

    @Pattern(regexp = "^(scheduled|in_progress|completed|cancelled)$",
            message = "Status must be: scheduled, in_progress, completed, or cancelled")
    private String status; // Optional - to update status

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes; // Optional - to add/update notes

    private Boolean notifyCustomer; // Optional - whether to notify customer of changes
}
