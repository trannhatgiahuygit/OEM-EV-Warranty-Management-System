package com.ev.warranty.service;

import com.ev.warranty.model.dto.VehicleDto;
import com.ev.warranty.model.entity.Vehicle;

import java.util.List;

// Vehicle business logic
public interface VehicleService {

    // Vehicle registration by VIN
    VehicleDto registerVehicle(VehicleDto.CreateRequest request);

    // Find vehicle by VIN for lookup
    VehicleDto findByVin(String vin);

    // Find vehicles by owner (customer)
    List<VehicleDto> findVehiclesByOwner(Integer ownerId);

    // Get all vehicles for SC Staff management
    List<VehicleDto> getAllVehicles();

    // Get vehicle by ID with full details
    VehicleDto getVehicleById(Integer vehicleId);

    // Update vehicle information
    VehicleDto updateVehicle(Integer vehicleId, VehicleDto.UpdateRequest request);

    // Find vehicles in warranty period
    List<VehicleDto> findVehiclesInWarranty();

    // Find vehicles by status
    List<VehicleDto> findVehiclesByStatus(String status);

    // Find vehicles affected by campaign criteria
    List<VehicleDto> findVehiclesForCampaign(String models, String years, String vinRange);

    // Update vehicle status
    VehicleDto updateVehicleStatus(Integer vehicleId, String status);

    // Get vehicle service history
    VehicleDto getVehicleWithServiceHistory(Integer vehicleId);

    // Search vehicles by VIN, model, or owner
    List<VehicleDto> searchVehicles(String searchTerm);
}
