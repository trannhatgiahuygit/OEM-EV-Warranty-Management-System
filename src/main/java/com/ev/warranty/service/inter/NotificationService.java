package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.claim.CustomerNotificationRequest;
import com.ev.warranty.model.dto.notification.EmailNotificationRequestDTO;
import com.ev.warranty.model.dto.notification.SmsNotificationRequestDTO;
import com.ev.warranty.model.entity.Appointment;
import com.ev.warranty.model.entity.Claim;

public interface NotificationService {
    void sendClaimCustomerNotification(Claim claim, CustomerNotificationRequest request, String initiatedBy);
    void sendAppointmentReminder(Appointment appointment, String window);
    void sendEmail(EmailNotificationRequestDTO request, String initiatedBy);
    void sendSms(SmsNotificationRequestDTO request, String initiatedBy);
}
