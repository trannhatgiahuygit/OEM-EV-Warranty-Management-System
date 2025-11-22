package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.vehicle.VehicleRegisterRequestDTO;
import com.ev.warranty.model.dto.vehicle.VehicleResponseDTO;
import com.ev.warranty.model.dto.vehicle.WarrantyCheckResultDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public interface VehicleService {
    VehicleResponseDTO registerVehicle(VehicleRegisterRequestDTO request, String registeredBy);
    Optional<VehicleResponseDTO> findByVin(String vin);
    Optional<VehicleResponseDTO> findById(Integer id);
    List<VehicleResponseDTO> findByCustomerId(Integer customerId);
    List<VehicleResponseDTO> findAllVehicles();
    List<VehicleResponseDTO> findAllVehicles(String vehicleType);
    boolean isVinExists(String vin);
    
    // New methods for missing APIs
    VehicleResponseDTO updateMileage(Integer id, Integer mileage, String updatedBy);
    VehicleResponseDTO getWarrantyStatus(Integer id);
    WarrantyCheckResultDTO checkWarrantyCondition(Integer vehicleId);
}