package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.claim.CustomerNotificationRequest;
import com.ev.warranty.model.dto.claim.ProblemReportRequest;
import com.ev.warranty.model.dto.claim.ProblemResolutionRequest;
import com.ev.warranty.model.dto.claim.ClaimResubmitRequest;
import com.ev.warranty.model.dto.notification.SmsNotificationRequestDTO;
import com.ev.warranty.model.entity.Appointment;
import com.ev.warranty.model.entity.Claim;

public interface NotificationService {
    void sendClaimCustomerNotification(Claim claim, CustomerNotificationRequest request, String initiatedBy);
    void sendAppointmentReminder(Appointment appointment, String window);
    void sendSms(SmsNotificationRequestDTO request, String initiatedBy);

    // 🆕 Problem/Rejection notifications (default to logs)
    default void notifyEvmStaffAboutProblem(Claim claim, ProblemReportRequest request) {}
    default void notifyTechnicianAboutResolution(Claim claim, ProblemResolutionRequest request) {}
    default void notifyEvmStaffAboutResubmission(Claim claim, ClaimResubmitRequest request) {}

    // Generic event notification for audit/logging (cancel flow, etc)
    default void sendClaimEventNotification(Claim claim, String eventType, String initiatedBy, String note) {}
}
