package com.ev.warranty.controller;

import com.ev.warranty.model.entity.ClaimAttachment;
import com.ev.warranty.service.inter.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/claims/{claimId}/attachments")
@RequiredArgsConstructor
@Tag(name = "Claim Attachments", description = "APIs for managing claim file attachments")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping("/upload")
    @Operation(summary = "Upload attachment to claim",
               description = "Upload diagnostic files, photos, videos, or documents to a claim")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN')")
    public ResponseEntity<ClaimAttachment> uploadAttachment(
            @PathVariable Integer claimId,
            @RequestParam("file") MultipartFile file) {
        try {
            ClaimAttachment attachment = fileUploadService.uploadClaimAttachment(claimId, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @Operation(summary = "Get claim attachments",
               description = "Retrieve all attachments for a specific claim")
    public ResponseEntity<List<ClaimAttachment>> getClaimAttachments(@PathVariable Integer claimId) {
        List<ClaimAttachment> attachments = fileUploadService.getClaimAttachments(claimId);
        return ResponseEntity.ok(attachments);
    }

    @DeleteMapping("/{attachmentId}")
    @Operation(summary = "Delete claim attachment",
               description = "Delete an attachment file and its database record")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN')")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable Integer claimId,
            @PathVariable Integer attachmentId) {
        try {
            fileUploadService.deleteAttachment(attachmentId);
            return ResponseEntity.noContent().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
