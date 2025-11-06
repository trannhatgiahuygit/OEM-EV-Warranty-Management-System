package com.ev.warranty.model.dto.recall;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VehicleRecallNotificationDTO {

    private Integer id;
    private Integer campaignId;
    private String campaignCode;
    private String campaignTitle;
    private String campaignDescription;
    private String actionRequired;
    private String priority;

    // Vehicle information
    private Integer vehicleId;
    private String vin;
    private String licensePlate;
    private String model;
    private Integer year;

    // Customer information
    private Integer customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;

    // Notification status
    private Boolean notified;
    private LocalDateTime notifiedAt;
    private String notificationMethod; // email, sms, phone, mail
    private String notificationStatus; // sent, delivered, failed

    // Processing status
    private Boolean processed;
    private LocalDateTime processedAt;
    private String processingNotes;
    private String processingStatus; // scheduled, in_progress, completed, cancelled

    // Appointment information
    private Integer appointmentId;
    private LocalDateTime scheduledAt;
    private String appointmentStatus;
}
