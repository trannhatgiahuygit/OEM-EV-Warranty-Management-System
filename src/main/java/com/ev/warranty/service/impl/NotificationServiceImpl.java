package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.claim.CustomerNotificationRequest;
import com.ev.warranty.model.dto.notification.EmailNotificationRequestDTO;
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
        log.info("[NOTIFY] user={} claim={} customer={} channels={} type={} message=\"{}\"", initiatedBy,
                claim.getClaimNumber(), claim.getCustomer().getId(), request.getChannels(), request.getNotificationType(), request.getMessage());
    }

    @Override
    public void sendAppointmentReminder(Appointment appointment, String window) {
        log.info("[REMINDER] window={} appointmentId={} vehicleId={} customerId={}", window,
                appointment.getId(), appointment.getVehicle().getId(), appointment.getVehicle().getCustomer().getId());
    }

    @Override
    public void sendEmail(EmailNotificationRequestDTO request, String initiatedBy) {
        log.info("[EMAIL] by={} to={} subject=\"{}\" length={} chars", initiatedBy,
                request.getRecipientEmail(), request.getSubject(), request.getBody() != null ? request.getBody().length() : 0);
    }

    @Override
    public void sendSms(SmsNotificationRequestDTO request, String initiatedBy) {
        log.info("[SMS] by={} to={} length={} chars", initiatedBy,
                request.getRecipientPhone(), request.getMessage() != null ? request.getMessage().length() : 0);
    }
}
