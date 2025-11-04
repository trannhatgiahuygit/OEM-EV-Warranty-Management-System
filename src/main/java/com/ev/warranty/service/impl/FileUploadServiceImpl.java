package com.ev.warranty.service.impl;

import com.ev.warranty.model.entity.ClaimAttachment;
import com.ev.warranty.repository.ClaimAttachmentRepository;
import com.ev.warranty.service.inter.FileUploadService;
import com.ev.warranty.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FileUploadServiceImpl implements FileUploadService {

    private final ClaimAttachmentRepository claimAttachmentRepository;

    @Value("${file.upload.dir:uploads/attachments}")
    private String uploadDir;

    @Value("${file.upload.max-size:10485760}") // 10MB default
    private long maxFileSize;

    private final List<String> allowedFileTypes = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp",
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain", "text/csv",
        "video/mp4", "video/avi", "video/mov", "video/wmv",
        "application/zip", "application/x-zip-compressed"
    );

    @Override
    public ClaimAttachment uploadClaimAttachment(Integer claimId, MultipartFile file) throws IOException {
        return uploadClaimAttachment(claimId, file, detectAttachmentType(file), null);
    }

    @Override
    public ClaimAttachment uploadClaimAttachment(Integer claimId, MultipartFile file,
                                               ClaimAttachment.AttachmentType type, String description) throws IOException {

        if (!validateFile(file)) {
            throw new IllegalArgumentException("Invalid file type or size");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFileName = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String uniqueFileName = UUID.randomUUID().toString() + "_" + claimId + fileExtension;
        Path filePath = uploadPath.resolve(uniqueFileName);

        // Save file to disk
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Save attachment record to database
        ClaimAttachment attachment = ClaimAttachment.builder()
                .claimId(claimId)
                .fileName(uniqueFileName)
                .originalFileName(originalFileName)
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .fileType(fileExtension.substring(1)) // Remove the dot
                .contentType(file.getContentType())
                .description(description)
                .uploadedBy(getCurrentUsername())
                .uploadDate(LocalDateTime.now())
                .attachmentType(type != null ? type : detectAttachmentType(file))
                .build();

        return claimAttachmentRepository.save(attachment);
    }

    @Override
    public List<ClaimAttachment> getClaimAttachments(Integer claimId) {
        return claimAttachmentRepository.findByClaimIdOrderByUploadDateDesc(claimId);
    }

    @Override
    public ClaimAttachment getAttachmentById(Integer attachmentId) {
        return claimAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found with id: " + attachmentId));
    }

    @Override
    public void deleteAttachment(Integer attachmentId) throws IOException {
        ClaimAttachment attachment = getAttachmentById(attachmentId);

        // Delete file from disk
        Path filePath = Paths.get(attachment.getFilePath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        } else {
            // Try resolving relative path fallback
            Path resolved = resolveToProjectUploads(attachment.getFilePath());
            if (resolved != null && Files.exists(resolved)) {
                Files.delete(resolved);
            }
        }

        // Delete record from database
        claimAttachmentRepository.delete(attachment);

        log.info("Deleted attachment: {} for claim: {}", attachmentId, attachment.getClaimId());
    }

    @Override
    public ClaimAttachment updateAttachmentMetadata(Integer attachmentId, String description,
                                                   ClaimAttachment.AttachmentType type) {
        ClaimAttachment attachment = getAttachmentById(attachmentId);

        if (description != null) {
            attachment.setDescription(description);
        }
        if (type != null) {
            attachment.setAttachmentType(type);
        }
        attachment.setUpdatedDate(LocalDateTime.now());

        return claimAttachmentRepository.save(attachment);
    }

    @Override
    public ClaimAttachment replaceAttachment(Integer attachmentId, MultipartFile newFile) throws IOException {
        ClaimAttachment existingAttachment = getAttachmentById(attachmentId);

        if (!validateFile(newFile)) {
            throw new IllegalArgumentException("Invalid file type or size");
        }

        // Delete old file
        Path oldFilePath = Paths.get(existingAttachment.getFilePath());
        if (Files.exists(oldFilePath)) {
            Files.delete(oldFilePath);
        } else {
            Path resolved = resolveToProjectUploads(existingAttachment.getFilePath());
            if (resolved != null && Files.exists(resolved)) {
                Files.delete(resolved);
            }
        }

        // Save new file
        String originalFileName = newFile.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String uniqueFileName = UUID.randomUUID().toString() + "_" + existingAttachment.getClaimId() + fileExtension;
        Path newFilePath = Paths.get(uploadDir).resolve(uniqueFileName);
        Files.copy(newFile.getInputStream(), newFilePath, StandardCopyOption.REPLACE_EXISTING);

        // Update attachment record
        existingAttachment.setFileName(uniqueFileName);
        existingAttachment.setOriginalFileName(originalFileName);
        existingAttachment.setFilePath(newFilePath.toString());
        existingAttachment.setFileSize(newFile.getSize());
        existingAttachment.setFileType(fileExtension.substring(1));
        existingAttachment.setContentType(newFile.getContentType());
        existingAttachment.setUpdatedDate(LocalDateTime.now());
        existingAttachment.setAttachmentType(detectAttachmentType(newFile));

        return claimAttachmentRepository.save(existingAttachment);
    }

    @Override
    public byte[] downloadAttachment(Integer attachmentId) throws IOException {
        ClaimAttachment attachment = getAttachmentById(attachmentId);
        Path filePath = Paths.get(attachment.getFilePath());

        if (!Files.exists(filePath)) {
            // Try to resolve leading-slash or absolute-looking paths into project-relative uploads dir
            Path resolved = resolveToProjectUploads(attachment.getFilePath());
            if (resolved != null && Files.exists(resolved)) {
                filePath = resolved;
            } else {
                log.warn("Attachment file not found on disk. id={}, path={}", attachmentId, attachment.getFilePath());
                throw new NotFoundException("File not found: " + attachment.getFileName());
            }
        }

        return Files.readAllBytes(filePath);
    }

    @Override
    public String getAttachmentFilePath(Integer attachmentId) {
        ClaimAttachment attachment = getAttachmentById(attachmentId);
        return attachment.getFilePath();
    }

    @Override
    public boolean validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        // Check file size
        if (file.getSize() > maxFileSize) {
            log.warn("File size {} exceeds maximum size {}", file.getSize(), maxFileSize);
            return false;
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !allowedFileTypes.contains(contentType.toLowerCase())) {
            log.warn("File type {} is not allowed", contentType);
            return false;
        }

        return true;
    }

    @Override
    public List<String> getAllowedFileTypes() {
        return allowedFileTypes;
    }

    @Override
    public long getMaxFileSize() {
        return maxFileSize;
    }

    private ClaimAttachment.AttachmentType detectAttachmentType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null) {
            return ClaimAttachment.AttachmentType.OTHER;
        }

        if (contentType.startsWith("image/")) {
            return ClaimAttachment.AttachmentType.PHOTO;
        } else if (contentType.startsWith("video/")) {
            return ClaimAttachment.AttachmentType.VIDEO;
        } else if (contentType.equals("application/pdf") ||
                   contentType.contains("document") ||
                   contentType.contains("text")) {
            return ClaimAttachment.AttachmentType.DOCUMENT;
        } else {
            return ClaimAttachment.AttachmentType.OTHER;
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf('.') == -1) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.'));
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }

    // Helper: resolve DB-stored path like "/uploads/claims/CLM-2024-004/file.txt" to project-relative path
    private Path resolveToProjectUploads(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) return null;
        String normalized = storedPath.replace('\\', '/');
        if (normalized.startsWith("/")) {
            normalized = normalized.substring(1); // drop leading slash
        }
        // If already starts with "uploads/", resolve relative to working dir
        if (normalized.startsWith("uploads/")) {
            return Paths.get(normalized).normalize();
        }
        // Otherwise, attempt to resolve under configured uploadDir
        try {
            return Paths.get(uploadDir).resolve(Paths.get(normalized).getFileName()).normalize();
        } catch (Exception e) {
            return null;
        }
    }
}
