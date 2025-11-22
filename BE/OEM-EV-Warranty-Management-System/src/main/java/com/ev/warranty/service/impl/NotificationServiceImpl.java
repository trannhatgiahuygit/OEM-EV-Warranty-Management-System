package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.claim.CustomerNotificationRequest;
import com.ev.warranty.model.dto.claim.ProblemReportRequest;
import com.ev.warranty.model.dto.claim.ProblemResolutionRequest;
import com.ev.warranty.model.dto.claim.ClaimResubmitRequest;
import com.ev.warranty.model.dto.notification.SmsNotificationRequestDTO;
import com.ev.warranty.model.entity.Appointment;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.service.inter.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationServiceImpl implements NotificationService {
    @Override
    public void sendClaimCustomerNotification(Claim claim, CustomerNotificationRequest request, String initiatedBy) {
        log.info("[NOTIFY] user={} claim={} customer={} type={} message=\"{}\"", initiatedBy,
                claim.getClaimNumber(), claim.getCustomer().getId(), request.getNotificationType(), request.getMessage());
    }

    @Override
    public void sendClaimEventNotification(Claim claim, String eventType, String initiatedBy, String note) {
        log.info("[CLAIM_EVENT] event={} user={} claim={} note=\"{}\"", eventType, initiatedBy, claim.getClaimNumber(), note);
    }

    @Override
    public void sendAppointmentReminder(Appointment appointment, String window) {
        log.info("[REMINDER] window={} appointmentId={} vehicleId={} customerId={}", window,
                appointment.getId(), appointment.getVehicle().getId(), appointment.getVehicle().getCustomer().getId());
    }

    @Override
    public void sendSms(SmsNotificationRequestDTO request, String initiatedBy) {
        log.info("[SMS] by={} to={} length={} chars", initiatedBy,
                request.getRecipientPhone(), request.getMessage() != null ? request.getMessage().length() : 0);
    }

    @Override
    public void notifyEvmStaffAboutProblem(Claim claim, ProblemReportRequest request) {
        log.info("[EVM_ALERT] Problem reported for claim {} type={} desc=\"{}\"",
                claim.getClaimNumber(), request.getProblemType(), request.getProblemDescription());
    }

    @Override
    public void notifyTechnicianAboutResolution(Claim claim, ProblemResolutionRequest request) {
        log.info("[TECH_ALERT] Problem resolved for claim {} action={} notes=\"{}\" tracking={}",
                claim.getClaimNumber(), request.getResolutionAction(), request.getResolutionNotes(), request.getTrackingNumber());
    }

    @Override
    public void notifyEvmStaffAboutResubmission(Claim claim, ClaimResubmitRequest request) {
        log.info("[EVM_ALERT] Claim {} resubmitted. RevisedDiagnostic length={} chars",
                claim.getClaimNumber(), request.getRevisedDiagnostic() != null ? request.getRevisedDiagnostic().length() : 0);
    }
}
