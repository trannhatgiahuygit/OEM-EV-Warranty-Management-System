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
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecallCampaignServiceImpl implements RecallCampaignService {

    private final RecallCampaignRepository recallCampaignRepository;
    private final CampaignVehicleRepository campaignVehicleRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

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
                .createdBy(createdByUser)
                .build();

        RecallCampaign savedCampaign = recallCampaignRepository.save(campaign);

        log.info("Recall campaign created successfully: {}", savedCampaign.getCode());
        return mapToResponseDTO(savedCampaign);
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

        return mapToResponseDTO(campaign);
    }

    @Override
    @Transactional
    public RecallCampaignResponseDTO updateCampaignStatus(Integer campaignId, String status, String updatedBy) {
        log.info("Updating campaign status - ID: {}, status: {}, updatedBy: {}", campaignId, status, updatedBy);

        RecallCampaign campaign = recallCampaignRepository.findById(campaignId)
                .orElseThrow(() -> new NotFoundException("Recall campaign not found with ID: " + campaignId));

        campaign.setStatus(status);
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
        // This is a simplified implementation
        // In a real system, you would have more complex criteria matching
        return vehicleRepository.findAll().stream()
                .filter(vehicle -> {
                    // Add your vehicle matching criteria here
                    // For now, return all vehicles as an example
                    return true;
                })
                .collect(Collectors.toList());
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

    private RecallCampaignResponseDTO mapToResponseDTO(RecallCampaign campaign) {
        return RecallCampaignResponseDTO.builder()
                .id(campaign.getId())
                .code(campaign.getCode())
                .title(campaign.getTitle())
                .description(campaign.getDescription())
                .status(campaign.getStatus())
                .releasedAt(campaign.getReleasedAt())
                .createdAt(LocalDateTime.now()) // Use current time as fallback
                .createdBy(campaign.getCreatedBy() != null ? campaign.getCreatedBy().getUsername() : null)
                .build();
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
