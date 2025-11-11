package com.ev.warranty.controller;

import com.ev.warranty.model.dto.vehicle.VehicleModelDTO;
import com.ev.warranty.service.inter.VehicleModelService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicle-models")
@RequiredArgsConstructor
public class VehicleModelController {

    private final VehicleModelService service;

    // View - allow staff, technician, evm staff, admin
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "List all vehicle models")
    public ResponseEntity<List<VehicleModelDTO>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "List active vehicle models")
    public ResponseEntity<List<VehicleModelDTO>> listActive() {
        return ResponseEntity.ok(service.listActive());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Get model by id")
    public ResponseEntity<VehicleModelDTO> get(@PathVariable Integer id) {
        return ResponseEntity.ok(service.get(id));
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Get model by code")
    public ResponseEntity<VehicleModelDTO> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(service.getByCode(code));
    }

    // EVM staff CRUD
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Create vehicle model (EVM staff)")
    public ResponseEntity<VehicleModelDTO> create(@Valid @RequestBody VehicleModelDTO dto, Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Update vehicle model (EVM staff)")
    public ResponseEntity<VehicleModelDTO> update(@PathVariable Integer id, @Valid @RequestBody VehicleModelDTO dto, Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.update(id, dto, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Delete vehicle model (EVM staff)")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

