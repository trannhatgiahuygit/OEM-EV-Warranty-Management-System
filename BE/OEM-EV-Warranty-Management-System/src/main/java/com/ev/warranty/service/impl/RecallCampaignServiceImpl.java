package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.recall.RecallCampaignCreateRequestDTO;
import com.ev.warranty.model.dto.recall.RecallCampaignResponseDTO;
import com.ev.warranty.model.dto.recall.VehicleRecallNotificationDTO;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import com.ev.warranty.service.inter.RecallCampaignService;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecallCampaignServiceImpl implements RecallCampaignService {

    private final RecallCampaignRepository recallCampaignRepository;
    private final CampaignVehicleRepository campaignVehicleRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final com.ev.warranty.repository.CampaignItemRepository campaignItemRepository;
    private final com.ev.warranty.repository.ClaimRepository claimRepository;
    private final com.ev.warranty.repository.ClaimItemRepository claimItemRepository;
    private final com.ev.warranty.repository.ClaimStatusRepository claimStatusRepository;

    @Override
    @Transactional
    public RecallCampaignResponseDTO createCampaign(RecallCampaignCreateRequestDTO request, String createdBy) {
        log.info("Creating recall campaign: {} by user: {}", request.getCode(), createdBy);

        // Check if campaign code already exists
        if (recallCampaignRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Campaign code already exists: " + request.getCode());
        }

        User createdByUser = userRepository.findByUsername(createdBy)
                .orElseThrow(() -> new NotFoundException("User not found: " + createdBy));

        RecallCampaign campaign = RecallCampaign.builder()
                .code(request.getCode())
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .releasedAt(request.getReleasedAt())
                .priority(request.getPriority())
                .actionRequired(request.getActionRequired())
                .estimatedRepairHours(request.getEstimatedRepairHours())
                .createdBy(createdByUser)
                .build();

        RecallCampaign savedCampaign = recallCampaignRepository.save(campaign);

        // Automatically identify and index affected vehicles based on affectedModels and affectedYears
        if (request.getAffectedModels() != null && !request.getAffectedModels().isEmpty() &&
            request.getAffectedYears() != null && !request.getAffectedYears().isEmpty()) {
            log.info("Identifying affected vehicles for campaign {} based on models and years", savedCampaign.getCode());
            List<Vehicle> affectedVehicles = identifyAffectedVehiclesByModelsAndYears(
                    request.getAffectedModels(), 
                    request.getAffectedYears()
            );
            if (!affectedVehicles.isEmpty()) {
                createCampaignVehicleRecords(savedCampaign, affectedVehicles);
                log.info("Created {} campaign vehicle records for campaign {}", 
                        affectedVehicles.size(), savedCampaign.getCode());
            } else {
                log.warn("No vehicles found matching the criteria for campaign {}", savedCampaign.getCode());
            }
        } else {
            log.info("No affected models/years specified, skipping vehicle identification");
        }

        log.info("Recall campaign created successfully: {}", savedCampaign.getCode());
        return mapToResponseDTO(savedCampaign, request);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RecallCampaignResponseDTO> getAllCampaigns(int page, int size, String status, String search) {
        log.info("Getting recall campaigns - page: {}, size: {}, status: {}, search: {}", page, size, status, search);

        Pageable pageable = PageRequest.of(page, size);
        Page<RecallCampaign> campaigns;

        if (status != null && !status.isEmpty()) {
            campaigns = recallCampaignRepository.findByStatusContainingIgnoreCase(status, pageable);
        } else if (search != null && !search.isEmpty()) {
            campaigns = recallCampaignRepository.findByTitleContainingIgnoreCaseOrCodeContainingIgnoreCase(search, search, pageable);
        } else {
            campaigns = recallCampaignRepository.findAll(pageable);
        }

        return campaigns.map(this::mapToResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public RecallCampaignResponseDTO getCampaignById(Integer campaignId) {
        log.info("Getting recall campaign by ID: {}", campaignId);

        RecallCampaign campaign = recallCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new NotFoundException("Recall campaign not found with ID: " + campaignId));

        // Try to get affectedModels and affectedYears from campaign vehicles
        // Since we don't store them in entity, we'll extract from existing vehicles
        List<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findByCampaignId(campaignId);
        List<String> affectedModels = campaignVehicles.stream()
                .map(cv -> cv.getVehicle().getModel())
                .filter(model -> model != null)
                .distinct()
                .collect(Collectors.toList());
        
        List<Integer> affectedYears = campaignVehicles.stream()
                .map(cv -> cv.getVehicle().getYear())
                .filter(year -> year != null)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        
        RecallCampaignResponseDTO response = mapToResponseDTO(campaign);
        if (!affectedModels.isEmpty()) {
            response.setAffectedModels(affectedModels);
        }
        if (!affectedYears.isEmpty()) {
            response.setAffectedYears(affectedYears);
        }
        
        return response;
    }

    @Override
    @Transactional
    public RecallCampaignResponseDTO updateCampaignStatus(Integer campaignId, String status, String updatedBy) {
        log.info("Updating campaign status - ID: {}, status: {}, updatedBy: {}", campaignId, status, updatedBy);

        RecallCampaign campaign = recallCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new NotFoundException("Recall campaign not found with ID: " + campaignId));

        campaign.setStatus(status);
        
        // Set releasedAt when status changes to "active" and releasedAt is not already set
        if ("active".equals(status) && campaign.getReleasedAt() == null) {
            campaign.setReleasedAt(LocalDateTime.now());
            log.info("Setting releasedAt to current time for campaign: {}", campaign.getCode());
        }
        
        RecallCampaign updatedCampaign = recallCampaignRepository.save(campaign);

        log.info("Campaign status updated successfully: {}", updatedCampaign.getCode());
        return mapToResponseDTO(updatedCampaign);
    }

    @Override
    @Transactional
    public RecallCampaignResponseDTO releaseCampaign(Integer campaignId, String releasedBy) {
        log.info("Releasing recall campaign - ID: {}, releasedBy: {}", campaignId, releasedBy);

        RecallCampaign campaign = recallCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new NotFoundException("Recall campaign not found with ID: " + campaignId));

        if (!"draft".equals(campaign.getStatus())) {
            throw new BadRequestException("Only draft campaigns can be released");
        }

        // Update campaign status
        campaign.setStatus("active");
        campaign.setReleasedAt(LocalDateTime.now());
        RecallCampaign updatedCampaign = recallCampaignRepository.save(campaign);

        // Identify affected vehicles and create campaign vehicle records
        List<Vehicle> affectedVehicles = identifyAffectedVehicles(campaign);
        createCampaignVehicleRecords(updatedCampaign, affectedVehicles);

        log.info("Campaign released successfully: {}, affected vehicles: {}", 
                updatedCampaign.getCode(), affectedVehicles.size());

        return mapToResponseDTO(updatedCampaign);
    }

    // ==================== NEW: Create claim/work order from campaign (skip approval) ====================
    @Transactional
    public com.ev.warranty.model.dto.claim.ClaimResponseDto createRepairOrderFromCampaign(Integer campaignId, String vin, String createdBy) {
        var campaign = recallCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new com.ev.warranty.exception.NotFoundException("Recall campaign not found with ID: " + campaignId));

        var vehicle = vehicleRepository.findByVin(vin)
                .orElseThrow(() -> new com.ev.warranty.exception.NotFoundException("Vehicle not found with VIN: " + vin));

        var createdByUser = userRepository.findByUsername(createdBy)
                .orElseThrow(() -> new com.ev.warranty.exception.NotFoundException("User not found: " + createdBy));

        // Create claim and set READY_FOR_REPAIR
        var status = claimStatusRepository.findByCode("READY_FOR_REPAIR")
                .orElseThrow(() -> new com.ev.warranty.exception.NotFoundException("READY_FOR_REPAIR status not found"));

        var claim = com.ev.warranty.model.entity.Claim.builder()
                .claimNumber("CLM-" + java.time.LocalDate.now().getYear() + "-" + String.format("%06d", System.currentTimeMillis() % 1000000))
                .vehicle(vehicle)
                .customer(vehicle.getCustomer())
                .createdBy(createdByUser)
                .status(status)
                .build();

        // Set diagnostic through ClaimDiagnostic entity
        com.ev.warranty.model.entity.ClaimDiagnostic diagnostic = com.ev.warranty.model.entity.ClaimDiagnostic.builder()
                .claim(claim)
                .reportedFailure("Recall/Campaign: " + campaign.getTitle())
                .initialDiagnosis("Auto-generated from campaign")
                .build();
        claim.setDiagnostic(diagnostic);

        claim = claimRepository.save(claim);

        // Get vehicle type for validation
        String vehicleType = null;
        if (vehicle.getVehicleModel() != null && vehicle.getVehicleModel().getType() != null) {
            vehicleType = vehicle.getVehicleModel().getType();
        }

        // Create claim items from campaign items
        var items = campaignItemRepository.findByCampaignId(campaignId);
        for (var ci : items) {
            // Validate part type matches vehicle type for PART items
            if ("PART".equalsIgnoreCase(ci.getItemType()) && ci.getPart() != null) {
                if (vehicleType != null && ci.getPart().getType() != null) {
                    if (!vehicleType.equalsIgnoreCase(ci.getPart().getType())) {
                        log.warn("Part type '{}' in campaign does not match vehicle type '{}' for VIN {}. Part: {}",
                                ci.getPart().getType(), vehicleType, vin, ci.getPart().getName());
                        // Continue but log warning - campaign items should already be validated when campaign was created
                    }
                }
            }
            
            var claimItem = com.ev.warranty.model.entity.ClaimItem.builder()
                    .claim(claim)
                    .itemType(ci.getItemType().equalsIgnoreCase("SERVICE") ? "SERVICE" : "PART")
                    .part(ci.getPart())
                    .serviceItem(ci.getServiceItem())
                    .quantity(ci.getQuantity())
                    .costType("WARRANTY")
                    .status("APPROVED")
                    .notes("Auto from campaign")
                    .build();
            claimItemRepository.save(claimItem);
        }

        // Mark campaign vehicle as processed if exists
        campaignVehicleRepository.findByCampaignIdAndVehicleId(campaignId, vehicle.getId())
                .ifPresent(cv -> {
                    cv.setProcessed(true);
                    cv.setProcessedAt(java.time.LocalDateTime.now());
                    campaignVehicleRepository.save(cv);
                });

        // Map to response DTO minimally
        com.ev.warranty.model.dto.claim.ClaimResponseDto dto = new com.ev.warranty.model.dto.claim.ClaimResponseDto();
        dto.setId(claim.getId());
        dto.setClaimNumber(claim.getClaimNumber());
        dto.setStatus(claim.getStatus().getCode());
        // Reuse diagnostic from claim (already set above)
        dto.setReportedFailure(diagnostic != null ? diagnostic.getReportedFailure() : null);
        dto.setInitialDiagnosis(diagnostic != null ? diagnostic.getInitialDiagnosis() : null);
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleRecallNotificationDTO> getAffectedVehicles(Integer campaignId, int page, int size) {
        log.info("Getting affected vehicles for campaign: {}", campaignId);

        Pageable pageable = PageRequest.of(page, size);
        Page<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findByCampaignId(campaignId, pageable);

        return campaignVehicles.map(this::mapToVehicleNotificationDTO);
    }

    @Override
    @Transactional
    public List<VehicleRecallNotificationDTO> notifyAffectedVehicles(Integer campaignId, String notificationMethod) {
        log.info("Sending notifications for campaign: {}, method: {}", campaignId, notificationMethod);

        RecallCampaign campaign = recallCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new NotFoundException("Recall campaign not found with ID: " + campaignId));

        List<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findByCampaignId(campaignId);
        
        List<VehicleRecallNotificationDTO> notifications = campaignVehicles.stream()
                .map(cv -> {
                    // Mark as notified
                    cv.setNotified(true);
                    campaignVehicleRepository.save(cv);
                    
                    return mapToVehicleNotificationDTO(cv);
                })
                .collect(Collectors.toList());

        log.info("Notifications sent for {} vehicles in campaign: {}", notifications.size(), campaign.getCode());
        return notifications;
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleRecallNotificationDTO> getVehicleRecallNotifications(String vin) {
        log.info("Getting recall notifications for vehicle: {}", vin);

        Vehicle vehicle = vehicleRepository.findByVin(vin)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + vin));

        List<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findByVehicleId(vehicle.getId());
        
        return campaignVehicles.stream()
                .map(this::mapToVehicleNotificationDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VehicleRecallNotificationDTO processVehicleRecall(Integer campaignId, String vin, String processingNotes, String processedBy) {
        log.info("Processing vehicle recall - campaign: {}, vin: {}, processedBy: {}", campaignId, vin, processedBy);

        Vehicle vehicle = vehicleRepository.findByVin(vin)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + vin));

        CampaignVehicle campaignVehicle = campaignVehicleRepository.findByCampaignIdAndVehicleId(campaignId, vehicle.getId())
                .orElseThrow(() -> new NotFoundException("Campaign vehicle record not found"));

        campaignVehicle.setProcessed(true);
        campaignVehicle.setProcessedAt(LocalDateTime.now());
        campaignVehicleRepository.save(campaignVehicle);

        log.info("Vehicle recall processed successfully: {}", vin);
        return mapToVehicleNotificationDTO(campaignVehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public RecallCampaignResponseDTO getCampaignStatistics(Integer campaignId) {
        log.info("Getting campaign statistics for: {}", campaignId);

        RecallCampaign campaign = recallCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new NotFoundException("Recall campaign not found with ID: " + campaignId));

        List<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findByCampaignId(campaignId);
        
        int totalAffected = campaignVehicles.size();
        int notified = (int) campaignVehicles.stream().filter(CampaignVehicle::getNotified).count();
        int processed = (int) campaignVehicles.stream().filter(CampaignVehicle::getProcessed).count();
        int pending = totalAffected - processed;

        RecallCampaignResponseDTO response = mapToResponseDTO(campaign);
        response.setTotalAffectedVehicles(totalAffected);
        response.setNotifiedVehicles(notified);
        response.setProcessedVehicles(processed);
        response.setPendingVehicles(pending);
        response.setCompletionPercentage(totalAffected > 0 ? (double) processed / totalAffected * 100 : 0.0);

        return response;
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private List<Vehicle> identifyAffectedVehicles(RecallCampaign campaign) {
        // Identify vehicles affected by the recall campaign based on:
        // 1. Vehicle type must match part types in campaign items
        // 2. Additional criteria from campaign (if available in future)
        log.info("Identifying affected vehicles for campaign: {}", campaign.getCode());
        
        // Get campaign items to determine part types
        List<CampaignItem> campaignItems = campaignItemRepository.findByCampaignId(campaign.getId());
        
        // Extract unique part types from campaign items
        Set<String> campaignPartTypes = campaignItems.stream()
                .filter(item -> item.getPart() != null && item.getPart().getType() != null)
                .map(item -> item.getPart().getType())
                .collect(Collectors.toSet());
        
        // If no part types found, return empty list (campaign has no parts)
        if (campaignPartTypes.isEmpty()) {
            log.warn("Campaign {} has no parts with type information", campaign.getCode());
            return new ArrayList<>();
        }
        
        log.info("Campaign part types: {}", campaignPartTypes);
        
        // Filter vehicles by vehicle type matching campaign part types
        List<Vehicle> affectedVehicles = vehicleRepository.findAll().stream()
                .filter(vehicle -> {
                    // Check if vehicle has a model with type
                    if (vehicle.getVehicleModel() == null || vehicle.getVehicleModel().getType() == null) {
                        return false;
                    }
                    
                    String vehicleType = vehicle.getVehicleModel().getType();
                    
                    // Vehicle type must match at least one campaign part type
                    boolean matches = campaignPartTypes.stream()
                            .anyMatch(partType -> partType.equalsIgnoreCase(vehicleType));
                    
                    if (matches) {
                        log.debug("Vehicle {} (type: {}) matches campaign part types", vehicle.getVin(), vehicleType);
                    }
                    
                    return matches;
                })
                .collect(Collectors.toList());
        
        log.info("Identified {} affected vehicles for campaign {}", affectedVehicles.size(), campaign.getCode());
        return affectedVehicles;
    }

    private void createCampaignVehicleRecords(RecallCampaign campaign, List<Vehicle> vehicles) {
        List<CampaignVehicle> campaignVehicles = vehicles.stream()
                .map(vehicle -> CampaignVehicle.builder()
                        .campaign(campaign)
                        .vehicle(vehicle)
                        .notified(false)
                        .processed(false)
                        .build())
                .collect(Collectors.toList());

        campaignVehicleRepository.saveAll(campaignVehicles);
    }

    /**
     * Identify affected vehicles based on model names and years
     */
    private List<Vehicle> identifyAffectedVehiclesByModelsAndYears(
            List<String> affectedModels, 
            List<Integer> affectedYears) {
        log.info("Identifying vehicles for models: {} and years: {}", affectedModels, affectedYears);
        
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        
        List<Vehicle> affectedVehicles = allVehicles.stream()
                .filter(vehicle -> {
                    // Check if vehicle model name matches any affected model
                    boolean modelMatches = false;
                    if (vehicle.getModel() != null) {
                        modelMatches = affectedModels.stream()
                                .anyMatch(model -> vehicle.getModel().equalsIgnoreCase(model));
                    }
                    
                    // Also check vehicleModel name if available
                    if (!modelMatches && vehicle.getVehicleModel() != null && 
                        vehicle.getVehicleModel().getName() != null) {
                        modelMatches = affectedModels.stream()
                                .anyMatch(model -> vehicle.getVehicleModel().getName().equalsIgnoreCase(model));
                    }
                    
                    // Check if vehicle year matches any affected year
                    boolean yearMatches = vehicle.getYear() != null && 
                            affectedYears.contains(vehicle.getYear());
                    
                    return modelMatches && yearMatches;
                })
                .collect(Collectors.toList());
        
        log.info("Identified {} affected vehicles for models {} and years {}", 
                affectedVehicles.size(), affectedModels, affectedYears);
        
        return affectedVehicles;
    }

    private RecallCampaignResponseDTO mapToResponseDTO(RecallCampaign campaign) {
        return mapToResponseDTO(campaign, null);
    }

    private RecallCampaignResponseDTO mapToResponseDTO(RecallCampaign campaign, RecallCampaignCreateRequestDTO request) {
        RecallCampaignResponseDTO.RecallCampaignResponseDTOBuilder builder = RecallCampaignResponseDTO.builder()
                .id(campaign.getId())
                .code(campaign.getCode())
                .title(campaign.getTitle())
                .description(campaign.getDescription())
                .status(campaign.getStatus())
                .releasedAt(campaign.getReleasedAt())
                .priority(campaign.getPriority())
                .actionRequired(campaign.getActionRequired())
                .estimatedRepairHours(campaign.getEstimatedRepairHours())
                .createdAt(LocalDateTime.now()) // Use current time as fallback
                .createdBy(campaign.getCreatedBy() != null ? campaign.getCreatedBy().getUsername() : null);
        
        // Include affectedModels and affectedYears from request if available
        if (request != null) {
            builder.affectedModels(request.getAffectedModels())
                   .affectedYears(request.getAffectedYears())
                   .estimatedDurationDays(request.getEstimatedDurationDays());
            
            // Override with request values if provided (for create/update operations)
            if (request.getActionRequired() != null) {
                builder.actionRequired(request.getActionRequired());
            }
            if (request.getPriority() != null) {
                builder.priority(request.getPriority());
            }
            if (request.getEstimatedRepairHours() != null) {
                builder.estimatedRepairHours(request.getEstimatedRepairHours());
            }
        }
        
        // Get campaign statistics
        Long totalVehicles = campaignVehicleRepository.countByCampaignId(campaign.getId());
        Long notifiedVehicles = campaignVehicleRepository.countNotifiedByCampaignId(campaign.getId());
        Long processedVehicles = campaignVehicleRepository.countProcessedByCampaignId(campaign.getId());
        
        builder.totalAffectedVehicles(totalVehicles != null ? totalVehicles.intValue() : 0)
               .notifiedVehicles(notifiedVehicles != null ? notifiedVehicles.intValue() : 0)
               .processedVehicles(processedVehicles != null ? processedVehicles.intValue() : 0)
               .pendingVehicles(totalVehicles != null && processedVehicles != null ? 
                       (totalVehicles.intValue() - processedVehicles.intValue()) : 0);
        
        return builder.build();
    }

    private VehicleRecallNotificationDTO mapToVehicleNotificationDTO(CampaignVehicle campaignVehicle) {
        Vehicle vehicle = campaignVehicle.getVehicle();
        Customer customer = vehicle.getCustomer();

        return VehicleRecallNotificationDTO.builder()
                .id(campaignVehicle.getId())
                .campaignId(campaignVehicle.getCampaign().getId())
                .campaignCode(campaignVehicle.getCampaign().getCode())
                .campaignTitle(campaignVehicle.getCampaign().getTitle())
                .campaignDescription(campaignVehicle.getCampaign().getDescription())
                .vehicleId(vehicle.getId())
                .vin(vehicle.getVin())
                .licensePlate(vehicle.getLicensePlate())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .customerId(customer.getId())
                .customerName(customer.getName() != null ? customer.getName() : "N/A")
                .customerPhone(customer.getPhone())
                .customerEmail(customer.getEmail())
                .notified(campaignVehicle.getNotified())
                .notifiedAt(null) // Note: notifiedAt field needs to be added to CampaignVehicle entity
                .processed(campaignVehicle.getProcessed())
                .processedAt(campaignVehicle.getProcessedAt())
                .build();
    }
}
