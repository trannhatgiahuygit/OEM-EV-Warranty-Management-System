package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.servicehistory.ServiceHistoryRequestDTO;
import com.ev.warranty.model.dto.servicehistory.ServiceHistoryResponseDTO;
import com.ev.warranty.model.entity.Customer;
import com.ev.warranty.model.entity.ServiceHistory;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.repository.CustomerRepository;
import com.ev.warranty.repository.ServiceHistoryRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.VehicleRepository;
import com.ev.warranty.service.inter.ServiceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceHistoryServiceImpl implements ServiceHistoryService {
    private final ServiceHistoryRepository serviceHistoryRepository;
    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ServiceHistoryResponseDTO createServiceHistory(ServiceHistoryRequestDTO requestDTO) {
        Vehicle vehicle = vehicleRepository.findById(requestDTO.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
        Customer customer = customerRepository.findById(requestDTO.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        User performedBy = userRepository.findById(requestDTO.getPerformedById())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        ServiceHistory history = ServiceHistory.builder()
                .vehicle(vehicle)
                .customer(customer)
                .serviceType(requestDTO.getServiceType())
                .description(requestDTO.getDescription())
                .performedBy(performedBy)
                .mileageKm(requestDTO.getMileageKm())
                .build();
        ServiceHistory saved = serviceHistoryRepository.save(history);
        return toResponseDTO(saved);
    }

    @Override
    public List<ServiceHistoryResponseDTO> getServiceHistoryByVehicle(Integer vehicleId) {
        return serviceHistoryRepository.findByVehicle_Id(vehicleId)
                .stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<ServiceHistoryResponseDTO> getServiceHistoryByCustomer(Integer customerId) {
        return serviceHistoryRepository.findByCustomer_Id(customerId)
                .stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    private ServiceHistoryResponseDTO toResponseDTO(ServiceHistory history) {
        ServiceHistoryResponseDTO dto = new ServiceHistoryResponseDTO();
        dto.setId(history.getId());
        dto.setVehicleId(history.getVehicle().getId());
        dto.setVehicleVin(history.getVehicle().getVin());
        dto.setCustomerId(history.getCustomer().getId());
        dto.setCustomerName(history.getCustomer().getName());
        dto.setServiceType(history.getServiceType());
        dto.setDescription(history.getDescription());
        dto.setPerformedAt(history.getPerformedAt());
        dto.setPerformedByName(history.getPerformedBy() != null ? history.getPerformedBy().getFullName() : null);
        dto.setMileageKm(history.getMileageKm());
        return dto;
    }
}

