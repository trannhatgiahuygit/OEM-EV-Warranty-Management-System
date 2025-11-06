package com.ev.warranty.service.inter;

import com.ev.warranty.model.entity.ClaimAttachment;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface FileUploadService {

    /**
     * Upload a file attachment to a claim
     */
    ClaimAttachment uploadClaimAttachment(Integer claimId, MultipartFile file) throws IOException;

    /**
     * Upload a file attachment with additional metadata
     */
    ClaimAttachment uploadClaimAttachment(Integer claimId, MultipartFile file,
                                        ClaimAttachment.AttachmentType type, String description) throws IOException;

    /**
     * Get all attachments for a specific claim
     */
    List<ClaimAttachment> getClaimAttachments(Integer claimId);

    /**
     * Get a specific attachment by ID
     */
    ClaimAttachment getAttachmentById(Integer attachmentId);

    /**
     * Delete an attachment
     */
    void deleteAttachment(Integer attachmentId) throws IOException;

    /**
     * Update attachment metadata (description, type, etc.)
     */
    ClaimAttachment updateAttachmentMetadata(Integer attachmentId, String description,
                                           ClaimAttachment.AttachmentType type);

    /**
     * Replace an existing attachment with a new file
     */
    ClaimAttachment replaceAttachment(Integer attachmentId, MultipartFile newFile) throws IOException;

    /**
     * Download an attachment file
     */
    byte[] downloadAttachment(Integer attachmentId) throws IOException;

    /**
     * Get attachment file path
     */
    String getAttachmentFilePath(Integer attachmentId);

    /**
     * Validate file type and size
     */
    boolean validateFile(MultipartFile file);

    /**
     * Get allowed file types
     */
    List<String> getAllowedFileTypes();

    /**
     * Get maximum file size
     */
    long getMaxFileSize();
}
