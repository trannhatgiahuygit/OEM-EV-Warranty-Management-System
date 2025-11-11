package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerNotificationRequest {
    @NotNull(message = "Claim ID is required")
    private Integer claimId;

    @NotBlank(message = "Notification type is required")
    private String notificationType;

    @NotEmpty(message = "At least one channel is required")
    private List<String> channels;

    @NotBlank(message = "Message is required")
    private String message;

    private Boolean includeRepairSummary;
}