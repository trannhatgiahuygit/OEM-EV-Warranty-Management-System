package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.ServiceHistoryDto;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.Part;
import com.ev.warranty.model.entity.ServiceHistory;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.PartRepository;
import com.ev.warranty.repository.ServiceHistoryRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.VehicleRepository;
import com.ev.warranty.service.ServiceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceHistoryServiceImpl implements ServiceHistoryService {

    private final ServiceHistoryRepository serviceHistoryRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;
    private final PartRepository partRepository;

    @Override
    public ServiceHistoryDto createServiceHistory(ServiceHistoryDto.CreateRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
            .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + request.getVehicleId()));

        User technician = userRepository.findById(request.getTechnicianId())
            .orElseThrow(() -> new RuntimeException("Technician not found with ID: " + request.getTechnicianId()));

        ServiceHistory.ServiceHistoryBuilder builder = ServiceHistory.builder()
            .vehicle(vehicle)
            .serviceType(request.getServiceType())
            .description(request.getDescription())
            .technician(technician)
            .serviceDate(request.getServiceDate())
            .mileage(request.getMileage())
            .laborHours(request.getLaborHours())
            .cost(request.getCost())
            .status("SCHEDULED")
            .workPerformed(request.getWorkPerformed())
            .notes(request.getNotes())
            .oldPartSerialNumber(request.getOldPartSerialNumber())
            .newPartSerialNumber(request.getNewPartSerialNumber());

        if (request.getClaimId() != null) {
            Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new RuntimeException("Claim not found with ID: " + request.getClaimId()));
            builder.claim(claim);
        }

        if (request.getPartId() != null) {
            Part part = partRepository.findById(request.getPartId())
                .orElseThrow(() -> new RuntimeException("Part not found with ID: " + request.getPartId()));
            builder.part(part);
        }

        ServiceHistory serviceHistory = serviceHistoryRepository.save(builder.build());
        return convertToDto(serviceHistory);
    }

    @Override
    public ServiceHistoryDto updateServiceHistory(Integer serviceHistoryId, ServiceHistoryDto.UpdateRequest request) {
        ServiceHistory serviceHistory = serviceHistoryRepository.findById(serviceHistoryId)
            .orElseThrow(() -> new RuntimeException("Service history not found with ID: " + serviceHistoryId));

        if (request.getStatus() != null) {
            serviceHistory.setStatus(request.getStatus());
        }
        if (request.getWorkPerformed() != null) {
            serviceHistory.setWorkPerformed(request.getWorkPerformed());
        }
        if (request.getNotes() != null) {
            serviceHistory.setNotes(request.getNotes());
        }
        if (request.getCost() != null) {
            serviceHistory.setCost(request.getCost());
        }
        if (request.getLaborHours() != null) {
            serviceHistory.setLaborHours(request.getLaborHours());
        }
        if (request.getServiceDate() != null) {
            serviceHistory.setServiceDate(request.getServiceDate());
        }

        ServiceHistory updatedServiceHistory = serviceHistoryRepository.save(serviceHistory);
        return convertToDto(updatedServiceHistory);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceHistoryDto getServiceHistoryById(Integer serviceHistoryId) {
        ServiceHistory serviceHistory = serviceHistoryRepository.findById(serviceHistoryId)
            .orElseThrow(() -> new RuntimeException("Service history not found with ID: " + serviceHistoryId));
        return convertToDto(serviceHistory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceHistoryDto> getServiceHistoryByVehicle(Integer vehicleId) {
        List<ServiceHistory> serviceHistories = serviceHistoryRepository.findByVehicleIdOrderByServiceDateDesc(vehicleId);
        return serviceHistories.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceHistoryDto> getServiceHistoryByTechnician(Integer technicianId) {
        List<ServiceHistory> serviceHistories = serviceHistoryRepository.findByTechnicianIdOrderByServiceDateDesc(technicianId);
        return serviceHistories.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceHistoryDto> getServiceHistoryByScStaff(Integer scStaffId) {
        List<ServiceHistory> serviceHistories = serviceHistoryRepository.findByScStaffIdOrderByServiceDateDesc(scStaffId);
        return serviceHistories.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceHistoryDto> getServiceHistoryByClaim(Integer claimId) {
        List<ServiceHistory> serviceHistories = serviceHistoryRepository.findByClaimIdOrderByServiceDateDesc(claimId);
        return serviceHistories.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceHistoryDto> getScheduledServices() {
        List<ServiceHistory> serviceHistories = serviceHistoryRepository.findScheduledServices(LocalDateTime.now());
        return serviceHistories.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceHistoryDto> getOverdueScheduledServices() {
        List<ServiceHistory> serviceHistories = serviceHistoryRepository.findOverdueScheduledServices(LocalDateTime.now());
        return serviceHistories.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceHistoryDto> getServiceHistoryByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<ServiceHistory> serviceHistories = serviceHistoryRepository.findByServiceDateRange(startDate, endDate);
        return serviceHistories.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Long getTechnicianCompletedServicesCount(Integer technicianId, LocalDateTime startDate, LocalDateTime endDate) {
        return serviceHistoryRepository.countCompletedServicesByTechnicianInDateRange(technicianId, startDate, endDate);
    }

    private ServiceHistoryDto convertToDto(ServiceHistory serviceHistory) {
        ServiceHistoryDto.ServiceHistoryDtoBuilder builder = ServiceHistoryDto.builder()
            .id(serviceHistory.getId())
            .vehicleId(serviceHistory.getVehicle().getId())
            .vehicleVin(serviceHistory.getVehicle().getVin())
            .vehicleModel(serviceHistory.getVehicle().getModel())
            .serviceType(serviceHistory.getServiceType())
            .description(serviceHistory.getDescription())
            .technicianId(serviceHistory.getTechnician().getId())
            .technicianName(serviceHistory.getTechnician().getFullname())
            .serviceDate(serviceHistory.getServiceDate())
            .mileage(serviceHistory.getMileage())
            .laborHours(serviceHistory.getLaborHours())
            .cost(serviceHistory.getCost())
            .status(serviceHistory.getStatus())
            .workPerformed(serviceHistory.getWorkPerformed())
            .notes(serviceHistory.getNotes())
            .oldPartSerialNumber(serviceHistory.getOldPartSerialNumber())
            .newPartSerialNumber(serviceHistory.getNewPartSerialNumber())
            .createdAt(serviceHistory.getCreatedAt())
            .updatedAt(serviceHistory.getUpdatedAt());

        if (serviceHistory.getClaim() != null) {
            builder.claimId(serviceHistory.getClaim().getId())
                   .claimNumber(serviceHistory.getClaim().getClaimNumber());
        }

        if (serviceHistory.getPart() != null) {
            builder.partId(serviceHistory.getPart().getId())
                   .partNumber(serviceHistory.getPart().getPartNumber())
                   .partName(serviceHistory.getPart().getPartName());
        }

        if (serviceHistory.getScStaff() != null) {
            builder.scStaffId(serviceHistory.getScStaff().getId())
                   .scStaffName(serviceHistory.getScStaff().getFullname());
        }

        return builder.build();
    }
}
