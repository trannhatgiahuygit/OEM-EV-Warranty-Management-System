package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClaimRepository extends JpaRepository<Claim, Integer> {
    Optional<Claim> findByClaimNumber(String claimNumber);

    List<Claim> findByCustomerId(Integer customerId);

    List<Claim> findByVehicleId(Integer vehicleId);

    List<Claim> findByAssignedTechnicianId(Integer technicianId);

    List<Claim> findByCreatedById(Integer createdById);

    @Query("SELECT c FROM Claim c WHERE c.status.code = :statusCode")
    List<Claim> findByStatusCode(@Param("statusCode") String statusCode);

    @Query("SELECT c FROM Claim c WHERE c.assignedTechnician.id = :technicianId AND c.status.code IN ('OPEN', 'IN_PROGRESS')")
    List<Claim> findActiveTechnicianClaims(@Param("technicianId") Integer technicianId);

    @Query("SELECT c FROM Claim c WHERE c.status.code IN ('OPEN', 'IN_PROGRESS') ORDER BY c.createdAt ASC")
    List<Claim> findUnassignedClaims();

    @Query("SELECT c FROM Claim c WHERE c.status.code = 'PENDING_APPROVAL' ORDER BY c.createdAt ASC")
    List<Claim> findClaimsPendingApproval();

    @Query("SELECT c FROM Claim c WHERE c.vehicle.vin = :vin ORDER BY c.createdAt DESC")
    List<Claim> findByVehicleVinOrderByCreatedAtDesc(@Param("vin") String vin);

    boolean existsByClaimNumber(String claimNumber);
}
