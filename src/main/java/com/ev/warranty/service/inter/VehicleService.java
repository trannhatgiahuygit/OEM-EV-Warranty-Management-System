package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.VehicleRegisterRequestDTO;
import com.ev.warranty.model.dto.VehicleResponseDTO;
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
    boolean isVinExists(String vin);
}