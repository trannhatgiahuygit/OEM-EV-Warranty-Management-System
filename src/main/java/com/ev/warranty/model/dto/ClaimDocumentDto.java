package com.ev.warranty.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimDocumentDto {
    private Integer id;
    private Integer claimId;
    private String claimNumber;
    private String fileName;
    private String originalFileName;
    private String filePath;
    private String fileType;
    private String mimeType;
    private Long fileSize;
    private String description;
    private Integer uploadedById;
    private String uploadedByName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime uploadedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // For uploading document request
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UploadRequest {
        private Integer claimId;
        private String fileType;
        private String description;
        // File will be handled by MultipartFile in controller
    }
}
