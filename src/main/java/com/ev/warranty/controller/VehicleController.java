package com.ev.warranty.controller;

import com.ev.warranty.model.dto.vehicle.VehicleRegisterRequestDTO;
import com.ev.warranty.model.dto.vehicle.VehicleResponseDTO;
import com.ev.warranty.service.inter.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Slf4j
public class VehicleController {

    private final VehicleService vehicleService;

    /**
     * Register a new vehicle in the warranty system
     * Available to: SC_STAFF, EVM_STAFF, ADMIN
     */
    @PostMapping("/register")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<VehicleResponseDTO> registerVehicle(
            @Valid @RequestBody VehicleRegisterRequestDTO request,
            Authentication authentication) {

        String registeredBy = authentication.getName();
        log.info("Vehicle registration request received for VIN: {} by user: {}", request.getVin(), registeredBy);

        VehicleResponseDTO registeredVehicle = vehicleService.registerVehicle(request, registeredBy);

        log.info("Vehicle registration completed successfully for VIN: {}", registeredVehicle.getVin());
        return ResponseEntity.status(HttpStatus.CREATED).body(registeredVehicle);
    }

    /**
     * Get vehicle by VIN
     * Available to: All authenticated users
     */
    @GetMapping("/vin/{vin}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<VehicleResponseDTO> getVehicleByVin(@PathVariable String vin) {
        log.debug("Searching for vehicle with VIN: {}", vin);

        Optional<VehicleResponseDTO> vehicle = vehicleService.findByVin(vin);

        return vehicle
                .map(v -> {
                    log.debug("Vehicle found for VIN: {}", vin);
                    return ResponseEntity.ok(v);
                })
                .orElseGet(() -> {
                    log.debug("Vehicle not found for VIN: {}", vin);
                    return ResponseEntity.notFound().build();
                });
    }

    /**
     * Get vehicle by ID
     * Available to: All authenticated users
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<VehicleResponseDTO> getVehicleById(@PathVariable Integer id) {
        log.debug("Searching for vehicle with ID: {}", id);

        Optional<VehicleResponseDTO> vehicle = vehicleService.findById(id);

        return vehicle
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all vehicles for a specific customer
     * Available to: All authenticated users
     */
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<List<VehicleResponseDTO>> getVehiclesByCustomer(@PathVariable Integer customerId) {
        log.debug("Fetching vehicles for customer ID: {}", customerId);

        List<VehicleResponseDTO> vehicles = vehicleService.findByCustomerId(customerId);

        log.debug("Found {} vehicles for customer ID: {}", vehicles.size(), customerId);
        return ResponseEntity.ok(vehicles);
    }

    /**
     * Get all vehicles in the system
     * Available to: ADMIN, SC_STAFF, SC_TECHNICIAN
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF')")
    public ResponseEntity<List<VehicleResponseDTO>> getAllVehicles() {
        log.debug("Fetching all vehicles (admin or staff request)");

        List<VehicleResponseDTO> vehicles = vehicleService.findAllVehicles();

        log.debug("Retrieved {} total vehicles", vehicles.size());
        return ResponseEntity.ok(vehicles);
    }

    /**
     * Check if a VIN already exists
     * Available to: SC_STAFF, EVM_STAFF, ADMIN
     */
    @GetMapping("/check-vin/{vin}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<Boolean> checkVinExists(@PathVariable String vin) {
        log.debug("Checking if VIN exists: {}", vin);

        boolean exists = vehicleService.isVinExists(vin);

        log.debug("VIN {} exists: {}", vin, exists);
        return ResponseEntity.ok(exists);
    }

    /**
     * Update vehicle mileage
     * Available to: SC_STAFF, SC_TECHNICIAN, ADMIN
     */
    @PutMapping("/{id}/mileage")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<VehicleResponseDTO> updateMileage(
            @PathVariable Integer id,
            @RequestParam Integer mileage,
            Authentication authentication) {
        
        String updatedBy = authentication.getName();
        log.info("Updating mileage for vehicle ID: {} to {} km by user: {}", id, mileage, updatedBy);

        VehicleResponseDTO updatedVehicle = vehicleService.updateMileage(id, mileage, updatedBy);
        
        log.info("Mileage updated successfully for vehicle ID: {}", id);
        return ResponseEntity.ok(updatedVehicle);
    }

    /**
     * Get vehicle warranty status
     * Available to: All authenticated users
     */
    @GetMapping("/{id}/warranty-status")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<VehicleResponseDTO> getWarrantyStatus(@PathVariable Integer id) {
        log.debug("Getting warranty status for vehicle ID: {}", id);

        VehicleResponseDTO vehicle = vehicleService.getWarrantyStatus(id);
        
        log.debug("Retrieved warranty status for vehicle ID: {}", id);
        return ResponseEntity.ok(vehicle);
    }
}