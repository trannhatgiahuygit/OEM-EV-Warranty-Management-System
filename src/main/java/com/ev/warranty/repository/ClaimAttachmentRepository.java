package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ClaimAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClaimAttachmentRepository extends JpaRepository<ClaimAttachment, Integer> {
    List<ClaimAttachment> findByClaimIdOrderByUploadedAtDesc(Integer claimId);

    List<ClaimAttachment> findByUploadedById(Integer uploadedById);
}
