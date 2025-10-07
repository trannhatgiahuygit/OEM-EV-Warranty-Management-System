package com.ev.warranty.service;

import com.ev.warranty.model.dto.CampaignVehicleDto;

import java.time.LocalDateTime;
import java.util.List;

public interface CampaignVehicleService {

    // Identify and add vehicles to campaign
    List<CampaignVehicleDto> identifyVehiclesForCampaign(Integer campaignId);

    // Send notification to customer for campaign
    CampaignVehicleDto sendNotificationToCustomer(Integer campaignVehicleId);

    // Schedule campaign work
    CampaignVehicleDto scheduleCampaignWork(Integer campaignVehicleId, CampaignVehicleDto.ScheduleRequest request);

    // Update campaign progress
    CampaignVehicleDto updateCampaignProgress(Integer campaignVehicleId, CampaignVehicleDto.UpdateRequest request);

    // Get campaign vehicles by campaign
    List<CampaignVehicleDto> getCampaignVehiclesByCampaign(Integer campaignId);

    // Get campaign vehicles by status
    List<CampaignVehicleDto> getCampaignVehiclesByStatus(String status);

    // Get campaign vehicles assigned to technician
    List<CampaignVehicleDto> getCampaignVehiclesByTechnician(Integer technicianId);

    // Get campaign vehicles handled by SC Staff
    List<CampaignVehicleDto> getCampaignVehiclesByScStaff(Integer scStaffId);

    // Get scheduled campaign work for date range
    List<CampaignVehicleDto> getScheduledCampaignWork(LocalDateTime startDate, LocalDateTime endDate);

    // Get overdue campaign work
    List<CampaignVehicleDto> getOverdueCampaignWork();

    // Get vehicles needing notification
    List<CampaignVehicleDto> getVehiclesNeedingNotification();

    // Get campaign progress summary
    CampaignVehicleDto.ProgressSummary getCampaignProgress(Integer campaignId);
}
