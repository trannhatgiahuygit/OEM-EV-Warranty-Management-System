package com.ev.warranty.controller;

import com.ev.warranty.model.dto.servicecenter.ServiceCenterRequestDTO;
import com.ev.warranty.model.dto.servicecenter.ServiceCenterResponseDTO;
import com.ev.warranty.service.inter.ServiceCenterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-centers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Service Center Management", description = "APIs for managing service centers and their branches")
public class ServiceCenterController {

    private final ServiceCenterService serviceCenterService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get all service centers", 
               description = "Retrieve all service centers. Supports pagination with page and size parameters.")
    public ResponseEntity<?> getAllServiceCenters(
            @Parameter(description = "Page number (0-based)", example = "0") @RequestParam(required = false) Integer page,
            @Parameter(description = "Page size", example = "20") @RequestParam(required = false) Integer size) {
        
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size);
            Page<ServiceCenterResponseDTO> serviceCenters = serviceCenterService.getAllServiceCenters(pageable);
            return ResponseEntity.ok(serviceCenters);
        } else {
            List<ServiceCenterResponseDTO> serviceCenters = serviceCenterService.getAllServiceCenters();
            return ResponseEntity.ok(serviceCenters);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get service center by ID", 
               description = "Retrieve a specific service center by its ID including branch information")
    public ResponseEntity<ServiceCenterResponseDTO> getServiceCenterById(
            @Parameter(description = "Service center ID") @PathVariable Integer id) {
        ServiceCenterResponseDTO serviceCenter = serviceCenterService.getServiceCenterById(id);
        return ResponseEntity.ok(serviceCenter);
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get service center by code", 
               description = "Retrieve a specific service center by its unique code")
    public ResponseEntity<ServiceCenterResponseDTO> getServiceCenterByCode(
            @Parameter(description = "Service center code") @PathVariable String code) {
        ServiceCenterResponseDTO serviceCenter = serviceCenterService.getServiceCenterByCode(code);
        return ResponseEntity.ok(serviceCenter);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Create new service center", 
               description = "Create a new service center. Can be a main center or a branch of another center.")
    public ResponseEntity<ServiceCenterResponseDTO> createServiceCenter(
            @Valid @RequestBody ServiceCenterRequestDTO request,
            Authentication authentication) {
        String createdBy = authentication != null ? authentication.getName() : "system";
        ServiceCenterResponseDTO createdServiceCenter = serviceCenterService.createServiceCenter(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdServiceCenter);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Update service center", 
               description = "Update an existing service center's information")
    public ResponseEntity<ServiceCenterResponseDTO> updateServiceCenter(
            @Parameter(description = "Service center ID") @PathVariable Integer id,
            @Valid @RequestBody ServiceCenterRequestDTO request,
            Authentication authentication) {
        String updatedBy = authentication != null ? authentication.getName() : "system";
        ServiceCenterResponseDTO updatedServiceCenter = serviceCenterService.updateServiceCenter(id, request, updatedBy);
        return ResponseEntity.ok(updatedServiceCenter);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Delete service center", 
               description = "Soft delete a service center by setting active = false. Cannot delete if it has active branches.")
    public ResponseEntity<Void> deleteServiceCenter(
            @Parameter(description = "Service center ID") @PathVariable Integer id) {
        serviceCenterService.deleteServiceCenter(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/main")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get main service centers", 
               description = "Retrieve all main service centers (not branches)")
    public ResponseEntity<List<ServiceCenterResponseDTO>> getMainServiceCenters() {
        List<ServiceCenterResponseDTO> mainCenters = serviceCenterService.getMainServiceCenters();
        return ResponseEntity.ok(mainCenters);
    }

    @GetMapping("/{parentId}/branches")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get branches of a service center", 
               description = "Retrieve all branches of a specific service center")
    public ResponseEntity<List<ServiceCenterResponseDTO>> getBranchesByServiceCenterId(
            @Parameter(description = "Parent service center ID") @PathVariable Integer parentId) {
        List<ServiceCenterResponseDTO> branches = serviceCenterService.getBranchesByServiceCenterId(parentId);
        return ResponseEntity.ok(branches);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get active service centers", 
               description = "Retrieve all active service centers only")
    public ResponseEntity<List<ServiceCenterResponseDTO>> getActiveServiceCenters() {
        List<ServiceCenterResponseDTO> activeCenters = serviceCenterService.getActiveServiceCenters();
        return ResponseEntity.ok(activeCenters);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Search service centers", 
               description = "Search service centers by name, code, or location")
    public ResponseEntity<List<ServiceCenterResponseDTO>> searchServiceCenters(
            @Parameter(description = "Search term") @RequestParam String q) {
        List<ServiceCenterResponseDTO> results = serviceCenterService.searchServiceCenters(q);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/region/{region}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get service centers by region", 
               description = "Retrieve all service centers in a specific region")
    public ResponseEntity<List<ServiceCenterResponseDTO>> getServiceCentersByRegion(
            @Parameter(description = "Region name") @PathVariable String region) {
        List<ServiceCenterResponseDTO> serviceCenters = serviceCenterService.getServiceCentersByRegion(region);
        return ResponseEntity.ok(serviceCenters);
    }
}

