package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Integer> {

    // Find claim by claim number
    Optional<Claim> findByClaimNumber(String claimNumber);

    // Find claims by vehicle for service history
    List<Claim> findByVehicleIdOrderByClaimDateDesc(Integer vehicleId);

    // Find claims by customer
    List<Claim> findByCustomerIdOrderByClaimDateDesc(Integer customerId);

    // Find claims by status for SC Staff workflow
    List<Claim> findByStatusOrderByClaimDateDesc(String status);

    // Find claims assigned to specific technician
    List<Claim> findByAssignedTechnicianIdOrderByClaimDateDesc(Integer technicianId);

    // Find claims created by specific SC Staff
    List<Claim> findByScStaffIdOrderByClaimDateDesc(Integer scStaffId);

    // Find claims by priority for urgent handling
    List<Claim> findByPriorityOrderByClaimDateDesc(String priority);

    // Find claims by status and priority
    List<Claim> findByStatusAndPriorityOrderByClaimDateDesc(String status, String priority);

    // Find pending claims older than specified days
    @Query("SELECT c FROM Claim c WHERE c.status = 'PENDING' AND c.claimDate < :cutoffDate")
    List<Claim> findPendingClaimsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    // Find claims in progress for tracking
    @Query("SELECT c FROM Claim c WHERE c.status IN ('APPROVED', 'IN_PROGRESS') ORDER BY c.claimDate ASC")
    List<Claim> findActiveClaimsInProgress();

    // Count claims by status for reporting
    Long countByStatus(String status);

    // Count claims by technician for workload management
    Long countByAssignedTechnicianIdAndStatusIn(Integer technicianId, List<String> statuses);

    // Find claims requiring parts
    @Query("SELECT c FROM Claim c WHERE c.replacementPartNumber IS NOT NULL AND c.status IN ('APPROVED', 'IN_PROGRESS')")
    List<Claim> findClaimsRequiringParts();

    // Find claims by date range for reporting
    @Query("SELECT c FROM Claim c WHERE c.claimDate BETWEEN :startDate AND :endDate ORDER BY c.claimDate DESC")
    List<Claim> findClaimsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Find claims by failed part number for trend analysis
    List<Claim> findByFailedPartNumberOrderByClaimDateDesc(String failedPartNumber);
}
