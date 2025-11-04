package com.ev.warranty.controller;

import com.ev.warranty.model.entity.ClaimAttachment;
import com.ev.warranty.service.inter.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/claims/{claimId}/attachments")
@RequiredArgsConstructor
@Tag(name = "Claim Attachments", description = "APIs for managing claim file attachments")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping("/upload")
    @Operation(summary = "Upload attachment to claim",
               description = "Upload diagnostic files, photos, videos, or documents to a claim")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimAttachment> uploadAttachment(
            @PathVariable Integer claimId,
            @RequestParam("file") MultipartFile file) {
        try {
            ClaimAttachment attachment = fileUploadService.uploadClaimAttachment(claimId, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/upload-with-metadata")
    @Operation(summary = "Upload attachment with metadata",
               description = "Upload file with specific type and description")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimAttachment> uploadAttachmentWithMetadata(
            @PathVariable Integer claimId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) @Parameter(description = "Attachment type") ClaimAttachment.AttachmentType type,
            @RequestParam(required = false) @Parameter(description = "File description") String description) {
        try {
            ClaimAttachment attachment = fileUploadService.uploadClaimAttachment(claimId, file, type, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping
    @Operation(summary = "Get claim attachments",
               description = "Retrieve all attachments for a specific claim")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<List<ClaimAttachment>> getClaimAttachments(@PathVariable Integer claimId) {
        List<ClaimAttachment> attachments = fileUploadService.getClaimAttachments(claimId);
        return ResponseEntity.ok(attachments);
    }

    @GetMapping("/{attachmentId}")
    @Operation(summary = "Get attachment details",
               description = "Get details of a specific attachment")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimAttachment> getAttachment(
            @PathVariable Integer claimId,
            @PathVariable Integer attachmentId) {
        try {
            ClaimAttachment attachment = fileUploadService.getAttachmentById(attachmentId);
            return ResponseEntity.ok(attachment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{attachmentId}/download")
    @Operation(summary = "Download attachment file",
               description = "Download the actual file content")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ByteArrayResource> downloadAttachment(
            @PathVariable Integer claimId,
            @PathVariable Integer attachmentId) {
        try {
            ClaimAttachment attachment = fileUploadService.getAttachmentById(attachmentId);
            byte[] fileContent = fileUploadService.downloadAttachment(attachmentId);

            ByteArrayResource resource = new ByteArrayResource(fileContent);

            String contentType = attachment.getContentType();
            if (contentType == null || contentType.isBlank()) {
                try {
                    Path p = Paths.get(fileUploadService.getAttachmentFilePath(attachmentId));
                    if (Files.exists(p)) {
                        String probed = Files.probeContentType(p);
                        if (probed != null && !probed.isBlank()) {
                            contentType = probed;
                        }
                    }
                } catch (Exception ignored) {}
                if (contentType == null || contentType.isBlank()) {
                    contentType = "application/octet-stream";
                }
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                           "attachment; filename=\"" + attachment.getOriginalFileName() + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(fileContent.length)
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{attachmentId}/view")
    @Operation(summary = "View attachment file",
               description = "View/display the file content inline in browser")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ByteArrayResource> viewAttachment(
            @PathVariable Integer claimId,
            @PathVariable Integer attachmentId) {
        try {
            ClaimAttachment attachment = fileUploadService.getAttachmentById(attachmentId);
            byte[] fileContent = fileUploadService.downloadAttachment(attachmentId);

            ByteArrayResource resource = new ByteArrayResource(fileContent);

            String contentType = attachment.getContentType();
            if (contentType == null || contentType.isBlank()) {
                try {
                    Path p = Paths.get(fileUploadService.getAttachmentFilePath(attachmentId));
                    if (Files.exists(p)) {
                        String probed = Files.probeContentType(p);
                        if (probed != null && !probed.isBlank()) {
                            contentType = probed;
                        }
                    }
                } catch (Exception ignored) {}
                if (contentType == null || contentType.isBlank()) {
                    contentType = "application/octet-stream";
                }
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                           "inline; filename=\"" + attachment.getOriginalFileName() + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(fileContent.length)
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{attachmentId}/metadata")
    @Operation(summary = "Update attachment metadata",
               description = "Update description and type of an attachment")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimAttachment> updateAttachmentMetadata(
            @PathVariable Integer claimId,
            @PathVariable Integer attachmentId,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) ClaimAttachment.AttachmentType type) {
        try {
            ClaimAttachment updatedAttachment = fileUploadService.updateAttachmentMetadata(
                    attachmentId, description, type);
            return ResponseEntity.ok(updatedAttachment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{attachmentId}/replace")
    @Operation(summary = "Replace attachment file",
               description = "Replace an existing attachment with a new file")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ClaimAttachment> replaceAttachment(
            @PathVariable Integer claimId,
            @PathVariable Integer attachmentId,
            @RequestParam("file") MultipartFile newFile) {
        try {
            ClaimAttachment updatedAttachment = fileUploadService.replaceAttachment(attachmentId, newFile);
            return ResponseEntity.ok(updatedAttachment);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{attachmentId}")
    @Operation(summary = "Delete claim attachment",
               description = "Delete an attachment file and its database record")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable Integer claimId,
            @PathVariable Integer attachmentId) {
        try {
            fileUploadService.deleteAttachment(attachmentId);
            return ResponseEntity.noContent().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/config")
    @Operation(summary = "Get file upload configuration",
               description = "Get allowed file types and maximum file size")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getFileUploadConfig() {
        return ResponseEntity.ok(Map.of(
                "allowedFileTypes", fileUploadService.getAllowedFileTypes(),
                "maxFileSize", fileUploadService.getMaxFileSize(),
                "maxFileSizeMB", fileUploadService.getMaxFileSize() / (1024 * 1024)
        ));
    }
}
