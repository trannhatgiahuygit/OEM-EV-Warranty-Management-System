package com.ev.warranty.controller;

import com.ev.warranty.model.dto.appointment.AppointmentCreateRequestDTO;
import com.ev.warranty.model.dto.appointment.AppointmentCreateResponseDTO;
import com.ev.warranty.model.dto.appointment.AppointmentUpdateRequestDTO;
import com.ev.warranty.service.inter.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Slf4j
public class AppointmentController {

    private final AppointmentService appointmentService;

    /**
     * Create a new appointment
     * Available to: SC_STAFF, ADMIN only
     */
    @PostMapping("/create")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<AppointmentCreateResponseDTO> createAppointment(
            @Valid @RequestBody AppointmentCreateRequestDTO request,
            Authentication authentication) {

        String createdBy = authentication.getName();
        log.info("Creating appointment for vehicle {} by user {}", request.getVehicleId(), createdBy);

        AppointmentCreateResponseDTO appointment = appointmentService.createAppointment(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(appointment);
    }

    /**
     * Get appointment by ID
     * Available to: All authenticated users
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_SC_MANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<AppointmentCreateResponseDTO> getAppointmentById(@PathVariable Integer id) {
        log.debug("Getting appointment by ID: {}", id);

        return appointmentService.findById(id)
                .map(appointment -> {
                    log.debug("Appointment found: {}", id);
                    return ResponseEntity.ok(appointment);
                })
                .orElseGet(() -> {
                    log.debug("Appointment not found: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    /**
     * Get appointments by vehicle ID
     * Available to: All authenticated users
     */
    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_SC_MANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<List<AppointmentCreateResponseDTO>> getAppointmentsByVehicle(@PathVariable Integer vehicleId) {
        log.debug("Getting appointments for vehicle: {}", vehicleId);

        List<AppointmentCreateResponseDTO> appointments = appointmentService.findByVehicleId(vehicleId);
        log.debug("Found {} appointments for vehicle: {}", appointments.size(), vehicleId);

        return ResponseEntity.ok(appointments);
    }

    /**
     * Get appointments by claim ID
     * Available to: All authenticated users
     */
    @GetMapping("/claim/{claimId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_SC_MANAGER', 'ROLE_ADMIN')")
    public ResponseEntity<List<AppointmentCreateResponseDTO>> getAppointmentsByClaim(@PathVariable Integer claimId) {
        log.debug("Getting appointments for claim: {}", claimId);

        List<AppointmentCreateResponseDTO> appointments = appointmentService.findByClaimId(claimId);
        log.debug("Found {} appointments for claim: {}", appointments.size(), claimId);

        return ResponseEntity.ok(appointments);
    }

    /**
     * Get appointments by date (calendar view)
     * Available to: SC_STAFF, SC_TECHNICIAN, ADMIN
     */
    @GetMapping("/date/{date}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<List<AppointmentCreateResponseDTO>> getAppointmentsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        log.debug("Getting appointments for date: {}", date);

        List<AppointmentCreateResponseDTO> appointments = appointmentService.findByDate(date);
        log.debug("Found {} appointments for date: {}", appointments.size(), date);

        return ResponseEntity.ok(appointments);
    }

    /**
     * Get today's appointments
     * Available to: SC_STAFF, SC_TECHNICIAN, ADMIN
     */
    @GetMapping("/today")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<List<AppointmentCreateResponseDTO>> getTodayAppointments() {
        log.debug("Getting today's appointments");

        List<AppointmentCreateResponseDTO> appointments = appointmentService.findTodayAppointments();
        log.debug("Found {} appointments for today", appointments.size());

        return ResponseEntity.ok(appointments);
    }

    /**
     * Get appointments by status
     * Available to: SC_STAFF, SC_TECHNICIAN, ADMIN
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<List<AppointmentCreateResponseDTO>> getAppointmentsByStatus(@PathVariable String status) {
        log.debug("Getting appointments with status: {}", status);

        List<AppointmentCreateResponseDTO> appointments = appointmentService.findByStatus(status);
        log.debug("Found {} appointments with status: {}", appointments.size(), status);

        return ResponseEntity.ok(appointments);
    }

    /**
     * Get my appointments (created by current user)
     * Available to: SC_STAFF, ADMIN
     */
    @GetMapping("/my-appointments")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<List<AppointmentCreateResponseDTO>> getMyAppointments(Authentication authentication) {
        String username = authentication.getName();
        log.debug("Getting appointments created by: {}", username);

        List<AppointmentCreateResponseDTO> appointments = appointmentService.findByCreatedBy(username);
        log.debug("Found {} appointments created by: {}", appointments.size(), username);

        return ResponseEntity.ok(appointments);
    }

    /**
     * Get recent appointments (last 24 hours)
     * Available to: SC_STAFF, ADMIN
     */
    @GetMapping("/recent")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<List<AppointmentCreateResponseDTO>> getRecentAppointments() {
        log.debug("Getting recent appointments (last 24 hours)");

        List<AppointmentCreateResponseDTO> appointments = appointmentService.findRecentAppointments(24);
        log.debug("Found {} recent appointments", appointments.size());

        return ResponseEntity.ok(appointments);
    }

    /**
     * Get appointments created today
     * Available to: SC_STAFF, ADMIN
     */
    @GetMapping("/created-today")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<List<AppointmentCreateResponseDTO>> getAppointmentsCreatedToday() {
        log.debug("Getting appointments created today");

        List<AppointmentCreateResponseDTO> appointments = appointmentService.findAppointmentsCreatedToday();
        log.debug("Found {} appointments created today", appointments.size());

        return ResponseEntity.ok(appointments);
    }

    /**
     * Update appointment
     * Available to: SC_STAFF, SC_TECHNICIAN, ADMIN
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<AppointmentCreateResponseDTO> updateAppointment(
            @PathVariable Integer id,
            @Valid @RequestBody AppointmentUpdateRequestDTO request,
            Authentication authentication) {

        String updatedBy = authentication.getName();
        log.info("Updating appointment {} by user {}", id, updatedBy);

        AppointmentCreateResponseDTO updatedAppointment = appointmentService.updateAppointment(id, request, updatedBy);
        return ResponseEntity.ok(updatedAppointment);
    }

    /**
     * Cancel appointment
     * Available to: SC_STAFF, ADMIN
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<Void> cancelAppointment(
            @PathVariable Integer id,
            Authentication authentication) {

        String cancelledBy = authentication.getName();
        log.info("Cancelling appointment {} by user {}", id, cancelledBy);

        appointmentService.cancelAppointment(id, cancelledBy);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all appointments (admin view)
     * Available to: ADMIN only
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<AppointmentCreateResponseDTO>> getAllAppointments() {
        log.debug("Getting all appointments (admin request)");

        List<AppointmentCreateResponseDTO> appointments = appointmentService.findAllAppointments();
        log.debug("Retrieved {} total appointments", appointments.size());

        return ResponseEntity.ok(appointments);
    }
}