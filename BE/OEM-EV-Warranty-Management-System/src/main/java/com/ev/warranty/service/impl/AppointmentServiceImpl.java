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

/**
 * Service xử lý logic liên quan đến lịch hẹn (Appointment):
 * - Tạo, cập nhật, hủy lịch hẹn.
 * - Tìm kiếm lịch hẹn theo nhiều tiêu chí (xe, claim, ngày, trạng thái, người tạo).
 * - Kiểm tra quy tắc nghiệp vụ và xung đột lịch.
 *
 * Lưu ý: lớp chỉ chứa logic nghiệp vụ; giao tiếp với DB qua repository.
 */
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

        // 1. Kiểm tra dữ liệu đầu vào cơ bản
        validateAppointmentRequest(request);

        // 2. Lấy thực thể liên quan
        Vehicle vehicle = getVehicleById(request.getVehicleId());
        Claim claim = getClaimById(request.getClaimId()); // Có thể null
        User createdByUser = getUserByUsername(createdBy);

        // 3. Kiểm tra quy tắc nghiệp vụ (claim thuộc vehicle, warranty, trạng thái claim)
        validateBusinessRules(vehicle, claim);

        // 4. Kiểm tra xung đột lịch cho cùng xe
        validateSchedulingConflicts(request.getScheduledAt(), vehicle.getId());

        // 5. Tạo và lưu appointment
        Appointment appointment = Appointment.builder()
                .vehicle(vehicle)
                .claim(claim)
                .scheduledAt(request.getScheduledAt())
                .createdBy(createdByUser)
                .status("scheduled")
                .notifiedCustomer(false)
                .build();

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // 6. Gửi thông báo khách nếu có yêu cầu
        if (Boolean.TRUE.equals(request.getNotifyCustomer())) {
            try {
                notifyCustomer(savedAppointment);
                savedAppointment.setNotifiedCustomer(true);
                appointmentRepository.save(savedAppointment);
                log.info("Customer notification sent successfully for appointment: {}", savedAppointment.getId());
            } catch (Exception e) {
                log.error("Failed to notify customer for appointment {}: {}", savedAppointment.getId(), e.getMessage());
                // Không ném ngoại lệ để không ngăn việc tạo appointment
            }
        }

        log.info("Appointment created with ID: {} for vehicle: {}", savedAppointment.getId(), vehicle.getVin());
        return appointmentMapper.toResponseDTO(savedAppointment);
    }

    @Override
    public Optional<AppointmentCreateResponseDTO> findById(Integer id) {
        return appointmentRepository.findById(id).map(appointmentMapper::toResponseDTO);
    }

    @Override
    public List<AppointmentCreateResponseDTO> findByVehicleId(Integer vehicleId) {
        log.debug("Finding appointments for vehicle ID: {}", vehicleId);
        List<Appointment> appointments = appointmentRepository.findByVehicleIdOrderByScheduledAtDesc(vehicleId);
        return appointments.stream().map(appointmentMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findByClaimId(Integer claimId) {
        log.debug("Finding appointments for claim ID: {}", claimId);
        List<Appointment> appointments = appointmentRepository.findByClaimIdOrderByScheduledAt(claimId);
        return appointments.stream().map(appointmentMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findByDate(LocalDate date) {
        log.debug("Finding appointments for date: {}", date);
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        List<Appointment> appointments = appointmentRepository.findByScheduledAtBetweenOrderByScheduledAt(startOfDay, endOfDay);
        return appointments.stream().map(appointmentMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findByStatus(String status) {
        log.debug("Finding appointments with status: {}", status);
        List<Appointment> appointments = appointmentRepository.findByStatusOrderByScheduledAt(status);
        return appointments.stream().map(appointmentMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findByCreatedBy(String username) {
        log.debug("Finding appointments created by: {}", username);
        User user = getUserByUsername(username);
        List<Appointment> appointments = appointmentRepository.findByCreatedByIdOrderByScheduledAtDesc(user.getId());
        return appointments.stream().map(appointmentMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentCreateResponseDTO updateAppointment(Integer id, AppointmentUpdateRequestDTO request, String updatedBy) {
        log.info("Updating appointment ID: {} by user: {}", id, updatedBy);

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Appointment not found with ID: " + id));

        // Lưu trạng thái và thời gian ban đầu để ghi log nếu thay đổi
        String originalStatus = appointment.getStatus();
        LocalDateTime originalSchedule = appointment.getScheduledAt();

        // Cập nhật thời gian nếu được cung cấp, kiểm tra xung đột
        if (request.getScheduledAt() != null) {
            validateSchedulingConflicts(request.getScheduledAt(), appointment.getVehicle().getId(), id);
            appointment.setScheduledAt(request.getScheduledAt());
        }

        // Cập nhật trạng thái nếu được cung cấp
        if (request.getStatus() != null) {
            validateStatusTransition(appointment.getStatus(), request.getStatus());
            appointment.setStatus(request.getStatus());
        }

        // Xử lý thông báo khách khi cập nhật
        if (request.getNotifyCustomer() != null) {
            if (Boolean.TRUE.equals(request.getNotifyCustomer())) {
                try {
                    notifyCustomerUpdate(appointment, originalSchedule);
                    appointment.setNotifiedCustomer(true);
                    log.info("Customer notified for appointment update: {}", id);
                } catch (Exception e) {
                    log.error("Failed to notify customer about appointment update {}: {}", id, e.getMessage());
                    appointment.setNotifiedCustomer(false);
                }
            } else {
                appointment.setNotifiedCustomer(false);
                log.info("Customer notification disabled for appointment: {}", id);
            }
        }

        Appointment updatedAppointment = appointmentRepository.save(appointment);

        // Ghi log nếu có thay đổi quan trọng
        if (!originalStatus.equals(updatedAppointment.getStatus())) {
            log.info("Appointment {} status changed from {} to {} by {}", id, originalStatus, updatedAppointment.getStatus(), updatedBy);
        }
        if (!originalSchedule.equals(updatedAppointment.getScheduledAt())) {
            log.info("Appointment {} rescheduled from {} to {} by {}", id, originalSchedule, updatedAppointment.getScheduledAt(), updatedBy);
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
        return appointments.stream().map(appointmentMapper::toResponseDTO).collect(Collectors.toList());
    }

    // Lấy các lịch hẹn trong ngày hiện tại
    @Override
    public List<AppointmentCreateResponseDTO> findTodayAppointments() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);
        List<Appointment> appointments = appointmentRepository.findTodayScheduledAppointments(startOfDay, endOfDay);
        return appointments.stream().map(appointmentMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findRecentAppointments(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<Appointment> appointments = appointmentRepository.findRecentAppointments(since);
        return appointments.stream().map(appointmentMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentCreateResponseDTO> findAppointmentsCreatedToday() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);
        List<Appointment> appointments = appointmentRepository.findAppointmentsCreatedToday(startOfDay, endOfDay);
        return appointments.stream().map(appointmentMapper::toResponseDTO).collect(Collectors.toList());
    }

    // ==================== CÁC PHƯƠNG THỨC HỖ TRỢ RIÊNG ====================

    // Kiểm tra dữ liệu yêu cầu cơ bản cho việc tạo lịch hẹn
    private void validateAppointmentRequest(AppointmentCreateRequestDTO request) {
        int hour = request.getScheduledAt().getHour();
        if (hour < 8 || hour >= 18) {
            throw new ValidationException("Appointments can only be scheduled between 8:00 AM and 6:00 PM");
        }
        int dayOfWeek = request.getScheduledAt().getDayOfWeek().getValue();
        if (dayOfWeek == 6 || dayOfWeek == 7) {
            throw new ValidationException("Appointments cannot be scheduled on weekends");
        }
        LocalDateTime maxFutureDate = LocalDateTime.now().plusMonths(3);
        if (request.getScheduledAt().isAfter(maxFutureDate)) {
            throw new ValidationException("Appointments cannot be scheduled more than 3 months in advance");
        }
    }

    // Lấy vehicle theo id
    private Vehicle getVehicleById(Integer vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with ID: " + vehicleId));
    }

    // Lấy claim nếu có, trả về null khi claimId = null
    private Claim getClaimById(Integer claimId) {
        if (claimId == null) return null;
        return claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + claimId));
    }

    // Lấy user theo username
    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));
    }

    // Kiểm tra các quy tắc nghiệp vụ trước khi tạo appointment
    private void validateBusinessRules(Vehicle vehicle, Claim claim) {
        if (claim != null && !claim.getVehicle().getId().equals(vehicle.getId())) {
            throw new ValidationException("Claim does not belong to the specified vehicle");
        }
        if (claim != null && vehicle.getWarrantyEnd() != null && vehicle.getWarrantyEnd().isBefore(LocalDate.now())) {
            throw new ValidationException("Vehicle warranty has expired. Cannot create warranty appointment.");
        }
        if (claim != null) {
            String claimStatus = claim.getStatus().getCode();
            if ("COMPLETED".equals(claimStatus) || "REJECTED".equals(claimStatus) || "CANCELLED".equals(claimStatus)) {
                throw new ValidationException("Cannot create appointment for claim in status: " + claimStatus);
            }
        }
    }

    // Kiểm tra xung đột lịch: +/-2 giờ cho cùng xe và giới hạn số lượng theo ngày
    private void validateSchedulingConflicts(LocalDateTime scheduledAt, Integer vehicleId) {
        validateSchedulingConflicts(scheduledAt, vehicleId, null);
    }

    private void validateSchedulingConflicts(LocalDateTime scheduledAt, Integer vehicleId, Integer excludeAppointmentId) {
        LocalDateTime conflictStart = scheduledAt.minusHours(2);
        LocalDateTime conflictEnd = scheduledAt.plusHours(2);
        List<Appointment> conflictingAppointments = appointmentRepository.findConflictingAppointments(vehicleId, conflictStart, conflictEnd, excludeAppointmentId);
        if (!conflictingAppointments.isEmpty()) {
            throw new ValidationException("Scheduling conflict: Another appointment exists within 2 hours for this vehicle");
        }
        LocalDate appointmentDate = scheduledAt.toLocalDate();
        List<Appointment> dailyAppointments = appointmentRepository.findByScheduledAtBetweenOrderByScheduledAt(appointmentDate.atStartOfDay(), appointmentDate.atTime(23, 59, 59));
        if (dailyAppointments.size() >= 10) {
            throw new ValidationException("Daily appointment capacity reached. Please choose another date.");
        }
    }

    // Kiểm tra chuyển trạng thái hợp lệ giữa các trạng thái của appointment
    private void validateStatusTransition(String currentStatus, String newStatus) {
        boolean isValidTransition = switch (currentStatus) {
            case "scheduled" -> List.of("in_progress", "cancelled").contains(newStatus);
            case "in_progress" -> List.of("completed", "cancelled").contains(newStatus);
            case "completed", "cancelled" -> false;
            default -> false;
        };
        if (!isValidTransition) {
            throw new ValidationException("Invalid status transition from '" + currentStatus + "' to '" + newStatus + "'");
        }
    }

    // Thông báo khách khi tạo
    private void notifyCustomer(Appointment appointment) {
        String customerEmail = appointment.getVehicle().getCustomer().getEmail();
        String message = String.format("Appointment scheduled for %s at %s for vehicle %s", appointment.getScheduledAt().toLocalDate(), appointment.getScheduledAt().toLocalTime(), appointment.getVehicle().getVin());
        log.info("Customer notification sent for appointment ID: {} to customer: {} - Message: {}", appointment.getId(), customerEmail, message);
    }

    // Thông báo khách khi cập nhật
    private void notifyCustomerUpdate(Appointment appointment, LocalDateTime originalSchedule) {
        String customerEmail = appointment.getVehicle().getCustomer().getEmail();
        String message = String.format("Appointment updated from %s to %s for vehicle %s", originalSchedule.toLocalDate(), appointment.getScheduledAt().toLocalDate(), appointment.getVehicle().getVin());
        log.info("Update notification sent for appointment ID: {} to customer: {} - Message: {}", appointment.getId(), customerEmail, message);
    }

    // Thông báo khách khi hủy
    private void notifyCustomerCancellation(Appointment appointment) {
        String customerEmail = appointment.getVehicle().getCustomer().getEmail();
        String message = String.format("Appointment cancelled for %s for vehicle %s", appointment.getScheduledAt().toLocalDate(), appointment.getVehicle().getVin());
        log.info("Cancellation notification sent for appointment ID: {} to customer: {} - Message: {}", appointment.getId(), customerEmail, message);
    }
}
