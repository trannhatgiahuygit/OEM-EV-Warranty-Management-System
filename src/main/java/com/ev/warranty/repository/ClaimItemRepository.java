package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ClaimItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimItemRepository extends JpaRepository<ClaimItem, Integer> {

    List<ClaimItem> findByClaimId(Integer claimId);

    @Query("SELECT ci FROM ClaimItem ci WHERE ci.claim.id = :claimId AND ci.itemType = 'PART' AND ci.costType = 'WARRANTY'")
    List<ClaimItem> findWarrantyPartsByClaimId(@Param("claimId") Integer claimId);
}


