package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.VehicleDto;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.VehicleRepository;
import com.ev.warranty.service.VehicleService;
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
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Override
    public VehicleDto registerVehicle(VehicleDto.CreateRequest request) {
        // Check if VIN already exists
        if (vehicleRepository.findByVin(request.getVin()).isPresent()) {
            throw new RuntimeException("Vehicle with VIN " + request.getVin() + " already exists");
        }

        // Validate owner exists
        User owner = userRepository.findById(request.getOwnerId())
            .orElseThrow(() -> new RuntimeException("Owner not found with ID: " + request.getOwnerId()));

        // Create vehicle entity
        Vehicle vehicle = Vehicle.builder()
            .vin(request.getVin())
            .model(request.getModel())
            .brand(request.getBrand())
            .year(request.getYear())
            .color(request.getColor())
            .engineType(request.getEngineType())
            .batteryCapacity(request.getBatteryCapacity())
            .licensePlate(request.getLicensePlate())
            .owner(owner)
            .warrantyStartDate(request.getWarrantyStartDate())
            .warrantyEndDate(request.getWarrantyEndDate())
            .registrationDate(LocalDateTime.now())
            .status("ACTIVE")
            .build();

        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return convertToDto(savedVehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleDto findByVin(String vin) {
        Vehicle vehicle = vehicleRepository.findByVin(vin)
            .orElseThrow(() -> new RuntimeException("Vehicle not found with VIN: " + vin));
        return convertToDto(vehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDto> findVehiclesByOwner(Integer ownerId) {
        List<Vehicle> vehicles = vehicleRepository.findByOwnerId(ownerId);
        return vehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDto> getAllVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        return vehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleDto getVehicleById(Integer vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
            .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + vehicleId));
        return convertToDto(vehicle);
    }

    @Override
    public VehicleDto updateVehicle(Integer vehicleId, VehicleDto.UpdateRequest request) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
            .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + vehicleId));

        // Update fields if provided
        if (request.getColor() != null) {
            vehicle.setColor(request.getColor());
        }
        if (request.getLicensePlate() != null) {
            vehicle.setLicensePlate(request.getLicensePlate());
        }
        if (request.getStatus() != null) {
            vehicle.setStatus(request.getStatus());
        }
        if (request.getWarrantyEndDate() != null) {
            vehicle.setWarrantyEndDate(request.getWarrantyEndDate());
        }
        if (request.getOwnerId() != null) {
            User newOwner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Owner not found with ID: " + request.getOwnerId()));
            vehicle.setOwner(newOwner);
        }

        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        return convertToDto(updatedVehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDto> findVehiclesInWarranty() {
        List<Vehicle> vehicles = vehicleRepository.findVehiclesInWarranty(LocalDateTime.now());
        return vehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDto> findVehiclesByStatus(String status) {
        List<Vehicle> vehicles = vehicleRepository.findByStatus(status);
        return vehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDto> findVehiclesForCampaign(String models, String years, String vinRange) {
        List<Vehicle> vehicles;

        if (vinRange != null && !vinRange.isEmpty()) {
            String[] vinParts = vinRange.split("-");
            if (vinParts.length == 2) {
                vehicles = vehicleRepository.findByVinRange(vinParts[0].trim(), vinParts[1].trim());
            } else {
                vehicles = List.of();
            }
        } else if (models != null && years != null) {
            List<String> modelList = Arrays.asList(models.split(","));
            String[] yearParts = years.split("-");
            if (yearParts.length == 2) {
                Integer startYear = Integer.parseInt(yearParts[0].trim());
                Integer endYear = Integer.parseInt(yearParts[1].trim());
                vehicles = vehicleRepository.findByModelsAndYearRange(modelList, startYear, endYear);
            } else {
                vehicles = List.of();
            }
        } else {
            vehicles = List.of();
        }

        return vehicles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public VehicleDto updateVehicleStatus(Integer vehicleId, String status) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
            .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + vehicleId));

        vehicle.setStatus(status);
        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        return convertToDto(updatedVehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleDto getVehicleWithServiceHistory(Integer vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
            .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + vehicleId));

        VehicleDto dto = convertToDto(vehicle);
        // Service history will be loaded through lazy loading or separate service call
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDto> searchVehicles(String searchTerm) {
        // This is a simple implementation - can be enhanced with more sophisticated search
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        return allVehicles.stream()
            .filter(vehicle ->
                vehicle.getVin().toLowerCase().contains(searchTerm.toLowerCase()) ||
                vehicle.getModel().toLowerCase().contains(searchTerm.toLowerCase()) ||
                (vehicle.getOwner() != null && vehicle.getOwner().getFullname() != null &&
                 vehicle.getOwner().getFullname().toLowerCase().contains(searchTerm.toLowerCase())))
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    private VehicleDto convertToDto(Vehicle vehicle) {
        VehicleDto.VehicleDtoBuilder builder = VehicleDto.builder()
            .id(vehicle.getId())
            .vin(vehicle.getVin())
            .model(vehicle.getModel())
            .brand(vehicle.getBrand())
            .year(vehicle.getYear())
            .color(vehicle.getColor())
            .engineType(vehicle.getEngineType())
            .batteryCapacity(vehicle.getBatteryCapacity())
            .licensePlate(vehicle.getLicensePlate())
            .registrationDate(vehicle.getRegistrationDate())
            .warrantyStartDate(vehicle.getWarrantyStartDate())
            .warrantyEndDate(vehicle.getWarrantyEndDate())
            .status(vehicle.getStatus())
            .createdAt(vehicle.getCreatedAt())
            .updatedAt(vehicle.getUpdatedAt());

        if (vehicle.getOwner() != null) {
            builder.ownerId(vehicle.getOwner().getId())
                   .ownerName(vehicle.getOwner().getFullname())
                   .ownerEmail(vehicle.getOwner().getEmail())
                   .ownerPhone(vehicle.getOwner().getPhone());
        }

        return builder.build();
    }
}
