package com.ev.warranty.controller;

import com.ev.warranty.model.dto.shipment.ShipmentDTO;
import com.ev.warranty.service.inter.ShipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
@Tag(name = "Shipment Tracking", description = "APIs for tracking warranty parts shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;

    @GetMapping("/{id}/track")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Track shipment by ID")
    public ResponseEntity<ShipmentDTO> trackById(@PathVariable Integer id) {
        return ResponseEntity.ok(shipmentService.getById(id));
    }

    @GetMapping("/track")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Track shipment by tracking number")
    public ResponseEntity<ShipmentDTO> trackByNumber(@RequestParam String trackingNumber) {
        return ResponseEntity.ok(shipmentService.getByTracking(trackingNumber));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "List shipments by status")
    public ResponseEntity<List<ShipmentDTO>> listByStatus(@RequestParam(required = false, defaultValue = "in_transit") String status) {
        return ResponseEntity.ok(shipmentService.getByStatus(status));
    }

    @GetMapping("/destination/{centerId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "List shipments for destination center")
    public ResponseEntity<List<ShipmentDTO>> listByDestination(@PathVariable Integer centerId) {
        return ResponseEntity.ok(shipmentService.getByDestinationCenter(centerId));
    }

    @GetMapping("/claim/{claimId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "List shipments related to claim (inferred)")
    public ResponseEntity<List<ShipmentDTO>> listByClaim(@PathVariable Integer claimId) {
        return ResponseEntity.ok(shipmentService.getByClaim(claimId));
    }

    @GetMapping("/workorder/{workOrderId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "List shipments related to work order (inferred)")
    public ResponseEntity<List<ShipmentDTO>> listByWorkOrder(@PathVariable Integer workOrderId) {
        return ResponseEntity.ok(shipmentService.getByWorkOrder(workOrderId));
    }

    @PutMapping("/{id}/update-status")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Update shipment status")
    public ResponseEntity<ShipmentDTO> updateStatus(@PathVariable Integer id, @RequestParam String status) {
        return ResponseEntity.ok(shipmentService.updateStatus(id, status));
    }
}
