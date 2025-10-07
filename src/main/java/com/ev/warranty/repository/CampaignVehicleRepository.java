package com.ev.warranty.repository;

import com.ev.warranty.model.entity.CampaignVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignVehicleRepository extends JpaRepository<CampaignVehicle, Integer> {

    // Find campaign vehicles by campaign ID
    List<CampaignVehicle> findByCampaignIdOrderByCreatedAtDesc(Integer campaignId);

    // Find campaign vehicles by vehicle ID
    List<CampaignVehicle> findByVehicleIdOrderByCreatedAtDesc(Integer vehicleId);

    // Find campaign vehicles by status
    List<CampaignVehicle> findByStatusOrderByCreatedAtDesc(String status);

    // Find campaign vehicles by campaign and status
    List<CampaignVehicle> findByCampaignIdAndStatusOrderByCreatedAtDesc(Integer campaignId, String status);

    // Find campaign vehicles assigned to technician
    List<CampaignVehicle> findByAssignedTechnicianIdOrderByScheduledDateAsc(Integer technicianId);

    // Find campaign vehicles handled by SC Staff
    List<CampaignVehicle> findByScStaffIdOrderByCreatedAtDesc(Integer scStaffId);

    // Check if vehicle is already in campaign
    Optional<CampaignVehicle> findByCampaignIdAndVehicleId(Integer campaignId, Integer vehicleId);

    // Find vehicles scheduled for specific date range
    @Query("SELECT cv FROM CampaignVehicle cv WHERE cv.scheduledDate BETWEEN :startDate AND :endDate ORDER BY cv.scheduledDate ASC")
    List<CampaignVehicle> findByScheduledDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Find completed campaign vehicles for reporting
    @Query("SELECT cv FROM CampaignVehicle cv WHERE cv.status = 'COMPLETED' AND cv.completedDate BETWEEN :startDate AND :endDate ORDER BY cv.completedDate DESC")
    List<CampaignVehicle> findCompletedInDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Count vehicles by campaign and status for progress tracking
    Long countByCampaignIdAndStatus(Integer campaignId, String status);

    // Find overdue scheduled vehicles
    @Query("SELECT cv FROM CampaignVehicle cv WHERE cv.status = 'SCHEDULED' AND cv.scheduledDate < :currentDate ORDER BY cv.scheduledDate ASC")
    List<CampaignVehicle> findOverdueScheduled(@Param("currentDate") LocalDateTime currentDate);

    // Find vehicles needing notification
    @Query("SELECT cv FROM CampaignVehicle cv WHERE cv.status = 'IDENTIFIED' AND cv.notificationSentDate IS NULL ORDER BY cv.createdAt ASC")
    List<CampaignVehicle> findVehiclesNeedingNotification();
}
