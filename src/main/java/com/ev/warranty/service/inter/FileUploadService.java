package com.ev.warranty.service.inter;

import com.ev.warranty.model.entity.ClaimAttachment;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface FileUploadService {
    public ClaimAttachment uploadClaimAttachment(Integer claimId, MultipartFile file) throws IOException;
    public List<ClaimAttachment> getClaimAttachments(Integer claimId);
    public void deleteAttachment(Integer attachmentId) throws IOException;

}
