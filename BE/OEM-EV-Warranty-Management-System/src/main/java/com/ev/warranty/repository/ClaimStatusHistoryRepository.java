package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ClaimStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClaimStatusHistoryRepository extends JpaRepository<ClaimStatusHistory, Integer> {
    List<ClaimStatusHistory> findByClaimIdOrderByChangedAtDesc(Integer claimId);

    @Query("SELECT csh FROM ClaimStatusHistory csh WHERE csh.claim.id = :claimId ORDER BY csh.changedAt DESC")
    List<ClaimStatusHistory> findClaimStatusHistory(@Param("claimId") Integer claimId);

    // 🆕 Count by status code
    @Query("SELECT COUNT(csh) FROM ClaimStatusHistory csh WHERE csh.claim.id = :claimId AND csh.status.code = :statusCode")
    long countByClaimIdAndStatusCode(@Param("claimId") Integer claimId, @Param("statusCode") String statusCode);
}
