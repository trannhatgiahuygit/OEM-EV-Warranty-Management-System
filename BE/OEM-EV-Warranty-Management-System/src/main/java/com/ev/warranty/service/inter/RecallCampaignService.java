package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.recall.RecallCampaignCreateRequestDTO;
import com.ev.warranty.model.dto.recall.RecallCampaignResponseDTO;
import com.ev.warranty.model.dto.recall.VehicleRecallNotificationDTO;
import org.springframework.data.domain.Page;

import java.util.List;

public interface RecallCampaignService {

    /**
     * Create a new recall campaign
     * Available to: EVM_STAFF, ADMIN only
     */
    RecallCampaignResponseDTO createCampaign(RecallCampaignCreateRequestDTO request, String createdBy);

    /**
     * Get all recall campaigns with filtering and pagination
     * Available to: EVM_STAFF, ADMIN only
     */
    Page<RecallCampaignResponseDTO> getAllCampaigns(int page, int size, String status, String search);

    /**
     * Get campaign details by ID
     * Available to: All authenticated users
     */
    RecallCampaignResponseDTO getCampaignById(Integer campaignId);

    /**
     * Update campaign status
     * Available to: EVM_STAFF, ADMIN only
     */
    RecallCampaignResponseDTO updateCampaignStatus(Integer campaignId, String status, String updatedBy);

    /**
     * Release campaign and identify affected vehicles
     * Available to: EVM_STAFF, ADMIN only
     */
    RecallCampaignResponseDTO releaseCampaign(Integer campaignId, String releasedBy);

    /**
     * Get vehicles affected by a recall campaign
     * Available to: EVM_STAFF, ADMIN only
     */
    Page<VehicleRecallNotificationDTO> getAffectedVehicles(Integer campaignId, int page, int size);

    /**
     * Send notifications to affected vehicle owners
     * Available to: EVM_STAFF, ADMIN only
     */
    List<VehicleRecallNotificationDTO> notifyAffectedVehicles(Integer campaignId, String notificationMethod);

    /**
     * Get recall notifications for a specific vehicle
     * Available to: SC_STAFF, SC_TECHNICIAN, EVM_STAFF, ADMIN
     */
    List<VehicleRecallNotificationDTO> getVehicleRecallNotifications(String vin);

    /**
     * Mark vehicle recall as processed
     * Available to: SC_STAFF, SC_TECHNICIAN, ADMIN
     */
    VehicleRecallNotificationDTO processVehicleRecall(Integer campaignId, String vin, String processingNotes, String processedBy);

    /**
     * Get campaign statistics
     * Available to: EVM_STAFF, ADMIN only
     */
    RecallCampaignResponseDTO getCampaignStatistics(Integer campaignId);
}
