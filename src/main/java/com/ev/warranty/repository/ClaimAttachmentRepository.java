package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ClaimAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimAttachmentRepository extends JpaRepository<ClaimAttachment, Integer> {

    /**
     * Find all attachments for a specific claim, ordered by upload date descending
     */
    List<ClaimAttachment> findByClaimIdOrderByUploadDateDesc(Integer claimId);

    /**
     * Find attachments by claim ID and attachment type
     */
    List<ClaimAttachment> findByClaimIdAndAttachmentType(Integer claimId, ClaimAttachment.AttachmentType attachmentType);

    /**
     * Find attachments by uploaded user
     */
    List<ClaimAttachment> findByUploadedByOrderByUploadDateDesc(String uploadedBy);

    /**
     * Count attachments for a claim
     */
    long countByClaimId(Integer claimId);

    /**
     * Get total file size for a claim
     */
    @Query("SELECT COALESCE(SUM(ca.fileSize), 0) FROM ClaimAttachment ca WHERE ca.claimId = :claimId")
    Long getTotalFileSizeByClaimId(@Param("claimId") Integer claimId);

    /**
     * Find attachments by file type
     */
    List<ClaimAttachment> findByFileTypeIgnoreCase(String fileType);

    /**
     * Delete all attachments for a claim (used when claim is deleted)
     */
    void deleteByClaimId(Integer claimId);
}
