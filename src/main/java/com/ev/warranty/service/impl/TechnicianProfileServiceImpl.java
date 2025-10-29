package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.technician.TechnicianProfileDTO;
import com.ev.warranty.model.entity.TechnicianProfile;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.exception.ResourceNotFoundException;
import com.ev.warranty.mapper.TechnicianProfileMapper;
import com.ev.warranty.repository.TechnicianProfileRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.service.inter.TechnicianProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TechnicianProfileServiceImpl implements TechnicianProfileService {

    private final TechnicianProfileRepository technicianProfileRepository;
    private final UserRepository userRepository;
    private final TechnicianProfileMapper mapper;

    // ==================== CREATE ====================

    @Override
    @Transactional
    public TechnicianProfileDTO createProfile(Integer userId, TechnicianProfileDTO dto) {
        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Check if profile already exists
        if (technicianProfileRepository.existsByUserId(userId)) {
            throw new IllegalStateException("Technician profile already exists for user: " + userId);
        }

        // Convert DTO to entity
        TechnicianProfile profile = mapper.toEntity(dto);
        profile.setUser(user);

        // Set available_from if status is AVAILABLE
        if ("AVAILABLE".equalsIgnoreCase(profile.getAssignmentStatus())) {
            profile.setAvailableFrom(LocalDateTime.now());
        }

        // Save profile
        TechnicianProfile savedProfile = technicianProfileRepository.save(profile);

        log.info("Created technician profile for user: {} ({})",
                user.getUsername(), userId);

        return mapper.toDTO(savedProfile);
    }

    // ==================== READ ====================

    @Override
    public TechnicianProfileDTO getProfileById(Integer id) {
        TechnicianProfile profile = technicianProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Technician profile not found with id: " + id));
        return mapper.toDTO(profile);
    }

    @Override
    public TechnicianProfileDTO getProfileByUserId(Integer userId) {
        TechnicianProfile profile = technicianProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician profile not found for user: " + userId));
        return mapper.toDTO(profile);
    }

    @Override
    public List<TechnicianProfileDTO> getAllProfiles() {
        List<TechnicianProfile> profiles = technicianProfileRepository.findAll();
        return mapper.toDTOList(profiles);
    }

    @Override
    public List<TechnicianProfileDTO> getAvailableTechnicians() {
        List<TechnicianProfile> profiles = technicianProfileRepository.findAvailableTechnicians();
        log.debug("Found {} available technicians", profiles.size());
        return mapper.toDTOList(profiles);
    }

    @Override
    public List<TechnicianProfileDTO> getBusyTechnicians() {
        List<TechnicianProfile> profiles = technicianProfileRepository.findBusyTechnicians();
        return mapper.toDTOList(profiles);
    }

    @Override
    public List<TechnicianProfileDTO> getTechniciansWithCapacity() {
        List<TechnicianProfile> profiles = technicianProfileRepository.findTechniciansWithCapacity();
        return mapper.toDTOList(profiles);
    }

    @Override
    public List<TechnicianProfileDTO> getTechniciansBySpecialization(String specialization) {
        List<TechnicianProfile> profiles = technicianProfileRepository.findBySpecialization(specialization);
        return mapper.toDTOList(profiles);
    }

    @Override
    public List<TechnicianProfileDTO> getAvailableBySpecialization(String specialization) {
        List<TechnicianProfile> profiles = technicianProfileRepository.findAvailableBySpecialization(specialization);
        log.debug("Found {} available technicians with specialization: {}", profiles.size(), specialization);
        return mapper.toDTOList(profiles);
    }

    @Override
    public List<TechnicianProfileDTO> getTechniciansByCertificationLevel(String level) {
        List<TechnicianProfile> profiles = technicianProfileRepository.findByCertificationLevel(level);
        return mapper.toDTOList(profiles);
    }

    @Override
    public List<TechnicianProfileDTO> getAvailableByCertificationLevel(String level) {
        List<TechnicianProfile> profiles = technicianProfileRepository.findAvailableByCertificationLevel(level);
        return mapper.toDTOList(profiles);
    }

    @Override
    public List<TechnicianProfileDTO> getTopPerformers() {
        List<TechnicianProfile> profiles = technicianProfileRepository.findTopPerformers();
        return mapper.toDTOList(profiles);
    }

    @Override
    public List<TechnicianProfileDTO> getFastestTechnicians() {
        List<TechnicianProfile> profiles = technicianProfileRepository.findFastestTechnicians();
        return mapper.toDTOList(profiles);
    }

    // ==================== UPDATE ====================

    @Override
    @Transactional
    public TechnicianProfileDTO updateProfile(Integer id, TechnicianProfileDTO dto) {
        TechnicianProfile profile = technicianProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Technician profile not found with id: " + id));

        // Update entity from DTO
        mapper.updateEntityFromDTO(profile, dto);

        // Update available_from if status changed to AVAILABLE
        if ("AVAILABLE".equalsIgnoreCase(profile.getAssignmentStatus()) && profile.getAvailableFrom() == null) {
            profile.setAvailableFrom(LocalDateTime.now());
        }

        TechnicianProfile updatedProfile = technicianProfileRepository.save(profile);

        log.info("Updated technician profile: {} (User: {})",
                id, profile.getUser().getUsername());

        return mapper.toDTO(updatedProfile);
    }

    // ==================== WORKLOAD MANAGEMENT ====================

    @Override
    @Transactional
    public TechnicianProfileDTO incrementWorkload(Integer userId) {
        TechnicianProfile profile = technicianProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician profile not found for user: " + userId));

        if (!profile.canTakeMoreWork()) {
            throw new IllegalStateException(
                    String.format("Technician %s is at full capacity (%d/%d). Cannot take more work.",
                            profile.getUser().getUsername(),
                            profile.getCurrentWorkload(),
                            profile.getMaxWorkload())
            );
        }

        profile.incrementWorkload();
        TechnicianProfile updated = technicianProfileRepository.save(profile);

        log.info("Incremented workload for technician {} ({}): {}/{} - Status: {}",
                profile.getUser().getUsername(),
                userId,
                updated.getCurrentWorkload(),
                updated.getMaxWorkload(),
                updated.getAssignmentStatus());

        return mapper.toDTO(updated);
    }

    @Override
    @Transactional
    public TechnicianProfileDTO decrementWorkload(Integer userId) {
        TechnicianProfile profile = technicianProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician profile not found for user: " + userId));

        profile.decrementWorkload();
        TechnicianProfile updated = technicianProfileRepository.save(profile);

        log.info("Decremented workload for technician {} ({}): {}/{} - Status: {}",
                profile.getUser().getUsername(),
                userId,
                updated.getCurrentWorkload(),
                updated.getMaxWorkload(),
                updated.getAssignmentStatus());

        return mapper.toDTO(updated);
    }

    @Override
    @Transactional
    public TechnicianProfileDTO updateWorkOrderCompletion(Integer userId, BigDecimal laborHours) {
        TechnicianProfile profile = technicianProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician profile not found for user: " + userId));

        // Update completion stats
        profile.updateCompletionStats(laborHours);

        TechnicianProfile updated = technicianProfileRepository.save(profile);

        log.info("Updated completion stats for technician {} ({}): {} total orders, avg {} hours",
                profile.getUser().getUsername(),
                userId,
                updated.getTotalCompletedWorkOrders(),
                String.format("%.2f", updated.getAverageCompletionHours()));

        return mapper.toDTO(updated);
    }

    // ==================== ASSIGNMENT HELPERS ====================

    @Override
    public boolean canAssignWork(Integer userId) {
        TechnicianProfile profile = technicianProfileRepository.findByUserId(userId)
                .orElse(null);

        if (profile == null) {
            return false;
        }

        return profile.isAvailable() && profile.getUser().getActive();
    }

    @Override
    public TechnicianProfileDTO findBestAvailableTechnician(String specialization) {
        List<TechnicianProfile> available = technicianProfileRepository
                .findAvailableBySpecialization(specialization);

        if (available.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No available technicians found with specialization: " + specialization
            );
        }

        // First one has lowest workload (ordered by query)
        TechnicianProfile best = available.get(0);

        log.info("Found best available technician for {}: {} (workload: {}/{})",
                specialization,
                best.getUser().getUsername(),
                best.getCurrentWorkload(),
                best.getMaxWorkload());

        return mapper.toDTO(best);
    }

    @Override
    public TechnicianProfileDTO findBestAvailableTechnicianByLevel(
            String specialization,
            String minLevel) {

        // Define certification hierarchy
        List<String> acceptableLevels;
        switch (minLevel.toUpperCase()) {
            case "EXPERT":
                acceptableLevels = List.of("Expert");
                break;
            case "SENIOR":
                acceptableLevels = List.of("Expert", "Senior");
                break;
            case "JUNIOR":
                acceptableLevels = List.of("Expert", "Senior", "Junior");
                break;
            default:
                acceptableLevels = List.of("Expert", "Senior", "Junior");
        }

        List<TechnicianProfile> available = technicianProfileRepository
                .findAvailableBySpecializationAndLevels(specialization, acceptableLevels);

        if (available.isEmpty()) {
            throw new ResourceNotFoundException(
                    String.format("No available technicians found with specialization: %s and minimum level: %s",
                            specialization, minLevel)
            );
        }

        TechnicianProfile best = available.get(0);

        log.info("Found best available technician for {} ({}+): {} (workload: {}/{})",
                specialization,
                minLevel,
                best.getUser().getUsername(),
                best.getCurrentWorkload(),
                best.getMaxWorkload());

        return mapper.toDTO(best);
    }

    // ==================== STATISTICS ====================

    @Override
    public Map<String, Object> getWorkloadStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Counts
        Long availableCount = technicianProfileRepository.countAvailableTechnicians();
        Long busyCount = technicianProfileRepository.countBusyTechnicians();
        Long fullCapacityCount = technicianProfileRepository.countFullCapacityTechnicians();

        // Averages
        Double avgWorkload = technicianProfileRepository.getAverageWorkload();
        Double avgWorkloadPercentage = technicianProfileRepository.getAverageWorkloadPercentage();

        // Capacities
        Long totalCapacity = technicianProfileRepository.getTotalCapacity();
        Long totalCurrentWorkload = technicianProfileRepository.getTotalCurrentWorkload();
        Long totalRemainingCapacity = technicianProfileRepository.getTotalRemainingCapacity();

        stats.put("availableTechnicians", availableCount);
        stats.put("busyTechnicians", busyCount);
        stats.put("fullCapacityTechnicians", fullCapacityCount);
        stats.put("totalActiveTechnicians", availableCount + busyCount);

        stats.put("averageWorkload", avgWorkload != null ? avgWorkload : 0.0);
        stats.put("averageWorkloadPercentage", avgWorkloadPercentage != null ? avgWorkloadPercentage : 0.0);

        stats.put("totalCapacity", totalCapacity != null ? totalCapacity : 0L);
        stats.put("totalCurrentWorkload", totalCurrentWorkload != null ? totalCurrentWorkload : 0L);
        stats.put("totalRemainingCapacity", totalRemainingCapacity != null ? totalRemainingCapacity : 0L);

        // Calculate utilization percentage
        if (totalCapacity != null && totalCapacity > 0) {
            double utilizationPercentage = (totalCurrentWorkload.doubleValue() / totalCapacity.doubleValue()) * 100;
            stats.put("utilizationPercentage", utilizationPercentage);
        } else {
            stats.put("utilizationPercentage", 0.0);
        }

        log.debug("Retrieved workload statistics: {} available, {} busy, {:.1f}% utilization",
                availableCount, busyCount, stats.get("utilizationPercentage"));

        return stats;
    }

    @Override
    public Map<String, Object> getStatisticsBySpecialization(String specialization) {
        Map<String, Object> stats = new HashMap<>();

        List<TechnicianProfile> allWithSpec = technicianProfileRepository.findBySpecialization(specialization);
        List<TechnicianProfile> availableWithSpec = technicianProfileRepository.findAvailableBySpecialization(specialization);

        stats.put("specialization", specialization);
        stats.put("totalTechnicians", allWithSpec.size());
        stats.put("availableTechnicians", availableWithSpec.size());
        stats.put("busyTechnicians", allWithSpec.size() - availableWithSpec.size());

        return stats;
    }

    // ==================== DELETE ====================

    @Override
    @Transactional
    public void deleteProfile(Integer id) {
        TechnicianProfile profile = technicianProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Technician profile not found with id: " + id));

        if (profile.getCurrentWorkload() > 0) {
            throw new IllegalStateException(
                    String.format("Cannot delete profile for technician %s. They have %d active work orders.",
                            profile.getUser().getUsername(),
                            profile.getCurrentWorkload())
            );
        }

        technicianProfileRepository.delete(profile);

        log.info("Deleted technician profile: {} (User: {})",
                id, profile.getUser().getUsername());
    }
}
