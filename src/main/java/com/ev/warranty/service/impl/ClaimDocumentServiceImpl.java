package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.ClaimDocumentDto;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.ClaimDocument;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.ClaimDocumentRepository;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.service.ClaimDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClaimDocumentServiceImpl implements ClaimDocumentService {

    private final ClaimDocumentRepository claimDocumentRepository;
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public ClaimDocumentDto uploadDocument(Integer claimId, MultipartFile file, String fileType, String description) {
        Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new RuntimeException("Claim not found with ID: " + claimId));

        // Get current user from security context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User uploadedBy = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found: " + username));

        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, "claims", claimId.toString());
            Files.createDirectories(uploadPath);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadPath.resolve(uniqueFilename);

            // Save file to disk
            Files.copy(file.getInputStream(), filePath);

            // Create document entity
            ClaimDocument document = ClaimDocument.builder()
                .claim(claim)
                .fileName(uniqueFilename)
                .originalFileName(originalFilename)
                .filePath(filePath.toString())
                .fileType(fileType)
                .mimeType(file.getContentType())
                .fileSize(file.getSize())
                .description(description)
                .uploadedBy(uploadedBy)
                .uploadedAt(LocalDateTime.now())
                .build();

            ClaimDocument savedDocument = claimDocumentRepository.save(document);
            return convertToDto(savedDocument);

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimDocumentDto> getDocumentsByClaim(Integer claimId) {
        List<ClaimDocument> documents = claimDocumentRepository.findByClaimIdOrderByUploadedAtDesc(claimId);
        return documents.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ClaimDocumentDto getDocumentById(Integer documentId) {
        ClaimDocument document = claimDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));
        return convertToDto(document);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClaimDocumentDto> getDocumentsByFileType(String fileType) {
        List<ClaimDocument> documents = claimDocumentRepository.findByFileTypeOrderByUploadedAtDesc(fileType);
        return documents.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public void deleteDocument(Integer documentId) {
        ClaimDocument document = claimDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));

        try {
            // Delete physical file
            Path filePath = Paths.get(document.getFilePath());
            Files.deleteIfExists(filePath);

            // Delete database record
            claimDocumentRepository.delete(document);

        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String getDocumentFilePath(Integer documentId) {
        ClaimDocument document = claimDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));
        return document.getFilePath();
    }

    private ClaimDocumentDto convertToDto(ClaimDocument document) {
        return ClaimDocumentDto.builder()
            .id(document.getId())
            .claimId(document.getClaim().getId())
            .claimNumber(document.getClaim().getClaimNumber())
            .fileName(document.getFileName())
            .originalFileName(document.getOriginalFileName())
            .filePath(document.getFilePath())
            .fileType(document.getFileType())
            .mimeType(document.getMimeType())
            .fileSize(document.getFileSize())
            .description(document.getDescription())
            .uploadedById(document.getUploadedBy().getId())
            .uploadedByName(document.getUploadedBy().getFullname())
            .uploadedAt(document.getUploadedAt())
            .createdAt(document.getCreatedAt())
            .updatedAt(document.getUpdatedAt())
            .build();
    }
}
