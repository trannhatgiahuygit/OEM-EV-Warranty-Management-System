package com.ev.warranty.repository;

import com.ev.warranty.model.entity.TechnicianProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianProfileRepository extends JpaRepository<TechnicianProfile, Integer> {

    // ==================== BASIC QUERIES ====================

    /**
     * Find technician profile by user ID
     * @param userId User ID
     * @return Optional TechnicianProfile
     */
    Optional<TechnicianProfile> findByUserId(Integer userId);

    /**
     * Check if technician profile exists for user
     * @param userId User ID
     * @return true if exists
     */
    boolean existsByUserId(Integer userId);

    // ==================== AVAILABILITY QUERIES ====================

    /**
     * Find all available technicians (active users only)
     * Available = status is AVAILABLE AND has capacity AND user is active
     * Ordered by current workload (least busy first)
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.assignmentStatus = 'AVAILABLE' " +
            "AND tp.currentWorkload < tp.maxWorkload " +
            "AND tp.user.active = true " +
            "ORDER BY tp.currentWorkload ASC")
    List<TechnicianProfile> findAvailableTechnicians();

    /**
     * Find all busy technicians (at max capacity)
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.assignmentStatus = 'BUSY' " +
            "AND tp.user.active = true " +
            "ORDER BY tp.currentWorkload DESC")
    List<TechnicianProfile> findBusyTechnicians();

    /**
     * Find technicians with capacity (can take more work)
     * Includes both AVAILABLE and BUSY technicians who haven't reached max
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.currentWorkload < tp.maxWorkload " +
            "AND tp.user.active = true " +
            "ORDER BY tp.currentWorkload ASC")
    List<TechnicianProfile> findTechniciansWithCapacity();

    /**
     * Find technicians at full capacity
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.currentWorkload >= tp.maxWorkload " +
            "AND tp.user.active = true")
    List<TechnicianProfile> findFullCapacityTechnicians();

    // ==================== SPECIALIZATION QUERIES ====================

    /**
     * Find all technicians by specialization
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.specialization = :specialization " +
            "AND tp.user.active = true")
    List<TechnicianProfile> findBySpecialization(@Param("specialization") String specialization);

    /**
     * Find available technicians by specialization
     * Ordered by workload (least busy first)
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.specialization = :specialization " +
            "AND tp.assignmentStatus = 'AVAILABLE' " +
            "AND tp.currentWorkload < tp.maxWorkload " +
            "AND tp.user.active = true " +
            "ORDER BY tp.currentWorkload ASC, tp.averageCompletionHours ASC")
    List<TechnicianProfile> findAvailableBySpecialization(@Param("specialization") String specialization);

    /**
     * Find available technicians by specialization and minimum certification level
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.specialization = :specialization " +
            "AND tp.certificationLevel IN :levels " +
            "AND tp.assignmentStatus = 'AVAILABLE' " +
            "AND tp.currentWorkload < tp.maxWorkload " +
            "AND tp.user.active = true " +
            "ORDER BY tp.currentWorkload ASC")
    List<TechnicianProfile> findAvailableBySpecializationAndLevels(
            @Param("specialization") String specialization,
            @Param("levels") List<String> levels
    );

    // ==================== CERTIFICATION QUERIES ====================

    /**
     * Find technicians by certification level
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.certificationLevel = :level " +
            "AND tp.user.active = true")
    List<TechnicianProfile> findByCertificationLevel(@Param("level") String level);

    /**
     * Find available technicians by certification level
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.certificationLevel = :level " +
            "AND tp.assignmentStatus = 'AVAILABLE' " +
            "AND tp.currentWorkload < tp.maxWorkload " +
            "AND tp.user.active = true " +
            "ORDER BY tp.currentWorkload ASC")
    List<TechnicianProfile> findAvailableByCertificationLevel(@Param("level") String level);

    // ==================== STATISTICS QUERIES ====================

    /**
     * Get average workload across all active technicians
     */
    @Query("SELECT AVG(tp.currentWorkload) FROM TechnicianProfile tp WHERE tp.user.active = true")
    Double getAverageWorkload();

    /**
     * Get average workload percentage across all active technicians
     */
    @Query("SELECT AVG(CAST(tp.currentWorkload AS double) / CAST(tp.maxWorkload AS double) * 100) " +
            "FROM TechnicianProfile tp WHERE tp.user.active = true")
    Double getAverageWorkloadPercentage();

    /**
     * Count available technicians
     */
    @Query("SELECT COUNT(tp) FROM TechnicianProfile tp " +
            "WHERE tp.assignmentStatus = 'AVAILABLE' " +
            "AND tp.currentWorkload < tp.maxWorkload " +
            "AND tp.user.active = true")
    Long countAvailableTechnicians();

    /**
     * Count busy technicians
     */
    @Query("SELECT COUNT(tp) FROM TechnicianProfile tp " +
            "WHERE tp.assignmentStatus = 'BUSY' " +
            "AND tp.user.active = true")
    Long countBusyTechnicians();

    /**
     * Count technicians at full capacity
     */
    @Query("SELECT COUNT(tp) FROM TechnicianProfile tp " +
            "WHERE tp.currentWorkload >= tp.maxWorkload " +
            "AND tp.user.active = true")
    Long countFullCapacityTechnicians();

    /**
     * Get total capacity across all active technicians
     */
    @Query("SELECT SUM(tp.maxWorkload) FROM TechnicianProfile tp WHERE tp.user.active = true")
    Long getTotalCapacity();

    /**
     * Get total current workload across all active technicians
     */
    @Query("SELECT SUM(tp.currentWorkload) FROM TechnicianProfile tp WHERE tp.user.active = true")
    Long getTotalCurrentWorkload();

    /**
     * Get total remaining capacity across all active technicians
     */
    @Query("SELECT SUM(tp.maxWorkload - tp.currentWorkload) FROM TechnicianProfile tp WHERE tp.user.active = true")
    Long getTotalRemainingCapacity();

    // ==================== PERFORMANCE QUERIES ====================

    /**
     * Find top performing technicians by completion rate
     * Ordered by total completed work orders (descending)
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.user.active = true " +
            "AND tp.totalCompletedWorkOrders > 0 " +
            "ORDER BY tp.totalCompletedWorkOrders DESC")
    List<TechnicianProfile> findTopPerformers();

    /**
     * Find fastest technicians by average completion hours
     * Ordered by average completion hours (ascending)
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.user.active = true " +
            "AND tp.totalCompletedWorkOrders > 0 " +
            "ORDER BY tp.averageCompletionHours ASC")
    List<TechnicianProfile> findFastestTechnicians();

    /**
     * Find technicians by minimum completed work orders
     */
    @Query("SELECT tp FROM TechnicianProfile tp " +
            "WHERE tp.totalCompletedWorkOrders >= :minCompleted " +
            "AND tp.user.active = true " +
            "ORDER BY tp.totalCompletedWorkOrders DESC")
    List<TechnicianProfile> findByMinCompletedWorkOrders(@Param("minCompleted") Integer minCompleted);
}