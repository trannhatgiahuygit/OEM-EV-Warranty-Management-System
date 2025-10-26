package com.ev.warranty.controller;

import com.ev.warranty.model.dto.recall.RecallCampaignCreateRequestDTO;
import com.ev.warranty.model.dto.recall.RecallCampaignResponseDTO;
import com.ev.warranty.model.dto.recall.VehicleRecallNotificationDTO;
import com.ev.warranty.service.inter.RecallCampaignService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recall-campaigns")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Recall Campaigns", description = "APIs for managing recall campaigns and service campaigns")
public class RecallCampaignController {

    private final RecallCampaignService recallCampaignService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Create recall campaign", 
               description = "Create a new recall campaign for affected vehicles")
    public ResponseEntity<RecallCampaignResponseDTO> createCampaign(
            @Valid @RequestBody RecallCampaignCreateRequestDTO request,
            Authentication authentication) {
        
        String createdBy = authentication.getName();
        log.info("Creating recall campaign: {} by user: {}", request.getCode(), createdBy);
        
        RecallCampaignResponseDTO response = recallCampaignService.createCampaign(request, createdBy);
        
        log.info("Recall campaign created successfully: {}", response.getCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get all recall campaigns", 
               description = "Get paginated list of recall campaigns with filtering")
    public ResponseEntity<Page<RecallCampaignResponseDTO>> getAllCampaigns(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @Parameter(description = "Search by title or code") @RequestParam(required = false) String search) {
        
        log.info("Getting recall campaigns - page: {}, size: {}, status: {}, search: {}", page, size, status, search);
        
        Page<RecallCampaignResponseDTO> campaigns = recallCampaignService.getAllCampaigns(page, size, status, search);
        
        return ResponseEntity.ok(campaigns);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get campaign details", 
               description = "Get detailed information about a specific recall campaign")
    public ResponseEntity<RecallCampaignResponseDTO> getCampaignById(
            @Parameter(description = "Campaign ID") @PathVariable Integer id) {
        
        log.info("Getting recall campaign by ID: {}", id);
        
        RecallCampaignResponseDTO campaign = recallCampaignService.getCampaignById(id);
        
        return ResponseEntity.ok(campaign);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Update campaign status", 
               description = "Update the status of a recall campaign")
    public ResponseEntity<RecallCampaignResponseDTO> updateCampaignStatus(
            @Parameter(description = "Campaign ID") @PathVariable Integer id,
            @Parameter(description = "New status") @RequestParam String status,
            Authentication authentication) {
        
        String updatedBy = authentication.getName();
        log.info("Updating campaign status - ID: {}, status: {}, updatedBy: {}", id, status, updatedBy);
        
        RecallCampaignResponseDTO response = recallCampaignService.updateCampaignStatus(id, status, updatedBy);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/release")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Release campaign", 
               description = "Release a draft campaign and identify affected vehicles")
    public ResponseEntity<RecallCampaignResponseDTO> releaseCampaign(
            @Parameter(description = "Campaign ID") @PathVariable Integer id,
            Authentication authentication) {
        
        String releasedBy = authentication.getName();
        log.info("Releasing recall campaign - ID: {}, releasedBy: {}", id, releasedBy);
        
        RecallCampaignResponseDTO response = recallCampaignService.releaseCampaign(id, releasedBy);
        
        log.info("Campaign released successfully: {}", response.getCode());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/affected-vehicles")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get affected vehicles", 
               description = "Get list of vehicles affected by the recall campaign")
    public ResponseEntity<Page<VehicleRecallNotificationDTO>> getAffectedVehicles(
            @Parameter(description = "Campaign ID") @PathVariable Integer id,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        
        log.info("Getting affected vehicles for campaign: {}", id);
        
        Page<VehicleRecallNotificationDTO> vehicles = recallCampaignService.getAffectedVehicles(id, page, size);
        
        return ResponseEntity.ok(vehicles);
    }

    @PostMapping("/{id}/notify")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Notify affected vehicles", 
               description = "Send notifications to all affected vehicle owners")
    public ResponseEntity<List<VehicleRecallNotificationDTO>> notifyAffectedVehicles(
            @Parameter(description = "Campaign ID") @PathVariable Integer id,
            @Parameter(description = "Notification method") @RequestParam(defaultValue = "email") String notificationMethod) {
        
        log.info("Sending notifications for campaign: {}, method: {}", id, notificationMethod);
        
        List<VehicleRecallNotificationDTO> notifications = recallCampaignService.notifyAffectedVehicles(id, notificationMethod);
        
        log.info("Notifications sent for {} vehicles", notifications.size());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/vehicles/{vin}/notifications")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get vehicle recall notifications", 
               description = "Get all recall notifications for a specific vehicle")
    public ResponseEntity<List<VehicleRecallNotificationDTO>> getVehicleRecallNotifications(
            @Parameter(description = "Vehicle VIN") @PathVariable String vin) {
        
        log.info("Getting recall notifications for vehicle: {}", vin);
        
        List<VehicleRecallNotificationDTO> notifications = recallCampaignService.getVehicleRecallNotifications(vin);
        
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{id}/vehicles/{vin}/process")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Process vehicle recall", 
               description = "Mark a vehicle recall as processed")
    public ResponseEntity<VehicleRecallNotificationDTO> processVehicleRecall(
            @Parameter(description = "Campaign ID") @PathVariable Integer id,
            @Parameter(description = "Vehicle VIN") @PathVariable String vin,
            @Parameter(description = "Processing notes") @RequestParam(required = false) String processingNotes,
            Authentication authentication) {
        
        String processedBy = authentication.getName();
        log.info("Processing vehicle recall - campaign: {}, vin: {}, processedBy: {}", id, vin, processedBy);
        
        VehicleRecallNotificationDTO response = recallCampaignService.processVehicleRecall(id, vin, processingNotes, processedBy);
        
        log.info("Vehicle recall processed successfully: {}", vin);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/statistics")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get campaign statistics", 
               description = "Get detailed statistics for a recall campaign")
    public ResponseEntity<RecallCampaignResponseDTO> getCampaignStatistics(
            @Parameter(description = "Campaign ID") @PathVariable Integer id) {
        
        log.info("Getting campaign statistics for: {}", id);
        
        RecallCampaignResponseDTO statistics = recallCampaignService.getCampaignStatistics(id);
        
        return ResponseEntity.ok(statistics);
    }
}
