package com.ev.warranty.service.inter;


import com.ev.warranty.model.dto.claim.EVMClaimSummaryDTO;
import com.ev.warranty.model.dto.claim.EVMClaimFilterRequestDTO;
import org.springframework.data.domain.Page;

public interface EVMClaimService {

    /**
     * View all warranty claims across all service centers
     * Main API for EVM staff oversight
     */
    Page<EVMClaimSummaryDTO> getAllClaims(EVMClaimFilterRequestDTO filter);
}