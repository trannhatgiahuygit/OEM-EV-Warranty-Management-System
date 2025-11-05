package com.ev.warranty.model.dto.claim;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClaimAttachmentDto {
    private Integer id;
    private String filePath;
    private String fileName;
    private String originalFileName;
    private String fileType;
    private Long fileSize;
    private String contentType;
    private String downloadUrl;
    private String viewUrl;
    private LocalDateTime uploadedAt;
    private UserInfoDto uploadedBy;
}
