package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.appointment.AppointmentCreateResponseDTO;
import com.ev.warranty.model.entity.Appointment;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.ClaimStatus;
import com.ev.warranty.model.entity.Role;
import org.springframework.stereotype.Component;

@Component
public class AppointmentMapper {

    public AppointmentCreateResponseDTO toResponseDTO(Appointment appointment) {
        if (appointment == null) {
            return null;
        }

        return AppointmentCreateResponseDTO.builder()
                .id(appointment.getId())
                .scheduledAt(appointment.getScheduledAt())
                .status(appointment.getStatus())
                .notifiedCustomer(appointment.getNotifiedCustomer())
                .createdAt(appointment.getCreatedAt())
                .notes(extractNotesFromAppointment(appointment))
                .vehicle(mapVehicleBasic(appointment))
                .claim(mapClaimBasic(appointment))
                .createdBy(mapUserBasic(appointment))
                .build();
    }

    private String extractNotesFromAppointment(Appointment appointment) {
        // Extract notes from claim or return custom notes
        if (appointment.getClaim() != null && appointment.getClaim().getReportedFailure() != null) {
            return "Warranty Issue: " + appointment.getClaim().getReportedFailure();
        }
        return "Routine maintenance appointment";
    }

    private AppointmentCreateResponseDTO.VehicleBasicDTO mapVehicleBasic(Appointment appointment) {
        if (appointment.getVehicle() == null) {
            return null;
        }

        return AppointmentCreateResponseDTO.VehicleBasicDTO.builder()
                .id(appointment.getVehicle().getId())
                .vin(appointment.getVehicle().getVin())
                .model(appointment.getVehicle().getModel())
                .year(appointment.getVehicle().getYear())
                .customer(mapCustomerBasic(appointment))
                .build();
    }

    private AppointmentCreateResponseDTO.VehicleBasicDTO.CustomerBasicDTO mapCustomerBasic(Appointment appointment) {
        if (appointment.getVehicle() == null || appointment.getVehicle().getCustomer() == null) {
            return null;
        }

        return AppointmentCreateResponseDTO.VehicleBasicDTO.CustomerBasicDTO.builder()
                .id(appointment.getVehicle().getCustomer().getId())
                .name(appointment.getVehicle().getCustomer().getName())
                .email(appointment.getVehicle().getCustomer().getEmail())
                .phone(appointment.getVehicle().getCustomer().getPhone())
                .build();
    }

    private AppointmentCreateResponseDTO.ClaimBasicDTO mapClaimBasic(Appointment appointment) {
        if (appointment.getClaim() == null) {
            return null;
        }

        Claim claim = appointment.getClaim();
        return AppointmentCreateResponseDTO.ClaimBasicDTO.builder()
                .id(claim.getId())
                .claimNumber(claim.getClaimNumber())
                .reportedFailure(claim.getReportedFailure())
                .status(getClaimStatus(claim))
                .createdAt(claim.getCreatedAt())
                .build();
    }

    private String getClaimStatus(Claim claim) {
        // Get status from claim_statuses table
        if (claim.getStatus() != null) {
            ClaimStatus claimStatus = claim.getStatus();
            return claimStatus.getLabel(); // Return human-readable label
        }
        return "Unknown";
    }

    private AppointmentCreateResponseDTO.UserBasicDTO mapUserBasic(Appointment appointment) {
        if (appointment.getCreatedBy() == null) {
            return null;
        }

        return AppointmentCreateResponseDTO.UserBasicDTO.builder()
                .id(appointment.getCreatedBy().getId())
                .username(appointment.getCreatedBy().getUsername())
                .fullName(appointment.getCreatedBy().getFullName())
                .role(getUserRole(appointment.getCreatedBy()))
                .build();
    }

    private String getUserRole(com.ev.warranty.model.entity.User user) {
        // Get role name from user's role
        if (user.getRole() != null) {
            Role role = user.getRole();
            return role.getRoleName(); // Return role name like "SC_STAFF"
        }
        return "Unknown";
    }
}