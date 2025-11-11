package com.ev.warranty.model.dto.claim;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClaimStatusHistoryDto {
    private Integer id;
    private String statusCode;
    private String statusLabel;
    private LocalDateTime changedAt;
    private UserInfoDto changedBy;
    private String note;
}
