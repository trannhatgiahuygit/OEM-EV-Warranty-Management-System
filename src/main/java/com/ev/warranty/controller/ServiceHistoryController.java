package com.ev.warranty.controller;

import com.ev.warranty.model.dto.ServiceHistoryDto;
import com.ev.warranty.service.ServiceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/service-history")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ServiceHistoryController {

    private final ServiceHistoryService serviceHistoryService;

    // Create service history record
    @PostMapping
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ServiceHistoryDto> createServiceHistory(@RequestBody ServiceHistoryDto.CreateRequest request) {
        try {
            ServiceHistoryDto serviceHistory = serviceHistoryService.createServiceHistory(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(serviceHistory);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get service history by ID
    @GetMapping("/{serviceHistoryId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ServiceHistoryDto> getServiceHistoryById(@PathVariable Integer serviceHistoryId) {
        try {
            ServiceHistoryDto serviceHistory = serviceHistoryService.getServiceHistoryById(serviceHistoryId);
            return ResponseEntity.ok(serviceHistory);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Update service history
    @PutMapping("/{serviceHistoryId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ServiceHistoryDto> updateServiceHistory(@PathVariable Integer serviceHistoryId, @RequestBody ServiceHistoryDto.UpdateRequest request) {
        try {
            ServiceHistoryDto serviceHistory = serviceHistoryService.updateServiceHistory(serviceHistoryId, request);
            return ResponseEntity.ok(serviceHistory);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get service history by vehicle
    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ServiceHistoryDto>> getServiceHistoryByVehicle(@PathVariable Integer vehicleId) {
        List<ServiceHistoryDto> serviceHistories = serviceHistoryService.getServiceHistoryByVehicle(vehicleId);
        return ResponseEntity.ok(serviceHistories);
    }

    // Get service history by technician
    @GetMapping("/technician/{technicianId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ServiceHistoryDto>> getServiceHistoryByTechnician(@PathVariable Integer technicianId) {
        List<ServiceHistoryDto> serviceHistories = serviceHistoryService.getServiceHistoryByTechnician(technicianId);
        return ResponseEntity.ok(serviceHistories);
    }

    // Get service history by SC Staff
    @GetMapping("/sc-staff/{scStaffId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<ServiceHistoryDto>> getServiceHistoryByScStaff(@PathVariable Integer scStaffId) {
        List<ServiceHistoryDto> serviceHistories = serviceHistoryService.getServiceHistoryByScStaff(scStaffId);
        return ResponseEntity.ok(serviceHistories);
    }

    // Get service history by claim
    @GetMapping("/claim/{claimId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ServiceHistoryDto>> getServiceHistoryByClaim(@PathVariable Integer claimId) {
        List<ServiceHistoryDto> serviceHistories = serviceHistoryService.getServiceHistoryByClaim(claimId);
        return ResponseEntity.ok(serviceHistories);
    }

    // Get scheduled services
    @GetMapping("/scheduled")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ServiceHistoryDto>> getScheduledServices() {
        List<ServiceHistoryDto> serviceHistories = serviceHistoryService.getScheduledServices();
        return ResponseEntity.ok(serviceHistories);
    }

    // Get overdue scheduled services
    @GetMapping("/overdue")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<ServiceHistoryDto>> getOverdueScheduledServices() {
        List<ServiceHistoryDto> serviceHistories = serviceHistoryService.getOverdueScheduledServices();
        return ResponseEntity.ok(serviceHistories);
    }

    // Get service history by date range
    @GetMapping("/date-range")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ServiceHistoryDto>> getServiceHistoryByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<ServiceHistoryDto> serviceHistories = serviceHistoryService.getServiceHistoryByDateRange(startDate, endDate);
        return ResponseEntity.ok(serviceHistories);
    }

    // Get technician performance metrics
    @GetMapping("/technician/{technicianId}/performance")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<Long> getTechnicianPerformance(
            @PathVariable Integer technicianId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Long completedServices = serviceHistoryService.getTechnicianCompletedServicesCount(technicianId, startDate, endDate);
        return ResponseEntity.ok(completedServices);
    }
}
