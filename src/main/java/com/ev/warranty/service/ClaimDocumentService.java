package com.ev.warranty.service;

import com.ev.warranty.model.dto.ClaimDocumentDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ClaimDocumentService {

    // Upload document for claim
    ClaimDocumentDto uploadDocument(Integer claimId, MultipartFile file, String fileType, String description);

    // Get documents by claim
    List<ClaimDocumentDto> getDocumentsByClaim(Integer claimId);

    // Get document by ID
    ClaimDocumentDto getDocumentById(Integer documentId);

    // Get documents by file type
    List<ClaimDocumentDto> getDocumentsByFileType(String fileType);

    // Delete document
    void deleteDocument(Integer documentId);

    // Download document (returns file path for controller to handle)
    String getDocumentFilePath(Integer documentId);
}
