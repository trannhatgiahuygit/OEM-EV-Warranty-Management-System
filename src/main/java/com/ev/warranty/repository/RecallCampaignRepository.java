package com.ev.warranty.repository;

import com.ev.warranty.model.entity.RecallCampaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecallCampaignRepository extends JpaRepository<RecallCampaign, Integer> {
    
    Optional<RecallCampaign> findByCode(String code);
    boolean existsByCode(String code);
    
    Page<RecallCampaign> findByStatusContainingIgnoreCase(String status, Pageable pageable);
    Page<RecallCampaign> findByTitleContainingIgnoreCaseOrCodeContainingIgnoreCase(String title, String code, Pageable pageable);
    
    List<RecallCampaign> findByStatus(String status);
    
    @Query("SELECT rc FROM RecallCampaign rc WHERE rc.status = 'active'")
    List<RecallCampaign> findActiveCampaigns();
    
    @Query("SELECT rc FROM RecallCampaign rc WHERE rc.releasedAt IS NOT NULL AND rc.releasedAt <= :date")
    List<RecallCampaign> findCampaignsReleasedBefore(@Param("date") java.time.LocalDateTime date);
}
