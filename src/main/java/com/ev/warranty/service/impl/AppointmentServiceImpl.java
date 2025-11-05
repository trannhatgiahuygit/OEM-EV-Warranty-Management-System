package com.ev.warranty.service.impl;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.mapper.AppointmentMapper;
import com.ev.warranty.model.dto.appointment.AppointmentCreateRequestDTO;
import com.ev.warranty.model.dto.appointment.AppointmentCreateResponseDTO;
import com.ev.warranty.model.dto.appointment.AppointmentUpdateRequestDTO;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import com.ev.warranty.service.inter.AppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final VehicleRepository vehicleRepository;
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final AppointmentMapper appointmentMapper;

    @Override
    @Transactional
    public AppointmentCreateResponseDTO createAppointment(AppointmentCreateRequestDTO request, String createdBy) {
        log.info("Creating appointment for vehicle ID: {} by user: {}", request.getVehicleId(), createdBy);

        // 1. Validate request
        validateAppointmentRequest(request);

        // 2. Get entities
        Vehicle vehicle = getVehicleById(request.getVehicleId());
        Claim claim = getClaimById(request.getClaimId()); // Can be null
        User createdByUser = getUserByUsername(createdBy);

        // 3. Validate business rules
        validateBusinessRules(request, vehicle, claim);

        // 4. Check scheduling conflicts
        validateSchedulingConflicts(request.getScheduledAt(), vehicle.getId());

        // 5. Create appointment
        Appointment appointment = Appointment.builder()
                .vehicle(vehicle)
                .claim(claim)
                .scheduledAt(request.getScheduledAt())
                .createdBy(createdByUser)
                .status("scheduled")
                .notifiedCustomer(false)  // Default: not notified yet
                .build();

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // 6. Handle customer notification
        if (Boolean.TRUE.equals(request.getNotifyCustomer())) {
            try {
                notifyCustomer(savedAppointment);
                savedAppointment.setNotifiedCustomer(true);
                appointmentRepository.save(savedAppointment);
                log.info("Customer notification sent successfully for appointment: {}", savedAppointment.getId());
            } catch (Exception e) {
                log.error("Failed to notify customer for appointment {}: {}", savedAppointment.getId(), e.getMessage());
                // Continue without throwing exception - appointment still created
            }
        }

        log.info("Appointment created with ID: {} for vehicle: {}", savedAppointment.getId(), vehicle.getVin());
        return appointmentMapper.toResponseDTO(savedAppointment);
    }

    @Override
    public Optional<AppointmentCreateResponseDTO> findById(Integer id) {
        return appointmentRepository.findById(id)
                .map(appointmentMapper::toResponseDTO);
    }

    @Override
    public List<AppointmentCreateResponseDTO> findByVehicleId(Integer vehicleId) {
        log.debug("Finding appointments for vehicle ID: {}", vehicleId);
        List<Appointment> appointments = appointmentRepository.findByVehicleIdOrderByScheduledAtDesc(vehicleId);
        return appointments.stream()
                .map(appointmentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findByClaimId(Integer claimId) {
        log.debug("Finding appointments for claim ID: {}", claimId);
        List<Appointment> appointments = appointmentRepository.findByClaimIdOrderByScheduledAt(claimId);
        return appointments.stream()
                .map(appointmentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findByDate(LocalDate date) {
        log.debug("Finding appointments for date: {}", date);
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<Appointment> appointments = appointmentRepository.findByScheduledAtBetweenOrderByScheduledAt(startOfDay, endOfDay);
        return appointments.stream()
                .map(appointmentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findByStatus(String status) {
        log.debug("Finding appointments with status: {}", status);
        List<Appointment> appointments = appointmentRepository.findByStatusOrderByScheduledAt(status);
        return appointments.stream()
                .map(appointmentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findByCreatedBy(String username) {
        log.debug("Finding appointments created by: {}", username);
        User user = getUserByUsername(username);
        List<Appointment> appointments = appointmentRepository.findByCreatedByIdOrderByScheduledAtDesc(user.getId());
        return appointments.stream()
                .map(appointmentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentCreateResponseDTO updateAppointment(Integer id, AppointmentUpdateRequestDTO request, String updatedBy) {
        log.info("Updating appointment ID: {} by user: {}", id, updatedBy);

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Appointment not found with ID: " + id));

        // Track changes for logging
        String originalStatus = appointment.getStatus();
        LocalDateTime originalSchedule = appointment.getScheduledAt();

        // Update fields if provided
        if (request.getScheduledAt() != null) {
            validateSchedulingConflicts(request.getScheduledAt(), appointment.getVehicle().getId(), id);
            appointment.setScheduledAt(request.getScheduledAt());
        }

        if (request.getStatus() != null) {
            validateStatusTransition(appointment.getStatus(), request.getStatus());
            appointment.setStatus(request.getStatus());
        }

        if (request.getNotifyCustomer() != null) {
            if (Boolean.TRUE.equals(request.getNotifyCustomer())) {
                // User wants to notify customer
                try {
                    notifyCustomerUpdate(appointment, originalSchedule);
                    appointment.setNotifiedCustomer(true);
                    log.info("Customer notified for appointment update: {}", id);
                } catch (Exception e) {
                    log.error("Failed to notify customer about appointment update {}: {}", id, e.getMessage());
                    appointment.setNotifiedCustomer(false); // Mark as failed
                }
            } else {
                // User explicitly set notifyCustomer = false
                appointment.setNotifiedCustomer(false);
                log.info("Customer notification disabled for appointment: {}", id);
            }
        }
        // If notifyCustomer is null, don't change the current notification status

        Appointment updatedAppointment = appointmentRepository.save(appointment);

        // Log significant changes
        if (!originalStatus.equals(updatedAppointment.getStatus())) {
            log.info("Appointment {} status changed from {} to {} by {}",
                    id, originalStatus, updatedAppointment.getStatus(), updatedBy);
        }

        if (!originalSchedule.equals(updatedAppointment.getScheduledAt())) {
            log.info("Appointment {} rescheduled from {} to {} by {}",
                    id, originalSchedule, updatedAppointment.getScheduledAt(), updatedBy);
        }

        return appointmentMapper.toResponseDTO(updatedAppointment);
    }

    @Override
    @Transactional
    public void cancelAppointment(Integer id, String cancelledBy) {
        log.info("Cancelling appointment ID: {} by user: {}", id, cancelledBy);

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Appointment not found with ID: " + id));

        if ("completed".equals(appointment.getStatus())) {
            throw new ValidationException("Cannot cancel completed appointment");
        }

        if ("cancelled".equals(appointment.getStatus())) {
            throw new ValidationException("Appointment is already cancelled");
        }

        appointment.setStatus("cancelled");
        appointmentRepository.save(appointment);

        // Notify customer about cancellation
        try {
            notifyCustomerCancellation(appointment);
        } catch (Exception e) {
            log.error("Failed to notify customer about cancellation {}: {}", id, e.getMessage());
        }

        log.info("Appointment {} cancelled by {}", id, cancelledBy);
    }

    @Override
    public List<AppointmentCreateResponseDTO> findAllAppointments() {
        log.debug("Finding all appointments");
        List<Appointment> appointments = appointmentRepository.findAllByOrderByScheduledAtDesc();
        return appointments.stream()
                .map(appointmentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    // ✅ FIXED: Today's appointments with parameters
    @Override
    public List<AppointmentCreateResponseDTO> findTodayAppointments() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        log.debug("Finding today's appointments: {}", today);

        List<Appointment> appointments = appointmentRepository.findTodayScheduledAppointments(startOfDay, endOfDay);
        return appointments.stream()
                .map(appointmentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findRecentAppointments(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<Appointment> appointments = appointmentRepository.findRecentAppointments(since);
        return appointments.stream()
                .map(appointmentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findAppointmentsCreatedToday() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        List<Appointment> appointments = appointmentRepository.findAppointmentsCreatedToday(startOfDay, endOfDay);
        return appointments.stream()
                .map(appointmentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private void validateAppointmentRequest(AppointmentCreateRequestDTO request) {
        // Check if scheduled time is during business hours (8 AM - 6 PM)
        int hour = request.getScheduledAt().getHour();
        if (hour < 8 || hour >= 18) {
            throw new ValidationException("Appointments can only be scheduled between 8:00 AM and 6:00 PM");
        }

        // Check if scheduled date is not weekend (optional business rule)
        int dayOfWeek = request.getScheduledAt().getDayOfWeek().getValue();
        if (dayOfWeek == 6 || dayOfWeek == 7) { // Saturday = 6, Sunday = 7
            throw new ValidationException("Appointments cannot be scheduled on weekends");
        }

        // Check if appointment is not too far in the future (max 3 months)
        LocalDateTime maxFutureDate = LocalDateTime.now().plusMonths(3);
        if (request.getScheduledAt().isAfter(maxFutureDate)) {
            throw new ValidationException("Appointments cannot be scheduled more than 3 months in advance");
        }
    }

    private Vehicle getVehicleById(Integer vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with ID: " + vehicleId));
    }

    private Claim getClaimById(Integer claimId) {
        if (claimId == null) {
            return null; // Optional for maintenance appointments
        }
        return claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + claimId));
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));
    }

    private void validateBusinessRules(AppointmentCreateRequestDTO request, Vehicle vehicle, Claim claim) {
        // If claim is provided, ensure it belongs to the same vehicle
        if (claim != null && !claim.getVehicle().getId().equals(vehicle.getId())) {
            throw new ValidationException("Claim does not belong to the specified vehicle");
        }

        // Check if vehicle is still under warranty for warranty-related appointments
        if (claim != null && vehicle.getWarrantyEnd().isBefore(LocalDate.now())) {
            throw new ValidationException("Vehicle warranty has expired. Cannot create warranty appointment.");
        }

        // Check if claim is in a state that allows appointments
        if (claim != null) {
            String claimStatus = claim.getStatus().getCode();
            if ("COMPLETED".equals(claimStatus) || "REJECTED".equals(claimStatus) || "CANCELLED".equals(claimStatus)) {
                throw new ValidationException("Cannot create appointment for claim in status: " + claimStatus);
            }
        }
    }

    private void validateSchedulingConflicts(LocalDateTime scheduledAt, Integer vehicleId) {
        validateSchedulingConflicts(scheduledAt, vehicleId, null);
    }

    private void validateSchedulingConflicts(LocalDateTime scheduledAt, Integer vehicleId, Integer excludeAppointmentId) {
        // Check for conflicts (same vehicle within 2 hours)
        LocalDateTime conflictStart = scheduledAt.minusHours(2);
        LocalDateTime conflictEnd = scheduledAt.plusHours(2);

        List<Appointment> conflictingAppointments = appointmentRepository
                .findConflictingAppointments(vehicleId, conflictStart, conflictEnd, excludeAppointmentId);

        if (!conflictingAppointments.isEmpty()) {
            throw new ValidationException("Scheduling conflict: Another appointment exists within 2 hours for this vehicle");
        }

        // Check daily capacity (max 10 appointments per day)
        LocalDate appointmentDate = scheduledAt.toLocalDate();
        List<Appointment> dailyAppointments = appointmentRepository
                .findByScheduledAtBetweenOrderByScheduledAt(
                        appointmentDate.atStartOfDay(),
                        appointmentDate.atTime(23, 59, 59)
                );

        if (dailyAppointments.size() >= 10) {
            throw new ValidationException("Daily appointment capacity reached. Please choose another date.");
        }
    }

    private void validateStatusTransition(String currentStatus, String newStatus) {
        // Define valid status transitions
        boolean isValidTransition = switch (currentStatus) {
            case "scheduled" -> List.of("in_progress", "cancelled").contains(newStatus);
            case "in_progress" -> List.of("completed", "cancelled").contains(newStatus);
            case "completed", "cancelled" -> false; // Cannot change from final states
            default -> false;
        };

        if (!isValidTransition) {
            throw new ValidationException("Invalid status transition from '" + currentStatus + "' to '" + newStatus + "'");
        }
    }

    private void notifyCustomer(Appointment appointment) {
        // TODO: Implement customer notification logic (email/SMS)
        String customerEmail = appointment.getVehicle().getCustomer().getEmail();
        String message = String.format("Appointment scheduled for %s at %s for vehicle %s",
                appointment.getScheduledAt().toLocalDate(),
                appointment.getScheduledAt().toLocalTime(),
                appointment.getVehicle().getVin());

        log.info("Customer notification sent for appointment ID: {} to customer: {} - Message: {}",
                appointment.getId(), customerEmail, message);

        // In real implementation, you would call email/SMS service here
    }

    private void notifyCustomerUpdate(Appointment appointment, LocalDateTime originalSchedule) {
        // TODO: Implement customer update notification
        String customerEmail = appointment.getVehicle().getCustomer().getEmail();
        String message = String.format("Appointment updated from %s to %s for vehicle %s",
                originalSchedule.toLocalDate(),
                appointment.getScheduledAt().toLocalDate(),
                appointment.getVehicle().getVin());

        log.info("Update notification sent for appointment ID: {} to customer: {} - Message: {}",
                appointment.getId(), customerEmail, message);
    }

    private void notifyCustomerCancellation(Appointment appointment) {
        // TODO: Implement customer cancellation notification
        String customerEmail = appointment.getVehicle().getCustomer().getEmail();
        String message = String.format("Appointment cancelled for %s for vehicle %s",
                appointment.getScheduledAt().toLocalDate(),
                appointment.getVehicle().getVin());

        log.info("Cancellation notification sent for appointment ID: {} to customer: {} - Message: {}",
                appointment.getId(), customerEmail, message);
    }
}