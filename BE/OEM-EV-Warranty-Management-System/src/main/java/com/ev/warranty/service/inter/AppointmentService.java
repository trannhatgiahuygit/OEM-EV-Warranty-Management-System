package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.appointment.AppointmentCreateRequestDTO;
import com.ev.warranty.model.dto.appointment.AppointmentCreateResponseDTO;
import com.ev.warranty.model.dto.appointment.AppointmentUpdateRequestDTO;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AppointmentService {
    AppointmentCreateResponseDTO createAppointment(AppointmentCreateRequestDTO request, String createdBy);
    Optional<AppointmentCreateResponseDTO> findById(Integer id);
    List<AppointmentCreateResponseDTO> findByVehicleId(Integer vehicleId);
    List<AppointmentCreateResponseDTO> findByClaimId(Integer claimId);
    List<AppointmentCreateResponseDTO> findByDate(LocalDate date);
    List<AppointmentCreateResponseDTO> findByStatus(String status);
    List<AppointmentCreateResponseDTO> findByCreatedBy(String username);
    AppointmentCreateResponseDTO updateAppointment(Integer id, AppointmentUpdateRequestDTO request, String updatedBy);
    void cancelAppointment(Integer id, String cancelledBy);
    List<AppointmentCreateResponseDTO> findAllAppointments();
    List<AppointmentCreateResponseDTO> findTodayAppointments();
    List<AppointmentCreateResponseDTO> findRecentAppointments(int hours);
    List<AppointmentCreateResponseDTO> findAppointmentsCreatedToday();
}