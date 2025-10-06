package com.ev.warranty.controller;

import com.ev.warranty.model.dto.CampaignVehicleDto;
import com.ev.warranty.service.CampaignVehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/campaign-vehicles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CampaignVehicleController {

    private final CampaignVehicleService campaignVehicleService;

    // Identify and add vehicles to campaign
    @PostMapping("/campaign/{campaignId}/identify")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<CampaignVehicleDto>> identifyVehiclesForCampaign(@PathVariable Integer campaignId) {
        try {
            List<CampaignVehicleDto> campaignVehicles = campaignVehicleService.identifyVehiclesForCampaign(campaignId);
            return ResponseEntity.status(HttpStatus.CREATED).body(campaignVehicles);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Send notification to customer
    @PostMapping("/{campaignVehicleId}/notify")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<CampaignVehicleDto> sendNotificationToCustomer(@PathVariable Integer campaignVehicleId) {
        try {
            CampaignVehicleDto campaignVehicle = campaignVehicleService.sendNotificationToCustomer(campaignVehicleId);
            return ResponseEntity.ok(campaignVehicle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Schedule campaign work
    @PostMapping("/{campaignVehicleId}/schedule")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<CampaignVehicleDto> scheduleCampaignWork(
            @PathVariable Integer campaignVehicleId,
            @RequestBody CampaignVehicleDto.ScheduleRequest request) {
        try {
            CampaignVehicleDto campaignVehicle = campaignVehicleService.scheduleCampaignWork(campaignVehicleId, request);
            return ResponseEntity.ok(campaignVehicle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Update campaign progress
    @PutMapping("/{campaignVehicleId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<CampaignVehicleDto> updateCampaignProgress(
            @PathVariable Integer campaignVehicleId,
            @RequestBody CampaignVehicleDto.UpdateRequest request) {
        try {
            CampaignVehicleDto campaignVehicle = campaignVehicleService.updateCampaignProgress(campaignVehicleId, request);
            return ResponseEntity.ok(campaignVehicle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get campaign vehicles by campaign
    @GetMapping("/campaign/{campaignId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<CampaignVehicleDto>> getCampaignVehiclesByCampaign(@PathVariable Integer campaignId) {
        List<CampaignVehicleDto> campaignVehicles = campaignVehicleService.getCampaignVehiclesByCampaign(campaignId);
        return ResponseEntity.ok(campaignVehicles);
    }

    // Get campaign vehicles by status
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<CampaignVehicleDto>> getCampaignVehiclesByStatus(@PathVariable String status) {
        List<CampaignVehicleDto> campaignVehicles = campaignVehicleService.getCampaignVehiclesByStatus(status);
        return ResponseEntity.ok(campaignVehicles);
    }

    // Get campaign vehicles assigned to technician
    @GetMapping("/technician/{technicianId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<CampaignVehicleDto>> getCampaignVehiclesByTechnician(@PathVariable Integer technicianId) {
        List<CampaignVehicleDto> campaignVehicles = campaignVehicleService.getCampaignVehiclesByTechnician(technicianId);
        return ResponseEntity.ok(campaignVehicles);
    }

    // Get campaign vehicles handled by SC Staff
    @GetMapping("/sc-staff/{scStaffId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<CampaignVehicleDto>> getCampaignVehiclesByScStaff(@PathVariable Integer scStaffId) {
        List<CampaignVehicleDto> campaignVehicles = campaignVehicleService.getCampaignVehiclesByScStaff(scStaffId);
        return ResponseEntity.ok(campaignVehicles);
    }

    // Get scheduled campaign work for date range
    @GetMapping("/scheduled")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<CampaignVehicleDto>> getScheduledCampaignWork(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<CampaignVehicleDto> campaignVehicles = campaignVehicleService.getScheduledCampaignWork(startDate, endDate);
        return ResponseEntity.ok(campaignVehicles);
    }

    // Get overdue campaign work
    @GetMapping("/overdue")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<CampaignVehicleDto>> getOverdueCampaignWork() {
        List<CampaignVehicleDto> campaignVehicles = campaignVehicleService.getOverdueCampaignWork();
        return ResponseEntity.ok(campaignVehicles);
    }

    // Get vehicles needing notification
    @GetMapping("/need-notification")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<CampaignVehicleDto>> getVehiclesNeedingNotification() {
        List<CampaignVehicleDto> campaignVehicles = campaignVehicleService.getVehiclesNeedingNotification();
        return ResponseEntity.ok(campaignVehicles);
    }

    // Get campaign progress summary
    @GetMapping("/campaign/{campaignId}/progress")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<CampaignVehicleDto.ProgressSummary> getCampaignProgress(@PathVariable Integer campaignId) {
        try {
            CampaignVehicleDto.ProgressSummary progress = campaignVehicleService.getCampaignProgress(campaignId);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
