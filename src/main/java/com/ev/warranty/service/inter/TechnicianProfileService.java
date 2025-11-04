package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.technician.TechnicianProfileDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface TechnicianProfileService {

    // ==================== CREATE ====================

    /**
     * Create new technician profile
     * @param userId User ID to create profile for
     * @param dto Profile data
     * @return Created profile DTO
     */
    TechnicianProfileDTO createProfile(Integer userId, TechnicianProfileDTO dto);

    // ==================== READ ====================

    /**
     * Get technician profile by ID
     */
    TechnicianProfileDTO getProfileById(Integer id);

    /**
     * Get technician profile by user ID
     */
    TechnicianProfileDTO getProfileByUserId(Integer userId);

    /**
     * Get all technician profiles
     */
    List<TechnicianProfileDTO> getAllProfiles();

    /**
     * Get all available technicians
     */
    List<TechnicianProfileDTO> getAvailableTechnicians();

    /**
     * Get all busy technicians
     */
    List<TechnicianProfileDTO> getBusyTechnicians();

    /**
     * Get technicians with remaining capacity
     */
    List<TechnicianProfileDTO> getTechniciansWithCapacity();

    /**
     * Get technicians by specialization
     */
    List<TechnicianProfileDTO> getTechniciansBySpecialization(String specialization);

    /**
     * Get available technicians by specialization
     */
    List<TechnicianProfileDTO> getAvailableBySpecialization(String specialization);

    /**
     * Get technicians by certification level
     */
    List<TechnicianProfileDTO> getTechniciansByCertificationLevel(String level);

    /**
     * Get available technicians by certification level
     */
    List<TechnicianProfileDTO> getAvailableByCertificationLevel(String level);

    /**
     * Get top performing technicians
     */
    List<TechnicianProfileDTO> getTopPerformers();

    /**
     * Get fastest technicians
     */
    List<TechnicianProfileDTO> getFastestTechnicians();

    // ==================== UPDATE ====================

    /**
     * Update technician profile
     */
    TechnicianProfileDTO updateProfile(Integer id, TechnicianProfileDTO dto);

    // ==================== WORKLOAD MANAGEMENT ====================

    /**
     * Increment technician workload
     * Called when work order is assigned
     */
    TechnicianProfileDTO incrementWorkload(Integer userId);

    /**
     * Decrement technician workload
     * Called when work order is completed or cancelled
     */
    TechnicianProfileDTO decrementWorkload(Integer userId);

    /**
     * Update work order completion statistics
     * Called when work order is completed
     */
    TechnicianProfileDTO updateWorkOrderCompletion(Integer userId, BigDecimal laborHours);

    // ==================== ASSIGNMENT HELPERS ====================

    /**
     * Check if technician can be assigned work immediately (uses current time)
     */
    boolean canAssignWork(Integer userId);

    /**
     * Check if technician can be assigned work for a specific start time.
     * Allows BUSY technicians to accept more work if under max_workload and
     * the requested startTime is not before their availableFrom.
     */
    boolean canAssignWork(Integer userId, LocalDateTime startTime);

    /**
     * Find best available technician by specialization
     * Returns technician with lowest workload
     */
    TechnicianProfileDTO findBestAvailableTechnician(String specialization);

    /**
     * Find best available technician by specialization and minimum certification level
     */
    TechnicianProfileDTO findBestAvailableTechnicianByLevel(String specialization, String minLevel);

    // ==================== STATISTICS ====================

    /**
     * Get comprehensive workload statistics
     */
    Map<String, Object> getWorkloadStatistics();

    /**
     * Get statistics by specialization
     */
    Map<String, Object> getStatisticsBySpecialization(String specialization);

    // ==================== DELETE ====================

    /**
     * Delete technician profile
     */
    void deleteProfile(Integer id);
}
