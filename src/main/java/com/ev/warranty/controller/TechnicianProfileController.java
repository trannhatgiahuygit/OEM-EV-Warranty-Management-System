package com.ev.warranty.controller;

import com.ev.warranty.model.dto.technician.TechnicianProfileDTO;
import com.ev.warranty.service.inter.TechnicianProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/technicians")
@RequiredArgsConstructor
public class TechnicianProfileController {

    private final TechnicianProfileService technicianProfileService;

    // ==================== CREATE ====================

    /**
     * Create new technician profile
     * POST /api/technicians/profile?userId={userId}*/
    @PostMapping("/profile")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<TechnicianProfileDTO> createProfile(
            @RequestParam Integer userId,
            @RequestBody TechnicianProfileDTO dto) {
        TechnicianProfileDTO created = technicianProfileService.createProfile(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ==================== READ - BASIC ====================

    /**
     * Get profile by ID
     * GET /api/technicians/{id}
     * Required roles: All authenticated users
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<TechnicianProfileDTO> getProfileById(@PathVariable Integer id) {
        return ResponseEntity.ok(technicianProfileService.getProfileById(id));
    }

    /**
     * Get profile by user ID
     * GET /api/technicians/user/{userId}
     * Required roles: All authenticated users
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<TechnicianProfileDTO> getProfileByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(technicianProfileService.getProfileByUserId(userId));
    }

    /**
     * Get all profiles
     * GET /api/technicians
     * Required roles: All authenticated users
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<List<TechnicianProfileDTO>> getAllProfiles() {
        return ResponseEntity.ok(technicianProfileService.getAllProfiles());
    }

    // ==================== READ - BY AVAILABILITY ====================

    /**
     * Get all available technicians
     * GET /api/technicians/available
     * Required roles: All authenticated users
     */
    @GetMapping("/available")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<List<TechnicianProfileDTO>> getAvailableTechnicians() {
        return ResponseEntity.ok(technicianProfileService.getAvailableTechnicians());
    }

    /**
     * Get all busy technicians
     * GET /api/technicians/busy
     * Required roles: All authenticated users
     */
    @GetMapping("/busy")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<List<TechnicianProfileDTO>> getBusyTechnicians() {
        return ResponseEntity.ok(technicianProfileService.getBusyTechnicians());
    }

    /**
     * Get technicians with remaining capacity
     * GET /api/technicians/with-capacity
     * Required roles: All authenticated users
     */
    @GetMapping("/with-capacity")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<List<TechnicianProfileDTO>> getTechniciansWithCapacity() {
        return ResponseEntity.ok(technicianProfileService.getTechniciansWithCapacity());
    }

    // ==================== READ - BY SPECIALIZATION ====================

    /**
     * Get all technicians by specialization
     * GET /api/technicians/specialization/{specialization}
     * Required roles: All authenticated users
     */
    @GetMapping("/specialization/{specialization}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<List<TechnicianProfileDTO>> getBySpecialization(
            @PathVariable String specialization) {
        return ResponseEntity.ok(technicianProfileService.getTechniciansBySpecialization(specialization));
    }

    /**
     * Get available technicians by specialization
     * GET /api/technicians/available/specialization/{specialization}
     * Required roles: All authenticated users
     */
    @GetMapping("/available/specialization/{specialization}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<List<TechnicianProfileDTO>> getAvailableBySpecialization(
            @PathVariable String specialization) {
        return ResponseEntity.ok(technicianProfileService.getAvailableBySpecialization(specialization));
    }

    // ==================== READ - BY CERTIFICATION ====================

    /**
     * Get technicians by certification level
     * GET /api/technicians/certification/{level}
     * Required roles: All authenticated users
     */
    @GetMapping("/certification/{level}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<List<TechnicianProfileDTO>> getByCertificationLevel(
            @PathVariable String level) {
        return ResponseEntity.ok(technicianProfileService.getTechniciansByCertificationLevel(level));
    }

    /**
     * Get available technicians by certification level
     * GET /api/technicians/available/certification/{level}
     * Required roles: All authenticated users
     */
    @GetMapping("/available/certification/{level}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<List<TechnicianProfileDTO>> getAvailableByCertificationLevel(
            @PathVariable String level) {
        return ResponseEntity.ok(technicianProfileService.getAvailableByCertificationLevel(level));
    }

    // ==================== READ - PERFORMANCE ====================

    /**
     * Get top performing technicians
     * GET /api/technicians/top-performers
     * Required roles: ADMIN, SC_STAFF, EVM_STAFF
     */
    @GetMapping("/top-performers")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<List<TechnicianProfileDTO>> getTopPerformers() {
        return ResponseEntity.ok(technicianProfileService.getTopPerformers());
    }

    /**
     * Get fastest technicians
     * GET /api/technicians/fastest
     * Required roles: ADMIN, SC_STAFF, EVM_STAFF
     */
    @GetMapping("/fastest")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<List<TechnicianProfileDTO>> getFastestTechnicians() {
        return ResponseEntity.ok(technicianProfileService.getFastestTechnicians());
    }

    // ==================== UPDATE ====================

    /**
     * Update technician profile
     * PUT /api/technicians/{id}
     * Required roles: ADMIN, SC_STAFF
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<TechnicianProfileDTO> updateProfile(
            @PathVariable Integer id,
            @RequestBody TechnicianProfileDTO dto) {
        return ResponseEntity.ok(technicianProfileService.updateProfile(id, dto));
    }

    // ==================== WORKLOAD MANAGEMENT ====================

    /**
     * Increment technician workload
     * POST /api/technicians/user/{userId}/increment-workload
     * Required roles: ADMIN, SC_STAFF (called automatically by system when assigning work)
     */
    @PostMapping("/user/{userId}/increment-workload")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<TechnicianProfileDTO> incrementWorkload(@PathVariable Integer userId) {
        return ResponseEntity.ok(technicianProfileService.incrementWorkload(userId));
    }

    /**
     * Decrement technician workload
     * POST /api/technicians/user/{userId}/decrement-workload
     * Required roles: ADMIN, SC_STAFF (called automatically by system when work is completed/cancelled)
     */
    @PostMapping("/user/{userId}/decrement-workload")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<TechnicianProfileDTO> decrementWorkload(@PathVariable Integer userId) {
        return ResponseEntity.ok(technicianProfileService.decrementWorkload(userId));
    }

    /**
     * Update work order completion statistics
     * POST /api/technicians/user/{userId}/complete-work?laborHours={hours}
     * Required roles: ADMIN, SC_STAFF, SC_TECHNICIAN (technician can update their own stats)
     */
    @PostMapping("/user/{userId}/complete-work")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<TechnicianProfileDTO> updateWorkCompletion(
            @PathVariable Integer userId,
            @RequestParam BigDecimal laborHours) {
        return ResponseEntity.ok(technicianProfileService.updateWorkOrderCompletion(userId, laborHours));
    }

    // ==================== ASSIGNMENT HELPERS ====================

    /**
     * Check if technician can be assigned work
     * GET /api/technicians/user/{userId}/can-assign
     * Required roles: All authenticated users
     */
    @GetMapping("/user/{userId}/can-assign")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<Map<String, Boolean>> canAssignWork(@PathVariable Integer userId) {
        boolean canAssign = technicianProfileService.canAssignWork(userId);
        return ResponseEntity.ok(Map.of("canAssign", canAssign));
    }

    /**
     * Find best available technician by specialization
     * GET /api/technicians/best-available?specialization={spec}
     * Required roles: ADMIN, SC_STAFF
     */
    @GetMapping("/best-available")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<TechnicianProfileDTO> findBestAvailable(
            @RequestParam String specialization) {
        return ResponseEntity.ok(technicianProfileService.findBestAvailableTechnician(specialization));
    }

    /**
     * Find best available technician by specialization and minimum certification level
     * GET /api/technicians/best-available-by-level?specialization={spec}&minLevel={level}
     * Required roles: ADMIN, SC_STAFF
     */
    @GetMapping("/best-available-by-level")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<TechnicianProfileDTO> findBestAvailableByLevel(
            @RequestParam String specialization,
            @RequestParam String minLevel) {
        return ResponseEntity.ok(
                technicianProfileService.findBestAvailableTechnicianByLevel(specialization, minLevel)
        );
    }

    // ==================== STATISTICS ====================

    /**
     * Get workload statistics
     * GET /api/technicians/statistics
     * Required roles: All authenticated users
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        return ResponseEntity.ok(technicianProfileService.getWorkloadStatistics());
    }

    /**
     * Get statistics by specialization
     * GET /api/technicians/statistics/specialization/{specialization}
     * Required roles: All authenticated users
     */
    @GetMapping("/statistics/specialization/{specialization}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<Map<String, Object>> getStatisticsBySpecialization(
            @PathVariable String specialization) {
        return ResponseEntity.ok(technicianProfileService.getStatisticsBySpecialization(specialization));
    }

    // ==================== DELETE ====================

    /**
     * Delete technician profile
     * DELETE /api/technicians/{id}
     * Required roles: ADMIN only
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteProfile(@PathVariable Integer id) {
        technicianProfileService.deleteProfile(id);
        return ResponseEntity.noContent().build();
    }
}