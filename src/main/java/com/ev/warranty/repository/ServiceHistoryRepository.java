package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ServiceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ServiceHistoryRepository extends JpaRepository<ServiceHistory, Integer> {

    // Find service history by vehicle for complete service record
    List<ServiceHistory> findByVehicleIdOrderByServiceDateDesc(Integer vehicleId);

    // Find service history by technician for performance tracking
    List<ServiceHistory> findByTechnicianIdOrderByServiceDateDesc(Integer technicianId);

    // Find service history by SC Staff for workload tracking
    List<ServiceHistory> findByScStaffIdOrderByServiceDateDesc(Integer scStaffId);

    // Find service history by service type
    List<ServiceHistory> findByServiceTypeOrderByServiceDateDesc(String serviceType);

    // Find service history by status
    List<ServiceHistory> findByStatusOrderByServiceDateDesc(String status);

    // Find service history by part for part tracking
    List<ServiceHistory> findByPartIdOrderByServiceDateDesc(Integer partId);

    // Find service history by claim for warranty tracking
    List<ServiceHistory> findByClaimIdOrderByServiceDateDesc(Integer claimId);

    // Find service history by date range for reporting
    @Query("SELECT sh FROM ServiceHistory sh WHERE sh.serviceDate BETWEEN :startDate AND :endDate ORDER BY sh.serviceDate DESC")
    List<ServiceHistory> findByServiceDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Find scheduled services for upcoming work
    @Query("SELECT sh FROM ServiceHistory sh WHERE sh.status = 'SCHEDULED' AND sh.serviceDate >= :currentDate ORDER BY sh.serviceDate ASC")
    List<ServiceHistory> findScheduledServices(@Param("currentDate") LocalDateTime currentDate);

    // Find overdue scheduled services
    @Query("SELECT sh FROM ServiceHistory sh WHERE sh.status = 'SCHEDULED' AND sh.serviceDate < :currentDate ORDER BY sh.serviceDate ASC")
    List<ServiceHistory> findOverdueScheduledServices(@Param("currentDate") LocalDateTime currentDate);

    // Count services by technician and date range for performance metrics
    @Query("SELECT COUNT(sh) FROM ServiceHistory sh WHERE sh.technician.id = :technicianId AND sh.serviceDate BETWEEN :startDate AND :endDate AND sh.status = 'COMPLETED'")
    Long countCompletedServicesByTechnicianInDateRange(@Param("technicianId") Integer technicianId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
