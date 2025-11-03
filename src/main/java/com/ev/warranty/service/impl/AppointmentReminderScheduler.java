package com.ev.warranty.service.impl;

import com.ev.warranty.model.entity.Appointment;
import com.ev.warranty.repository.AppointmentRepository;
import com.ev.warranty.service.inter.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    // Run every hour to send 24h reminders
    @Scheduled(cron = "0 0 * * * *")
    public void send24hReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from = now.plusHours(23).plusMinutes(30);
        LocalDateTime to = now.plusHours(24).plusMinutes(30);
        List<Appointment> upcoming = appointmentRepository.findByScheduledAtBetweenOrderByScheduledAt(from, to);
        upcoming.forEach(a -> notificationService.sendAppointmentReminder(a, "24h"));
    }

    // Run every 15 minutes to send 2h reminders
    @Scheduled(cron = "0 */15 * * * *")
    public void send2hReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from = now.plusHours(1).plusMinutes(45);
        LocalDateTime to = now.plusHours(2).plusMinutes(15);
        List<Appointment> upcoming = appointmentRepository.findByScheduledAtBetweenOrderByScheduledAt(from, to);
        upcoming.forEach(a -> notificationService.sendAppointmentReminder(a, "2h"));
    }
}
