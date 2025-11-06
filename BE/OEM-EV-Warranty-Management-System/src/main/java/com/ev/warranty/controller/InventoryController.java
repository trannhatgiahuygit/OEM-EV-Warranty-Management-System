package com.ev.warranty.controller;

import com.ev.warranty.model.dto.inventory.*;
import com.ev.warranty.service.inter.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Inventory Management", description = "APIs for managing parts inventory and supply chain")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/stock")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get current stock levels", 
               description = "Get paginated list of current stock levels with filtering")
    public ResponseEntity<Page<InventoryStockDTO>> getCurrentStock(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Search by part name or number") @RequestParam(required = false) String search,
            @Parameter(description = "Filter by part category") @RequestParam(required = false) String category,
            @Parameter(description = "Filter by warehouse ID") @RequestParam(required = false) String warehouseId) {
        
        log.info("Getting current stock - page: {}, size: {}, search: {}, category: {}, warehouse: {}", 
                page, size, search, category, warehouseId);
        
        Page<InventoryStockDTO> stock = inventoryService.getCurrentStock(page, size, search, category, warehouseId);
        
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/stock/part/{partId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get stock for specific part", 
               description = "Get stock levels for a specific part across all warehouses")
    public ResponseEntity<List<InventoryStockDTO>> getPartStock(
            @Parameter(description = "Part ID") @PathVariable Integer partId) {
        
        log.info("Getting stock for part: {}", partId);
        
        List<InventoryStockDTO> stock = inventoryService.getPartStock(partId);
        
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/alerts/low-stock")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get low stock alerts", 
               description = "Get list of parts with low stock levels")
    public ResponseEntity<List<InventoryStockDTO>> getLowStockAlerts() {
        
        log.info("Getting low stock alerts");
        
        List<InventoryStockDTO> alerts = inventoryService.getLowStockAlerts();
        
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get low stock (alternative path)", 
               description = "Alternative endpoint for low stock alerts")
    public ResponseEntity<List<InventoryStockDTO>> getLowStock() {
        return getLowStockAlerts();
    }

    @GetMapping("/alerts/out-of-stock")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get out of stock items", 
               description = "Get list of parts that are out of stock")
    public ResponseEntity<List<InventoryStockDTO>> getOutOfStockItems() {
        
        log.info("Getting out of stock items");
        
        List<InventoryStockDTO> outOfStock = inventoryService.getOutOfStockItems();
        
        return ResponseEntity.ok(outOfStock);
    }

    @GetMapping("/out-of-stock")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get out of stock (alternative path)", 
               description = "Alternative endpoint for out of stock items")
    public ResponseEntity<List<InventoryStockDTO>> getOutOfStock() {
        return getOutOfStockItems();
    }

    @PutMapping("/stock/update")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Update stock levels", 
               description = "Update stock levels for a specific part in a warehouse")
    public ResponseEntity<InventoryStockDTO> updateStock(
            @Parameter(description = "Part ID") @RequestParam Integer partId,
            @Parameter(description = "Warehouse ID") @RequestParam Integer warehouseId,
            @Parameter(description = "Quantity to add/subtract") @RequestParam Integer quantity,
            @Parameter(description = "Update notes") @RequestParam(required = false) String notes,
            Authentication authentication) {
        
        String updatedBy = authentication.getName();
        log.info("Updating stock - part: {}, warehouse: {}, quantity: {}, updatedBy: {}", 
                partId, warehouseId, quantity, updatedBy);
        
        InventoryStockDTO updatedStock = inventoryService.updateStock(partId, warehouseId, quantity, notes, updatedBy);
        
        log.info("Stock updated successfully");
        return ResponseEntity.ok(updatedStock);
    }

    @PutMapping("/update-stock")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Update stock (alternative path)", 
               description = "Alternative endpoint for updating stock")
    public ResponseEntity<InventoryStockDTO> updateStockAlt(
            @Parameter(description = "Part ID") @RequestParam Integer partId,
            @Parameter(description = "Warehouse ID") @RequestParam Integer warehouseId,
            @Parameter(description = "Quantity to add/subtract") @RequestParam Integer quantity,
            @Parameter(description = "Update notes") @RequestParam(required = false) String notes,
            Authentication authentication) {
        return updateStock(partId, warehouseId, quantity, notes, authentication);
    }

    @PostMapping("/reserve")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Reserve parts for work order", 
               description = "Reserve parts for a specific work order")
    public ResponseEntity<List<InventoryStockDTO>> reserveParts(
            @Valid @RequestBody PartAllocationRequestDTO request,
            Authentication authentication) {
        
        String reservedBy = authentication.getName();
        log.info("Reserving parts for work order: {} by user: {}", request.getWorkOrderId(), reservedBy);
        
        List<InventoryStockDTO> reservedParts = inventoryService.reserveParts(request, reservedBy);
        
        log.info("Parts reserved successfully for work order: {}", request.getWorkOrderId());
        return ResponseEntity.ok(reservedParts);
    }

    @PostMapping("/release")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Release reserved parts", 
               description = "Release previously reserved parts for a work order")
    public ResponseEntity<List<InventoryStockDTO>> releaseReservedParts(
            @Parameter(description = "Work Order ID") @RequestParam Integer workOrderId,
            Authentication authentication) {
        
        String releasedBy = authentication.getName();
        log.info("Releasing reserved parts for work order: {} by user: {}", workOrderId, releasedBy);
        
        List<InventoryStockDTO> releasedParts = inventoryService.releaseReservedParts(workOrderId, releasedBy);
        
        log.info("Reserved parts released for work order: {}", workOrderId);
        return ResponseEntity.ok(releasedParts);
    }

    @PostMapping("/shipments")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Create shipment", 
               description = "Create a new shipment from warehouse to service center")
    public ResponseEntity<ShipmentResponseDTO> createShipment(
            @Valid @RequestBody ShipmentCreateRequestDTO request,
            Authentication authentication) {
        
        String createdBy = authentication.getName();
        log.info("Creating shipment from warehouse: {} to center: {} by user: {}", 
                request.getWarehouseId(), request.getDestinationCenterId(), createdBy);
        
        ShipmentResponseDTO shipment = inventoryService.createShipment(request, createdBy);
        
        log.info("Shipment created successfully: {}", shipment.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(shipment);
    }

    @GetMapping("/shipments")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get all shipments", 
               description = "Get paginated list of shipments with filtering")
    public ResponseEntity<Page<ShipmentResponseDTO>> getAllShipments(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @Parameter(description = "Filter by destination center") @RequestParam(required = false) String destinationCenterId) {
        
        log.info("Getting shipments - page: {}, size: {}, status: {}, destination: {}", 
                page, size, status, destinationCenterId);
        
        Page<ShipmentResponseDTO> shipments = inventoryService.getAllShipments(page, size, status, destinationCenterId);
        
        return ResponseEntity.ok(shipments);
    }

    @PutMapping("/shipments/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Update shipment status", 
               description = "Update the status of a shipment")
    public ResponseEntity<ShipmentResponseDTO> updateShipmentStatus(
            @Parameter(description = "Shipment ID") @PathVariable Integer id,
            @Parameter(description = "New status") @RequestParam String status,
            Authentication authentication) {
        
        String updatedBy = authentication.getName();
        log.info("Updating shipment status - ID: {}, status: {}, updatedBy: {}", id, status, updatedBy);
        
        ShipmentResponseDTO shipment = inventoryService.updateShipmentStatus(id, status, updatedBy);
        
        return ResponseEntity.ok(shipment);
    }

    @PostMapping("/shipments/{id}/receive")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Receive shipment", 
               description = "Mark a shipment as received at the service center")
    public ResponseEntity<ShipmentResponseDTO> receiveShipment(
            @Parameter(description = "Shipment ID") @PathVariable Integer id,
            Authentication authentication) {
        
        String receivedBy = authentication.getName();
        log.info("Receiving shipment - ID: {}, receivedBy: {}", id, receivedBy);
        
        ShipmentResponseDTO shipment = inventoryService.receiveShipment(id, receivedBy);
        
        log.info("Shipment received successfully: {}", shipment.getId());
        return ResponseEntity.ok(shipment);
    }

    @GetMapping("/shipments/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get shipment details", 
               description = "Get detailed information about a specific shipment")
    public ResponseEntity<ShipmentResponseDTO> getShipmentById(
            @Parameter(description = "Shipment ID") @PathVariable Integer id) {
        
        log.info("Getting shipment by ID: {}", id);
        
        ShipmentResponseDTO shipment = inventoryService.getShipmentById(id);
        
        return ResponseEntity.ok(shipment);
    }

    @GetMapping("/stock/history/part/{partId}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get part stock history", 
               description = "Get stock history for a specific part")
    public ResponseEntity<List<InventoryStockDTO>> getPartStockHistory(
            @Parameter(description = "Part ID") @PathVariable Integer partId,
            @Parameter(description = "Warehouse ID") @RequestParam(required = false) Integer warehouseId) {
        
        log.info("Getting stock history for part: {} in warehouse: {}", partId, warehouseId);
        
        List<InventoryStockDTO> history = inventoryService.getPartStockHistory(partId, warehouseId);
        
        return ResponseEntity.ok(history);
    }

    @GetMapping("/reports/stock")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Generate stock report", 
               description = "Generate comprehensive stock report")
    public ResponseEntity<List<InventoryStockDTO>> generateStockReport(
            @Parameter(description = "Report type") @RequestParam(defaultValue = "summary") String reportType,
            @Parameter(description = "Warehouse ID") @RequestParam(required = false) String warehouseId) {
        
        log.info("Generating stock report - type: {}, warehouse: {}", reportType, warehouseId);
        
        List<InventoryStockDTO> report = inventoryService.generateStockReport(reportType, warehouseId);
        
        return ResponseEntity.ok(report);
    }

    @PutMapping("/stock/minimum")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Set minimum stock level", 
               description = "Set minimum stock level for a specific part in a warehouse")
    public ResponseEntity<InventoryStockDTO> setMinimumStock(
            @Parameter(description = "Part ID") @RequestParam Integer partId,
            @Parameter(description = "Warehouse ID") @RequestParam Integer warehouseId,
            @Parameter(description = "Minimum stock level") @RequestParam Integer minimumStock,
            Authentication authentication) {
        
        String updatedBy = authentication.getName();
        log.info("Setting minimum stock - part: {}, warehouse: {}, minimum: {}, updatedBy: {}", 
                partId, warehouseId, minimumStock, updatedBy);
        
        InventoryStockDTO updatedStock = inventoryService.setMinimumStock(partId, warehouseId, minimumStock, updatedBy);
        
        log.info("Minimum stock set successfully for part: {}", partId);
        return ResponseEntity.ok(updatedStock);
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get stock alerts", 
               description = "Get all stock alerts and notifications")
    public ResponseEntity<List<InventoryStockDTO>> getStockAlerts() {
        
        log.info("Getting stock alerts");
        
        List<InventoryStockDTO> alerts = inventoryService.getStockAlerts();
        
        return ResponseEntity.ok(alerts);
    }
}
