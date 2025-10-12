package com.ev.warranty.service.impl;

import com.ev.warranty.exception.BadRequestException;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.ClaimAttachment;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.ClaimAttachmentRepository;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.service.inter.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileUploadServiceImpl implements FileUploadService {

    private final ClaimAttachmentRepository claimAttachmentRepository;
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final List<String> ALLOWED_FILE_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp",
        "video/mp4", "video/avi", "video/mov", "video/wmv",
        "application/pdf", "text/plain", "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel"
    );

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    public ClaimAttachment uploadClaimAttachment(Integer claimId, MultipartFile file) throws IOException {
        // Validate file
        validateFile(file);

        // Check if claim exists
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new BadRequestException("Claim not found"));

        // Get current user
        User currentUser = getCurrentUser();

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir, "claims", claim.getClaimNumber());
        Files.createDirectories(uploadPath);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID() + fileExtension;

        // Save file to disk
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath);

        // Create attachment record
        ClaimAttachment attachment = ClaimAttachment.builder()
                .claim(claim)
                .filePath(filePath.toString())
                .fileType(file.getContentType())
                .uploadedBy(currentUser)
                .build();

        return claimAttachmentRepository.save(attachment);
    }

    public List<ClaimAttachment> getClaimAttachments(Integer claimId) {
        return claimAttachmentRepository.findByClaimIdOrderByUploadedAtDesc(claimId);
    }

    public void deleteAttachment(Integer attachmentId) throws IOException {
        ClaimAttachment attachment = claimAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BadRequestException("Attachment not found"));

        // Delete file from disk
        Path filePath = Paths.get(attachment.getFilePath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }

        // Delete database record
        claimAttachmentRepository.delete(attachment);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds maximum allowed size (50MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_FILE_TYPES.contains(contentType)) {
            throw new BadRequestException("File type not allowed: " + contentType);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        return (lastDotIndex == -1) ? "" : filename.substring(lastDotIndex);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = auth.getName();
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
