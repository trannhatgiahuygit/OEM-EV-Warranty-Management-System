package com.ev.warranty.repository;

import com.ev.warranty.model.entity.CampaignVehicle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignVehicleRepository extends JpaRepository<CampaignVehicle, Integer> {
    
    List<CampaignVehicle> findByCampaignId(Integer campaignId);
    Page<CampaignVehicle> findByCampaignId(Integer campaignId, Pageable pageable);
    
    List<CampaignVehicle> findByVehicleId(Integer vehicleId);
    
    Optional<CampaignVehicle> findByCampaignIdAndVehicleId(Integer campaignId, Integer vehicleId);
    
    @Query("SELECT cv FROM CampaignVehicle cv WHERE cv.campaign.id = :campaignId AND cv.notified = true")
    List<CampaignVehicle> findNotifiedVehiclesByCampaignId(@Param("campaignId") Integer campaignId);
    
    @Query("SELECT cv FROM CampaignVehicle cv WHERE cv.campaign.id = :campaignId AND cv.processed = true")
    List<CampaignVehicle> findProcessedVehiclesByCampaignId(@Param("campaignId") Integer campaignId);
    
    @Query("SELECT cv FROM CampaignVehicle cv WHERE cv.campaign.id = :campaignId AND cv.processed = false")
    List<CampaignVehicle> findPendingVehiclesByCampaignId(@Param("campaignId") Integer campaignId);
    
    @Query("SELECT COUNT(cv) FROM CampaignVehicle cv WHERE cv.campaign.id = :campaignId")
    Long countByCampaignId(@Param("campaignId") Integer campaignId);
    
    @Query("SELECT COUNT(cv) FROM CampaignVehicle cv WHERE cv.campaign.id = :campaignId AND cv.notified = true")
    Long countNotifiedByCampaignId(@Param("campaignId") Integer campaignId);
    
    @Query("SELECT COUNT(cv) FROM CampaignVehicle cv WHERE cv.campaign.id = :campaignId AND cv.processed = true")
    Long countProcessedByCampaignId(@Param("campaignId") Integer campaignId);
}
