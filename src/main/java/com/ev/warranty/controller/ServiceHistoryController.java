package com.ev.warranty.controller;

import com.ev.warranty.model.dto.servicehistory.ServiceHistoryRequestDTO;
import com.ev.warranty.model.dto.servicehistory.ServiceHistoryResponseDTO;
import com.ev.warranty.service.inter.ServiceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-history")
@RequiredArgsConstructor
public class ServiceHistoryController {
    private final ServiceHistoryService serviceHistoryService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    public ResponseEntity<ServiceHistoryResponseDTO> createServiceHistory(@RequestBody ServiceHistoryRequestDTO requestDTO) {
        ServiceHistoryResponseDTO response = serviceHistoryService.createServiceHistory(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<List<ServiceHistoryResponseDTO>> getByVehicle(@PathVariable Integer vehicleId) {
        return ResponseEntity.ok(serviceHistoryService.getServiceHistoryByVehicle(vehicleId));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<List<ServiceHistoryResponseDTO>> getByCustomer(@PathVariable Integer customerId) {
        return ResponseEntity.ok(serviceHistoryService.getServiceHistoryByCustomer(customerId));
    }
}

