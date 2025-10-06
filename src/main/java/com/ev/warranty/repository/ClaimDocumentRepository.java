package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ClaimDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClaimDocumentRepository extends JpaRepository<ClaimDocument, Integer> {

    // Find documents by claim for viewing attachments
    List<ClaimDocument> findByClaimIdOrderByUploadedAtDesc(Integer claimId);

    // Find documents by file type for filtering
    List<ClaimDocument> findByFileTypeOrderByUploadedAtDesc(String fileType);

    // Find documents uploaded by specific user
    List<ClaimDocument> findByUploadedByIdOrderByUploadedAtDesc(Integer uploadedById);

    // Find documents by claim and file type
    List<ClaimDocument> findByClaimIdAndFileTypeOrderByUploadedAtDesc(Integer claimId, String fileType);

    // Find documents uploaded in date range
    @Query("SELECT cd FROM ClaimDocument cd WHERE cd.uploadedAt BETWEEN :startDate AND :endDate ORDER BY cd.uploadedAt DESC")
    List<ClaimDocument> findByUploadDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Count documents by file type for statistics
    Long countByFileType(String fileType);

    // Find large files for storage management
    @Query("SELECT cd FROM ClaimDocument cd WHERE cd.fileSize > :sizeThreshold ORDER BY cd.fileSize DESC")
    List<ClaimDocument> findLargeFiles(@Param("sizeThreshold") Long sizeThreshold);
}
