package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    // Basic finder methods
    List<Appointment> findByVehicleIdOrderByScheduledAtDesc(Integer vehicleId);
    List<Appointment> findByClaimIdOrderByScheduledAt(Integer claimId);
    List<Appointment> findByStatusOrderByScheduledAt(String status);
    List<Appointment> findByScheduledAtBetweenOrderByScheduledAt(LocalDateTime start, LocalDateTime end);
    List<Appointment> findByCreatedByIdOrderByScheduledAtDesc(Integer createdById);
    List<Appointment> findAllByOrderByScheduledAtDesc();

    // ✅ FIXED: Find conflicting appointments for scheduling validation
    @Query("SELECT a FROM Appointment a WHERE a.vehicle.id = :vehicleId " +
            "AND a.scheduledAt BETWEEN :conflictStart AND :conflictEnd " +
            "AND a.status IN ('scheduled', 'in_progress') " +
            "AND (:excludeId IS NULL OR a.id != :excludeId)")
    List<Appointment> findConflictingAppointments(@Param("vehicleId") Integer vehicleId,
                                                  @Param("conflictStart") LocalDateTime conflictStart,
                                                  @Param("conflictEnd") LocalDateTime conflictEnd,
                                                  @Param("excludeId") Integer excludeAppointmentId);

    // ✅ FIXED: Find today's scheduled appointments with parameters
    @Query("SELECT a FROM Appointment a WHERE a.scheduledAt >= :startOfDay " +
            "AND a.scheduledAt < :endOfDay AND a.status = 'scheduled'")
    List<Appointment> findTodayScheduledAppointments(@Param("startOfDay") LocalDateTime startOfDay,
                                                     @Param("endOfDay") LocalDateTime endOfDay);

    // Find appointments by customer
    @Query("SELECT a FROM Appointment a WHERE a.vehicle.customer.id = :customerId ORDER BY a.scheduledAt DESC")
    List<Appointment> findByCustomerIdOrderByScheduledAtDesc(@Param("customerId") Integer customerId);

    // Find pending appointments (scheduled + in_progress)
    @Query("SELECT a FROM Appointment a WHERE a.status IN ('scheduled', 'in_progress') ORDER BY a.scheduledAt")
    List<Appointment> findPendingAppointments();

    // Count appointments by status
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status = :status")
    Long countByStatus(@Param("status") String status);

    // Find recent appointments
    @Query("SELECT a FROM Appointment a WHERE a.createdAt >= :since ORDER BY a.createdAt DESC")
    List<Appointment> findRecentAppointments(@Param("since") LocalDateTime since);

    // Find appointments created today
    @Query("SELECT a FROM Appointment a WHERE a.createdAt >= :startOfDay " +
            "AND a.createdAt < :endOfDay ORDER BY a.createdAt DESC")
    List<Appointment> findAppointmentsCreatedToday(@Param("startOfDay") LocalDateTime startOfDay,
                                                   @Param("endOfDay") LocalDateTime endOfDay);
}