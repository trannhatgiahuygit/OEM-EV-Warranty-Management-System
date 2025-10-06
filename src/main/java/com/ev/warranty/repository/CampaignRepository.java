package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Integer> {

    // Find campaign by campaign number
    Optional<Campaign> findByCampaignNumber(String campaignNumber);

    // Find campaigns by status
    List<Campaign> findByStatusOrderByStartDateDesc(String status);

    // Find campaigns by type
    List<Campaign> findByTypeOrderByStartDateDesc(String type);

    // Find campaigns by severity
    List<Campaign> findBySeverityOrderByStartDateDesc(String severity);

    // Find active campaigns
    @Query("SELECT c FROM Campaign c WHERE c.status = 'ACTIVE' AND c.startDate <= :currentDate AND (c.endDate IS NULL OR c.endDate >= :currentDate) ORDER BY c.severity DESC, c.startDate ASC")
    List<Campaign> findActiveCampaigns(@Param("currentDate") LocalDateTime currentDate);

    // Find campaigns affecting specific model
    @Query("SELECT c FROM Campaign c WHERE c.affectedModels LIKE CONCAT('%', :model, '%') ORDER BY c.startDate DESC")
    List<Campaign> findCampaignsAffectingModel(@Param("model") String model);

    // Find campaigns affecting specific year
    @Query("SELECT c FROM Campaign c WHERE c.affectedYears LIKE CONCAT('%', :year, '%') ORDER BY c.startDate DESC")
    List<Campaign> findCampaignsAffectingYear(@Param("year") String year);

    // Find campaigns starting in date range
    @Query("SELECT c FROM Campaign c WHERE c.startDate BETWEEN :startDate AND :endDate ORDER BY c.startDate DESC")
    List<Campaign> findCampaignsByStartDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Find campaigns ending soon
    @Query("SELECT c FROM Campaign c WHERE c.status = 'ACTIVE' AND c.endDate IS NOT NULL AND c.endDate BETWEEN :currentDate AND :futureDate ORDER BY c.endDate ASC")
    List<Campaign> findCampaignsEndingSoon(@Param("currentDate") LocalDateTime currentDate, @Param("futureDate") LocalDateTime futureDate);

    // Find overdue campaigns (should have ended but still active)
    @Query("SELECT c FROM Campaign c WHERE c.status = 'ACTIVE' AND c.endDate IS NOT NULL AND c.endDate < :currentDate ORDER BY c.endDate ASC")
    List<Campaign> findOverdueCampaigns(@Param("currentDate") LocalDateTime currentDate);

    // Count campaigns by status for reporting
    Long countByStatus(String status);

    // Count campaigns by type for reporting
    Long countByType(String type);

    // Find incomplete campaigns (total affected > completed)
    @Query("SELECT c FROM Campaign c WHERE c.status = 'ACTIVE' AND c.completedVehicles < c.totalAffectedVehicles ORDER BY c.startDate ASC")
    List<Campaign> findIncompleteCampaigns();

    // Search campaigns by title or description
    @Query("SELECT c FROM Campaign c WHERE LOWER(c.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(c.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY c.startDate DESC")
    List<Campaign> searchCampaigns(@Param("searchTerm") String searchTerm);
}
