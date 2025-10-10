package com.ev.warranty.model.dto.claim;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClaimAttachmentDto {
    private Integer id;
    private String filePath;
    private String fileType;
    private LocalDateTime uploadedAt;
    private UserInfoDto uploadedBy;
}
