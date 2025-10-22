package com.ev.warranty.model.dto.claim;

import lombok.Data;
import java.util.List;

@Data
public class CustomerNotificationRequest {
    private Integer claimId;
    private String notificationType;
    private List<String> channels;
    private String message;
    private Boolean includeRepairSummary;
}