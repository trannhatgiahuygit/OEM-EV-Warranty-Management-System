package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.CampaignVehicleDto;
import com.ev.warranty.model.entity.Campaign;
import com.ev.warranty.model.entity.CampaignVehicle;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.repository.CampaignRepository;
import com.ev.warranty.repository.CampaignVehicleRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.VehicleRepository;
import com.ev.warranty.service.CampaignVehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CampaignVehicleServiceImpl implements CampaignVehicleService {

    private final CampaignVehicleRepository campaignVehicleRepository;
    private final CampaignRepository campaignRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Override
    public List<CampaignVehicleDto> identifyVehiclesForCampaign(Integer campaignId) {
        Campaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new RuntimeException("Campaign not found with ID: " + campaignId));

        // Find vehicles matching campaign criteria
        List<Vehicle> affectedVehicles = findAffectedVehicles(campaign);

        // Create campaign vehicle records
        List<CampaignVehicle> campaignVehicles = affectedVehicles.stream()
            .filter(vehicle -> !campaignVehicleRepository.findByCampaignIdAndVehicleId(campaignId, vehicle.getId()).isPresent())
            .map(vehicle -> CampaignVehicle.builder()
                .campaign(campaign)
                .vehicle(vehicle)
                .status("IDENTIFIED")
                .build())
            .collect(Collectors.toList());

        List<CampaignVehicle> savedCampaignVehicles = campaignVehicleRepository.saveAll(campaignVehicles);
        return savedCampaignVehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public CampaignVehicleDto sendNotificationToCustomer(Integer campaignVehicleId) {
        CampaignVehicle campaignVehicle = campaignVehicleRepository.findById(campaignVehicleId)
            .orElseThrow(() -> new RuntimeException("Campaign vehicle not found with ID: " + campaignVehicleId));

        // Update status and notification sent date
        campaignVehicle.setStatus("NOTIFIED");
        campaignVehicle.setNotificationSentDate(LocalDateTime.now());

        CampaignVehicle savedCampaignVehicle = campaignVehicleRepository.save(campaignVehicle);
        return convertToDto(savedCampaignVehicle);
    }

    @Override
    public CampaignVehicleDto scheduleCampaignWork(Integer campaignVehicleId, CampaignVehicleDto.ScheduleRequest request) {
        CampaignVehicle campaignVehicle = campaignVehicleRepository.findById(campaignVehicleId)
            .orElseThrow(() -> new RuntimeException("Campaign vehicle not found with ID: " + campaignVehicleId));

        // Update scheduling information
        campaignVehicle.setStatus("SCHEDULED");
        campaignVehicle.setScheduledDate(request.getScheduledDate());

        if (request.getAssignedTechnicianId() != null) {
            User technician = userRepository.findById(request.getAssignedTechnicianId())
                .orElseThrow(() -> new RuntimeException("Technician not found with ID: " + request.getAssignedTechnicianId()));
            campaignVehicle.setAssignedTechnician(technician);
        }

        if (request.getNotes() != null) {
            campaignVehicle.setNotes(request.getNotes());
        }

        CampaignVehicle savedCampaignVehicle = campaignVehicleRepository.save(campaignVehicle);
        return convertToDto(savedCampaignVehicle);
    }

    @Override
    public CampaignVehicleDto updateCampaignProgress(Integer campaignVehicleId, CampaignVehicleDto.UpdateRequest request) {
        CampaignVehicle campaignVehicle = campaignVehicleRepository.findById(campaignVehicleId)
            .orElseThrow(() -> new RuntimeException("Campaign vehicle not found with ID: " + campaignVehicleId));

        // Update progress information
        if (request.getStatus() != null) {
            campaignVehicle.setStatus(request.getStatus());
        }
        if (request.getWorkPerformed() != null) {
            campaignVehicle.setWorkPerformed(request.getWorkPerformed());
        }
        if (request.getNotes() != null) {
            campaignVehicle.setNotes(request.getNotes());
        }
        if (request.getCompletedDate() != null) {
            campaignVehicle.setCompletedDate(request.getCompletedDate());
        }

        CampaignVehicle savedCampaignVehicle = campaignVehicleRepository.save(campaignVehicle);
        return convertToDto(savedCampaignVehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignVehicleDto> getCampaignVehiclesByCampaign(Integer campaignId) {
        List<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findByCampaignIdOrderByCreatedAtDesc(campaignId);
        return campaignVehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignVehicleDto> getCampaignVehiclesByStatus(String status) {
        List<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findByStatusOrderByCreatedAtDesc(status);
        return campaignVehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignVehicleDto> getCampaignVehiclesByTechnician(Integer technicianId) {
        List<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findByAssignedTechnicianIdOrderByScheduledDateAsc(technicianId);
        return campaignVehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignVehicleDto> getCampaignVehiclesByScStaff(Integer scStaffId) {
        List<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findByScStaffIdOrderByCreatedAtDesc(scStaffId);
        return campaignVehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignVehicleDto> getScheduledCampaignWork(LocalDateTime startDate, LocalDateTime endDate) {
        List<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findByScheduledDateRange(startDate, endDate);
        return campaignVehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignVehicleDto> getOverdueCampaignWork() {
        List<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findOverdueScheduled(LocalDateTime.now());
        return campaignVehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignVehicleDto> getVehiclesNeedingNotification() {
        List<CampaignVehicle> campaignVehicles = campaignVehicleRepository.findVehiclesNeedingNotification();
        return campaignVehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignVehicleDto.ProgressSummary getCampaignProgress(Integer campaignId) {
        Long totalVehicles = campaignVehicleRepository.countByCampaignIdAndStatus(campaignId, "IDENTIFIED") +
                           campaignVehicleRepository.countByCampaignIdAndStatus(campaignId, "NOTIFIED") +
                           campaignVehicleRepository.countByCampaignIdAndStatus(campaignId, "SCHEDULED") +
                           campaignVehicleRepository.countByCampaignIdAndStatus(campaignId, "COMPLETED");

        Long identifiedVehicles = campaignVehicleRepository.countByCampaignIdAndStatus(campaignId, "IDENTIFIED");
        Long notifiedVehicles = campaignVehicleRepository.countByCampaignIdAndStatus(campaignId, "NOTIFIED");
        Long scheduledVehicles = campaignVehicleRepository.countByCampaignIdAndStatus(campaignId, "SCHEDULED");
        Long completedVehicles = campaignVehicleRepository.countByCampaignIdAndStatus(campaignId, "COMPLETED");

        double completionPercentage = totalVehicles > 0 ? (completedVehicles.doubleValue() / totalVehicles.doubleValue() * 100) : 0.0;

        return CampaignVehicleDto.ProgressSummary.builder()
            .totalVehicles(totalVehicles.intValue())
            .identifiedVehicles(identifiedVehicles.intValue())
            .notifiedVehicles(notifiedVehicles.intValue())
            .scheduledVehicles(scheduledVehicles.intValue())
            .completedVehicles(completedVehicles.intValue())
            .completionPercentage(completionPercentage)
            .build();
    }

    private List<Vehicle> findAffectedVehicles(Campaign campaign) {
        if (campaign.getAffectedVinRange() != null && !campaign.getAffectedVinRange().isEmpty()) {
            String[] vinParts = campaign.getAffectedVinRange().split("-");
            if (vinParts.length == 2) {
                return vehicleRepository.findByVinRange(vinParts[0].trim(), vinParts[1].trim());
            }
        }

        if (campaign.getAffectedModels() != null && campaign.getAffectedYears() != null) {
            List<String> models = Arrays.asList(campaign.getAffectedModels().split(","));
            String[] yearParts = campaign.getAffectedYears().split("-");
            if (yearParts.length == 2) {
                Integer startYear = Integer.parseInt(yearParts[0].trim());
                Integer endYear = Integer.parseInt(yearParts[1].trim());
                return vehicleRepository.findByModelsAndYearRange(models, startYear, endYear);
            }
        }

        return List.of();
    }

    private CampaignVehicleDto convertToDto(CampaignVehicle campaignVehicle) {
        CampaignVehicleDto.CampaignVehicleDtoBuilder builder = CampaignVehicleDto.builder()
            .id(campaignVehicle.getId())
            .campaignId(campaignVehicle.getCampaign().getId())
            .campaignNumber(campaignVehicle.getCampaign().getCampaignNumber())
            .campaignTitle(campaignVehicle.getCampaign().getTitle())
            .vehicleId(campaignVehicle.getVehicle().getId())
            .vehicleVin(campaignVehicle.getVehicle().getVin())
            .vehicleModel(campaignVehicle.getVehicle().getModel())
            .status(campaignVehicle.getStatus())
            .notificationSentDate(campaignVehicle.getNotificationSentDate())
            .scheduledDate(campaignVehicle.getScheduledDate())
            .completedDate(campaignVehicle.getCompletedDate())
            .workPerformed(campaignVehicle.getWorkPerformed())
            .notes(campaignVehicle.getNotes())
            .createdAt(campaignVehicle.getCreatedAt())
            .updatedAt(campaignVehicle.getUpdatedAt());

        if (campaignVehicle.getAssignedTechnician() != null) {
            builder.assignedTechnicianId(campaignVehicle.getAssignedTechnician().getId())
                   .assignedTechnicianName(campaignVehicle.getAssignedTechnician().getFullname());
        }

        if (campaignVehicle.getScStaff() != null) {
            builder.scStaffId(campaignVehicle.getScStaff().getId())
                   .scStaffName(campaignVehicle.getScStaff().getFullname());
        }

        return builder.build();
    }
}
