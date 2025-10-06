package com.ev.warranty.service;

import com.ev.warranty.model.dto.ServiceHistoryDto;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

public interface ServiceHistoryService {

    // Create service history record
    ServiceHistoryDto createServiceHistory(ServiceHistoryDto.CreateRequest request);

    // Update service status and details
    ServiceHistoryDto updateServiceHistory(Integer serviceHistoryId, ServiceHistoryDto.UpdateRequest request);

    // Get service history by ID
    ServiceHistoryDto getServiceHistoryById(Integer serviceHistoryId);

    // Get service history by vehicle
    List<ServiceHistoryDto> getServiceHistoryByVehicle(Integer vehicleId);

    // Get service history by technician
    List<ServiceHistoryDto> getServiceHistoryByTechnician(Integer technicianId);

    // Get service history by SC Staff
    List<ServiceHistoryDto> getServiceHistoryByScStaff(Integer scStaffId);

    // Get service history by claim
    List<ServiceHistoryDto> getServiceHistoryByClaim(Integer claimId);

    // Get scheduled services
    List<ServiceHistoryDto> getScheduledServices();

    // Get overdue scheduled services
    List<ServiceHistoryDto> getOverdueScheduledServices();

    // Get service history by date range
    List<ServiceHistoryDto> getServiceHistoryByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    // Get technician performance metrics
    Long getTechnicianCompletedServicesCount(Integer technicianId, LocalDateTime startDate, LocalDateTime endDate);
}
