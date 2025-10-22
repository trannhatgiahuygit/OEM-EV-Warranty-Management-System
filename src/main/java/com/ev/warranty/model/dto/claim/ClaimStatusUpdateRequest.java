package com.ev.warranty.model.dto.claim;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClaimStatusUpdateRequest {
    @NotBlank(message = "Status is required")
    private String status;
}