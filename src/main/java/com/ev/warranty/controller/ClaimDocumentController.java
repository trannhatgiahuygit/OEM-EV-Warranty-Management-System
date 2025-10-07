package com.ev.warranty.controller;

import com.ev.warranty.model.dto.ClaimDocumentDto;
import com.ev.warranty.service.ClaimDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/claim-documents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ClaimDocumentController {

    private final ClaimDocumentService claimDocumentService;

    // Upload document for warranty claim
    @PostMapping("/upload")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ClaimDocumentDto> uploadDocument(
            @RequestParam Integer claimId,
            @RequestParam MultipartFile file,
            @RequestParam String fileType,
            @RequestParam(required = false) String description) {
        try {
            ClaimDocumentDto document = claimDocumentService.uploadDocument(claimId, file, fileType, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(document);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get documents by claim ID
    @GetMapping("/claim/{claimId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimDocumentDto>> getDocumentsByClaim(@PathVariable Integer claimId) {
        List<ClaimDocumentDto> documents = claimDocumentService.getDocumentsByClaim(claimId);
        return ResponseEntity.ok(documents);
    }

    // Get document by ID
    @GetMapping("/{documentId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ClaimDocumentDto> getDocumentById(@PathVariable Integer documentId) {
        try {
            ClaimDocumentDto document = claimDocumentService.getDocumentById(documentId);
            return ResponseEntity.ok(document);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get documents by file type
    @GetMapping("/type/{fileType}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimDocumentDto>> getDocumentsByFileType(@PathVariable String fileType) {
        List<ClaimDocumentDto> documents = claimDocumentService.getDocumentsByFileType(fileType);
        return ResponseEntity.ok(documents);
    }

    // Download document
    @GetMapping("/{documentId}/download")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Integer documentId) {
        try {
            String filePath = claimDocumentService.getDocumentFilePath(documentId);
            ClaimDocumentDto document = claimDocumentService.getDocumentById(documentId);

            Path path = Paths.get(filePath);
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(document.getMimeType()))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getOriginalFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Delete document
    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Integer documentId) {
        try {
            claimDocumentService.deleteDocument(documentId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
