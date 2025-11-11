package com.ev.warranty.controller;

import com.ev.warranty.model.dto.thirdparty.ReserveSerialsRequestDTO;
import com.ev.warranty.model.dto.thirdparty.ReserveSerialsResponseDTO;
import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartDTO;
import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartSerialDTO;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.ServiceCenter;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.ServiceCenterRepository;
import com.ev.warranty.service.inter.ThirdPartyPartService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/third-party-parts")
@RequiredArgsConstructor
@Validated
public class ThirdPartyPartController {

    private final ThirdPartyPartService service;
    private final UserRepository userRepository;
    private final ServiceCenterRepository serviceCenterRepository;

    @GetMapping("/service-center/{scId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "List third-party parts by service center")
    public ResponseEntity<List<ThirdPartyPartDTO>> getByServiceCenter(@PathVariable Integer scId, Authentication auth) {
        String region = null;
        
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            // Admin: Get region from the selected service center (scId)
            ServiceCenter selectedSc = serviceCenterRepository.findById(scId).orElse(null);
            if (selectedSc != null) {
                region = selectedSc.getRegion();
            }
        } else {
            // For SC Staff and Technician: Get region from their own service center
            String username = auth != null ? auth.getName() : null;
            if (username != null) {
                User user = userRepository.findByUsername(username).orElse(null);
                if (user != null && user.getServiceCenterId() != null) {
                    ServiceCenter sc = serviceCenterRepository.findById(user.getServiceCenterId()).orElse(null);
                    if (sc != null) {
                        region = sc.getRegion();
                    }
                }
            }
        }
        
        // Use regional price filtering for all roles based on the determined region
        return ResponseEntity.ok(service.getPartsByServiceCenterWithRegionalPrices(scId, region));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Create third-party part (Admin only)")
    public ResponseEntity<ThirdPartyPartDTO> create(@RequestBody ThirdPartyPartDTO dto,
                                                    Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.createPart(dto, user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Update third-party part (Admin only)")
    public ResponseEntity<ThirdPartyPartDTO> update(@PathVariable Integer id,
                                                    @RequestBody ThirdPartyPartDTO dto,
                                                    Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.updatePart(id, dto, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Delete third-party part (Admin only)")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.deletePart(id);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Deactivate third-party part (Admin only)")
    public ResponseEntity<ThirdPartyPartDTO> deactivate(@PathVariable Integer id,
                                                        Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        ThirdPartyPartDTO dto = new ThirdPartyPartDTO();
        dto.setActive(false);
        return ResponseEntity.ok(service.updatePart(id, dto, user));
    }

    @PostMapping("/{partId}/serials")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Add serial to third-party part")
    public ResponseEntity<ThirdPartyPartSerialDTO> addSerial(@PathVariable Integer partId,
                                                             @RequestParam @NotBlank String serialNumber,
                                                             Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.addSerial(partId, serialNumber, user));
    }

    @GetMapping("/{partId}/serials/available")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Get available serials for third-party part")
    public ResponseEntity<List<ThirdPartyPartSerialDTO>> getAvailableSerials(@PathVariable Integer partId) {
        return ResponseEntity.ok(service.getAvailableSerials(partId));
    }
    
    @GetMapping("/{partId}/serials")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Get all serials for third-party part (including deactivated)")
    public ResponseEntity<List<ThirdPartyPartSerialDTO>> getAllSerials(@PathVariable Integer partId) {
        return ResponseEntity.ok(service.getAllSerials(partId));
    }
    
    @PostMapping("/{partId}/recalculate-quantity")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Recalculate quantity based on AVAILABLE serials count (Admin only)")
    public ResponseEntity<Void> recalculateQuantity(@PathVariable Integer partId, Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        service.recalculateQuantity(partId, user);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/serials/{serialId}/install")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Install third-party part serial on vehicle (deducts quantity and tracks vehicle)")
    public ResponseEntity<ThirdPartyPartSerialDTO> installSerialOnVehicle(
            @PathVariable Integer serialId,
            @RequestParam @NotBlank String vehicleVin,
            @RequestParam(required = false) Integer workOrderId,
            Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.installSerialOnVehicle(serialId, vehicleVin, workOrderId, user));
    }
    
    @PutMapping("/serials/{serialId}/deactivate")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Deactivate a serial number (decrements quantity)")
    public ResponseEntity<ThirdPartyPartSerialDTO> deactivateSerial(
            @PathVariable Integer serialId,
            Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.deactivateSerial(serialId, user));
    }
    
    @PutMapping("/serials/{serialId}/activate")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Activate a deactivated serial number (increments quantity)")
    public ResponseEntity<ThirdPartyPartSerialDTO> activateSerial(
            @PathVariable Integer serialId,
            Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.activateSerial(serialId, user));
    }
    
    @DeleteMapping("/serials/{serialId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Delete a serial number (only if AVAILABLE, decrements quantity)")
    public ResponseEntity<Void> deleteSerial(
            @PathVariable Integer serialId,
            Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        service.deleteSerial(serialId, user);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/serials/{serialId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Update a serial number (only if AVAILABLE or DEACTIVATED)")
    public ResponseEntity<ThirdPartyPartSerialDTO> updateSerial(
            @PathVariable Integer serialId,
            @RequestParam @NotBlank String serialNumber,
            Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.updateSerial(serialId, serialNumber, user));
    }
    
    @PostMapping("/serials/check-availability")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Check availability of serials for third-party parts (without reserving)")
    public ResponseEntity<ReserveSerialsResponseDTO> checkSerialAvailability(
            @Valid @RequestBody ReserveSerialsRequestDTO request) {
        return ResponseEntity.ok(service.checkSerialAvailability(request));
    }
    
    @PostMapping("/serials/reserve")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Reserve serials for a claim (assigns and reserves available serials)")
    public ResponseEntity<ReserveSerialsResponseDTO> reserveSerialsForClaim(
            @Valid @RequestBody ReserveSerialsRequestDTO request,
            Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.reserveSerialsForClaim(request, user));
    }
    
    @DeleteMapping("/serials/release/{claimId}/{partId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Release reserved serials for a claim and part (makes them AVAILABLE again)")
    public ResponseEntity<Void> releaseReservedSerials(
            @PathVariable Integer claimId,
            @PathVariable Integer partId,
            Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        service.releaseReservedSerials(claimId, partId, user);
        return ResponseEntity.ok().build();
    }
}
