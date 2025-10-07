package com.ev.warranty.controller;

import com.ev.warranty.model.dto.VehicleDto;
import com.ev.warranty.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VehicleController {

    private final VehicleService vehicleService;

    // Register new vehicle by VIN
    @PostMapping("/register")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<VehicleDto> registerVehicle(@RequestBody VehicleDto.CreateRequest request) {
        try {
            VehicleDto vehicle = vehicleService.registerVehicle(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(vehicle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get vehicle by VIN
    @GetMapping("/vin/{vin}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<VehicleDto> getVehicleByVin(@PathVariable String vin) {
        try {
            VehicleDto vehicle = vehicleService.findByVin(vin);
            return ResponseEntity.ok(vehicle);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get all vehicles
    @GetMapping
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<VehicleDto>> getAllVehicles() {
        List<VehicleDto> vehicles = vehicleService.getAllVehicles();
        return ResponseEntity.ok(vehicles);
    }

    // Get vehicle by ID
    @GetMapping("/{vehicleId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<VehicleDto> getVehicleById(@PathVariable Integer vehicleId) {
        try {
            VehicleDto vehicle = vehicleService.getVehicleById(vehicleId);
            return ResponseEntity.ok(vehicle);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Update vehicle information
    @PutMapping("/{vehicleId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<VehicleDto> updateVehicle(@PathVariable Integer vehicleId, @RequestBody VehicleDto.UpdateRequest request) {
        try {
            VehicleDto vehicle = vehicleService.updateVehicle(vehicleId, request);
            return ResponseEntity.ok(vehicle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get vehicles by owner
    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<VehicleDto>> getVehiclesByOwner(@PathVariable Integer ownerId) {
        List<VehicleDto> vehicles = vehicleService.findVehiclesByOwner(ownerId);
        return ResponseEntity.ok(vehicles);
    }

    // Get vehicles in warranty
    @GetMapping("/in-warranty")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<VehicleDto>> getVehiclesInWarranty() {
        List<VehicleDto> vehicles = vehicleService.findVehiclesInWarranty();
        return ResponseEntity.ok(vehicles);
    }

    // Get vehicles by status
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<VehicleDto>> getVehiclesByStatus(@PathVariable String status) {
        List<VehicleDto> vehicles = vehicleService.findVehiclesByStatus(status);
        return ResponseEntity.ok(vehicles);
    }

    // Update vehicle status
    @PatchMapping("/{vehicleId}/status")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<VehicleDto> updateVehicleStatus(@PathVariable Integer vehicleId, @RequestParam String status) {
        try {
            VehicleDto vehicle = vehicleService.updateVehicleStatus(vehicleId, status);
            return ResponseEntity.ok(vehicle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Search vehicles
    @GetMapping("/search")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<VehicleDto>> searchVehicles(@RequestParam String searchTerm) {
        List<VehicleDto> vehicles = vehicleService.searchVehicles(searchTerm);
        return ResponseEntity.ok(vehicles);
    }

    // Get vehicles for campaign (used by campaign management)
    @GetMapping("/for-campaign")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<VehicleDto>> getVehiclesForCampaign(
            @RequestParam(required = false) String models,
            @RequestParam(required = false) String years,
            @RequestParam(required = false) String vinRange) {
        List<VehicleDto> vehicles = vehicleService.findVehiclesForCampaign(models, years, vinRange);
        return ResponseEntity.ok(vehicles);
    }

    // Get vehicle with service history
    @GetMapping("/{vehicleId}/service-history")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<VehicleDto> getVehicleWithServiceHistory(@PathVariable Integer vehicleId) {
        try {
            VehicleDto vehicle = vehicleService.getVehicleWithServiceHistory(vehicleId);
            return ResponseEntity.ok(vehicle);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
