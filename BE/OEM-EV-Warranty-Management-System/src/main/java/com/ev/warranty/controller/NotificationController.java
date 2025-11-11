package com.ev.warranty.controller;

import com.ev.warranty.model.dto.notification.EmailNotificationRequestDTO;
import com.ev.warranty.model.dto.notification.SmsNotificationRequestDTO;
import com.ev.warranty.service.inter.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "APIs for sending email/SMS notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/email")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF')")
    @Operation(summary = "Send email notification")
    public ResponseEntity<?> sendEmail(@Valid @RequestBody EmailNotificationRequestDTO request, Authentication authentication) {
        notificationService.sendEmail(request, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sms")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN', 'ROLE_EVM_STAFF')")
    @Operation(summary = "Send SMS notification")
    public ResponseEntity<?> sendSms(@Valid @RequestBody SmsNotificationRequestDTO request, Authentication authentication) {
        notificationService.sendSms(request, authentication.getName());
        return ResponseEntity.ok().build();
    }
}
