package com.ev.warranty.controller;

import com.ev.warranty.model.dto.part.*;
import com.ev.warranty.service.inter.PartSerialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/part-serials")
@RequiredArgsConstructor
@Tag(name = "Part Serial Management", description = "APIs for managing part serial numbers")
public class PartSerialController {

    private final PartSerialService partSerialService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Register new part serial", description = "Register a new part serial number into inventory")
    public ResponseEntity<PartSerialDTO> createPartSerial(@Valid @RequestBody CreatePartSerialRequestDTO request) {
        PartSerialDTO result = partSerialService.createPartSerial(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Get available serials", description = "Get list of available part serials (in stock)")
    public ResponseEntity<List<PartSerialDTO>> getAvailableSerials(
            @RequestParam(required = false) Integer partId) {
        List<PartSerialDTO> result = partSerialService.getAvailableSerials(partId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/install")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Install part serial on vehicle", description = "Install a part serial on a specific vehicle")
    public ResponseEntity<PartSerialDTO> installPartSerial(@Valid @RequestBody InstallPartSerialRequestDTO request) {
        PartSerialDTO result = partSerialService.installPartSerial(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/replace")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Replace part serial", description = "Replace an old part serial with a new one on a vehicle")
    public ResponseEntity<PartSerialDTO> replacePartSerial(@Valid @RequestBody ReplacePartSerialRequestDTO request) {
        PartSerialDTO result = partSerialService.replacePartSerial(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/uninstall")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Uninstall part serial", description = "Remove a part serial from a vehicle")
    public ResponseEntity<PartSerialDTO> uninstallPartSerial(@Valid @RequestBody UninstallPartSerialRequestDTO request) {
        PartSerialDTO result = partSerialService.uninstallPartSerial(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/vehicle/{vin}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Get vehicle installed parts", description = "Get all parts currently installed on a vehicle")
    public ResponseEntity<VehiclePartsResponseDTO> getVehicleInstalledParts(@PathVariable String vin) {
        VehiclePartsResponseDTO result = partSerialService.getVehicleInstalledParts(vin);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{serialNumber}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN', 'ROLE_SC_STAFF')")
    @Operation(summary = "Get part serial details", description = "Get detailed information of a part serial by serial number")
    public ResponseEntity<PartSerialDTO> getPartSerialBySerialNumber(@PathVariable String serialNumber) {
        PartSerialDTO result = partSerialService.getPartSerialBySerialNumber(serialNumber);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Get serials by status", description = "Get all part serials filtered by status")
    public ResponseEntity<List<PartSerialDTO>> getPartSerialsByStatus(@PathVariable String status) {
        List<PartSerialDTO> result = partSerialService.getPartSerialsByStatus(status);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Get all part serials", description = "Get all part serials in the system")
    public ResponseEntity<List<PartSerialDTO>> getAllPartSerials() {
        List<PartSerialDTO> result = partSerialService.getAllPartSerials();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/receive-for-workorder")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Receive part serials for work order", description = "Confirm receiving part serials from warehouse for a work order")
    public ResponseEntity<List<PartSerialDTO>> receivePartSerialsForWorkOrder(
            @Valid @RequestBody ReceivePartSerialForWorkOrderRequestDTO request) {
        List<PartSerialDTO> result = partSerialService.receivePartSerialsForWorkOrder(request);
        return ResponseEntity.ok(result);
    }
}
