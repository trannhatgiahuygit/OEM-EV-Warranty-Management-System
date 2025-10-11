package com.ev.warranty.controller;

import com.ev.warranty.model.dto.VehicleRegisterRequestDTO;
import com.ev.warranty.model.dto.VehicleResponseDTO;
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
    @PreAuthorize("hasAnyRole('SC_STAFF', 'EVM_STAFF', 'ADMIN')")
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
    public ResponseEntity<List<VehicleResponseDTO>> getVehiclesByCustomer(@PathVariable Integer customerId) {
        log.debug("Fetching vehicles for customer ID: {}", customerId);

        List<VehicleResponseDTO> vehicles = vehicleService.findByCustomerId(customerId);

        log.debug("Found {} vehicles for customer ID: {}", vehicles.size(), customerId);
        return ResponseEntity.ok(vehicles);
    }

    /**
     * Get all vehicles in the system
     * Available to: ADMIN only
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VehicleResponseDTO>> getAllVehicles() {
        log.debug("Fetching all vehicles (admin request)");

        List<VehicleResponseDTO> vehicles = vehicleService.findAllVehicles();

        log.debug("Retrieved {} total vehicles", vehicles.size());
        return ResponseEntity.ok(vehicles);
    }

    /**
     * Check if a VIN already exists
     * Available to: SC_STAFF, EVM_STAFF, ADMIN
     */
    @GetMapping("/check-vin/{vin}")
    @PreAuthorize("hasAnyRole('SC_STAFF', 'EVM_STAFF', 'ADMIN')")
    public ResponseEntity<Boolean> checkVinExists(@PathVariable String vin) {
        log.debug("Checking if VIN exists: {}", vin);

        boolean exists = vehicleService.isVinExists(vin);

        log.debug("VIN {} exists: {}", vin, exists);
        return ResponseEntity.ok(exists);
    }
}