package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.inventory.*;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import com.ev.warranty.service.inter.InventoryService;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final PartRepository partRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentItemRepository shipmentItemRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryStockDTO> getCurrentStock(int page, int size, String search, String category, String warehouseId) {
        log.info("Getting current stock - page: {}, size: {}, search: {}, category: {}, warehouse: {}", 
                page, size, search, category, warehouseId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Inventory> inventories;

        if (warehouseId != null && !warehouseId.isEmpty()) {
            Integer warehouseIdInt = Integer.parseInt(warehouseId);
            inventories = inventoryRepository.findByWarehouseId(warehouseIdInt, pageable);
        } else {
            inventories = inventoryRepository.findAll(pageable);
        }

        return inventories.map(this::mapToStockDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryStockDTO> getPartStock(Integer partId) {
        log.info("Getting stock for part: {}", partId);

        List<Inventory> inventories = inventoryRepository.findByPartId(partId);
        return inventories.stream()
                .map(this::mapToStockDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryStockDTO> getLowStockAlerts() {
        log.info("Getting low stock alerts");

        List<Inventory> inventories = inventoryRepository.findAll();
        return inventories.stream()
                .filter(inv -> inv.getCurrentStock() <= inv.getMinimumStock())
                .filter(inv -> inv.getCurrentStock() > 0) // Not out of stock
                .map(this::mapToStockDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryStockDTO> getOutOfStockItems() {
        log.info("Getting out of stock items");

        List<Inventory> inventories = inventoryRepository.findAll();
        return inventories.stream()
                .filter(inv -> inv.getCurrentStock() == 0)
                .map(this::mapToStockDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InventoryStockDTO updateStock(Integer partId, Integer warehouseId, Integer quantity, String notes, String updatedBy) {
        log.info("Updating stock - part: {}, warehouse: {}, quantity: {}, updatedBy: {}", 
                partId, warehouseId, quantity, updatedBy);

        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new NotFoundException("Part not found with ID: " + partId));

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new NotFoundException("Warehouse not found with ID: " + warehouseId));

        User updatedByUser = userRepository.findByUsername(updatedBy)
                .orElseThrow(() -> new NotFoundException("User not found: " + updatedBy));

        Inventory inventory = inventoryRepository.findByPartIdAndWarehouseId(partId, warehouseId)
                .orElse(Inventory.builder()
                        .part(part)
                        .warehouse(warehouse)
                        .currentStock(0)
                        .reservedStock(0)
                        .minimumStock(0)
                        .maximumStock(1000)
                        .build());

        // Update stock levels
        inventory.setCurrentStock(inventory.getCurrentStock() + quantity);
        inventory.setLastUpdated(LocalDateTime.now());
        inventory.setLastUpdatedBy(updatedByUser);

        Inventory updatedInventory = inventoryRepository.save(inventory);

        log.info("Stock updated successfully - part: {}, warehouse: {}, new stock: {}", 
                partId, warehouseId, updatedInventory.getCurrentStock());

        return mapToStockDTO(updatedInventory);
    }

    @Override
    @Transactional
    public List<InventoryStockDTO> reserveParts(PartAllocationRequestDTO request, String reservedBy) {
        log.info("Reserving parts for work order: {} by user: {}", request.getWorkOrderId(), reservedBy);

        List<InventoryStockDTO> reservedParts = request.getItems().stream()
                .map(item -> {
                    Inventory inventory = inventoryRepository.findByPartIdAndWarehouseId(item.getPartId(), 1) // Default warehouse
                            .orElseThrow(() -> new NotFoundException("Inventory not found for part: " + item.getPartId()));

                    if (inventory.getCurrentStock() - inventory.getReservedStock() < item.getQuantity()) {
                        throw new BadRequestException("Insufficient stock for part: " + item.getPartId());
                    }

                    inventory.setReservedStock(inventory.getReservedStock() + item.getQuantity());
                    inventory.setLastUpdated(LocalDateTime.now());
                    inventoryRepository.save(inventory);

                    return mapToStockDTO(inventory);
                })
                .collect(Collectors.toList());

        log.info("Parts reserved successfully for work order: {}", request.getWorkOrderId());
        return reservedParts;
    }

    @Override
    @Transactional
    public List<InventoryStockDTO> releaseReservedParts(Integer workOrderId, String releasedBy) {
        log.info("Releasing reserved parts for work order: {} by user: {}", workOrderId, releasedBy);

        // This is a simplified implementation
        // In a real system, you would track which parts were reserved for which work order
        List<Inventory> inventories = inventoryRepository.findAll();
        
        List<InventoryStockDTO> releasedParts = inventories.stream()
                .filter(inv -> inv.getReservedStock() > 0)
                .map(inv -> {
                    inv.setReservedStock(0);
                    inv.setLastUpdated(LocalDateTime.now());
                    inventoryRepository.save(inv);
                    return mapToStockDTO(inv);
                })
                .collect(Collectors.toList());

        log.info("Reserved parts released for work order: {}", workOrderId);
        return releasedParts;
    }

    @Override
    @Transactional
    public ShipmentResponseDTO createShipment(ShipmentCreateRequestDTO request, String createdBy) {
        log.info("Creating shipment from warehouse: {} to center: {} by user: {}", 
                request.getWarehouseId(), request.getDestinationCenterId(), createdBy);

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new NotFoundException("Warehouse not found with ID: " + request.getWarehouseId()));

        User createdByUser = userRepository.findByUsername(createdBy)
                .orElseThrow(() -> new NotFoundException("User not found: " + createdBy));

        Shipment shipment = Shipment.builder()
                .warehouse(warehouse)
                .destinationCenterId(request.getDestinationCenterId())
                .createdBy(createdByUser)
                .shippedAt(request.getShippedAt())
                .status(request.getStatus())
                .trackingNumber(request.getTrackingNumber())
                .carrier(request.getCarrier())
                .notes(request.getNotes())
                .build();

        Shipment savedShipment = shipmentRepository.save(shipment);

        // Create shipment items
        List<ShipmentItem> shipmentItems = request.getItems().stream()
                .map(item -> {
                    Part part = partRepository.findById(item.getPartId())
                            .orElseThrow(() -> new NotFoundException("Part not found with ID: " + item.getPartId()));

                    return ShipmentItem.builder()
                            .shipment(savedShipment)
                            .part(part)
                            .quantity(item.getQuantity())
                            .notes(item.getNotes())
                            .build();
                })
                .collect(Collectors.toList());

        shipmentItemRepository.saveAll(shipmentItems);

        log.info("Shipment created successfully: {}", savedShipment.getId());
        return mapToShipmentResponseDTO(savedShipment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShipmentResponseDTO> getAllShipments(int page, int size, String status, String destinationCenterId) {
        log.info("Getting shipments - page: {}, size: {}, status: {}, destination: {}", 
                page, size, status, destinationCenterId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Shipment> shipments;

        if (status != null && !status.isEmpty()) {
            shipments = shipmentRepository.findByStatus(status, pageable);
        } else {
            shipments = shipmentRepository.findAll(pageable);
        }

        return shipments.map(this::mapToShipmentResponseDTO);
    }

    @Override
    @Transactional
    public ShipmentResponseDTO updateShipmentStatus(Integer shipmentId, String status, String updatedBy) {
        log.info("Updating shipment status - ID: {}, status: {}, updatedBy: {}", shipmentId, status, updatedBy);

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new NotFoundException("Shipment not found with ID: " + shipmentId));

        shipment.setStatus(status);
        if ("delivered".equals(status)) {
            // Note: deliveredAt field needs to be added to Shipment entity
            // shipment.setDeliveredAt(LocalDateTime.now());
        }

        Shipment updatedShipment = shipmentRepository.save(shipment);

        log.info("Shipment status updated successfully: {}", updatedShipment.getId());
        return mapToShipmentResponseDTO(updatedShipment);
    }

    @Override
    @Transactional
    public ShipmentResponseDTO receiveShipment(Integer shipmentId, String receivedBy) {
        log.info("Receiving shipment - ID: {}, receivedBy: {}", shipmentId, receivedBy);

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new NotFoundException("Shipment not found with ID: " + shipmentId));

        if (!"in_transit".equals(shipment.getStatus())) {
            throw new BadRequestException("Shipment is not in transit status");
        }

        shipment.setStatus("delivered");
        // Note: deliveredAt field needs to be added to Shipment entity
        // shipment.setDeliveredAt(LocalDateTime.now());
        Shipment receivedShipment = shipmentRepository.save(shipment);

        // Update inventory at destination
        List<ShipmentItem> items = shipmentItemRepository.findByShipmentId(shipmentId);
        for (ShipmentItem item : items) {
            updateStock(item.getPart().getId(), shipment.getDestinationCenterId(), 
                      item.getQuantity(), "Received from shipment " + shipmentId, receivedBy);
        }

        log.info("Shipment received successfully: {}", receivedShipment.getId());
        return mapToShipmentResponseDTO(receivedShipment);
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentResponseDTO getShipmentById(Integer shipmentId) {
        log.info("Getting shipment by ID: {}", shipmentId);

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new NotFoundException("Shipment not found with ID: " + shipmentId));

        return mapToShipmentResponseDTO(shipment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryStockDTO> getPartStockHistory(Integer partId, Integer warehouseId) {
        log.info("Getting stock history for part: {} in warehouse: {}", partId, warehouseId);

        // This is a simplified implementation
        // In a real system, you would have a separate stock history table
        List<Inventory> inventories = inventoryRepository.findByPartId(partId);
        return inventories.stream()
                .map(this::mapToStockDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryStockDTO> generateStockReport(String reportType, String warehouseId) {
        log.info("Generating stock report - type: {}, warehouse: {}", reportType, warehouseId);

        List<Inventory> inventories;
        if (warehouseId != null && !warehouseId.isEmpty()) {
            Integer warehouseIdInt = Integer.parseInt(warehouseId);
            inventories = inventoryRepository.findByWarehouseId(warehouseIdInt);
        } else {
            inventories = inventoryRepository.findAll();
        }

        return inventories.stream()
                .map(this::mapToStockDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InventoryStockDTO setMinimumStock(Integer partId, Integer warehouseId, Integer minimumStock, String updatedBy) {
        log.info("Setting minimum stock - part: {}, warehouse: {}, minimum: {}, updatedBy: {}", 
                partId, warehouseId, minimumStock, updatedBy);

        Inventory inventory = inventoryRepository.findByPartIdAndWarehouseId(partId, warehouseId)
                .orElseThrow(() -> new NotFoundException("Inventory not found"));

        inventory.setMinimumStock(minimumStock);
        inventory.setLastUpdated(LocalDateTime.now());
        Inventory updatedInventory = inventoryRepository.save(inventory);

        log.info("Minimum stock set successfully for part: {}", partId);
        return mapToStockDTO(updatedInventory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryStockDTO> getStockAlerts() {
        log.info("Getting stock alerts");

        List<Inventory> inventories = inventoryRepository.findAll();
        return inventories.stream()
                .filter(inv -> inv.getCurrentStock() <= inv.getMinimumStock())
                .map(this::mapToStockDTO)
                .collect(Collectors.toList());
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private InventoryStockDTO mapToStockDTO(Inventory inventory) {
        int availableStock = inventory.getCurrentStock() - inventory.getReservedStock();
        String stockStatus = determineStockStatus(inventory.getCurrentStock(), inventory.getMinimumStock());
        
        return InventoryStockDTO.builder()
                .id(inventory.getId())
                .warehouseId(inventory.getWarehouse().getId())
                .warehouseName(inventory.getWarehouse().getName())
                .warehouseLocation(inventory.getWarehouse().getLocation())
                .partId(inventory.getPart().getId())
                .partNumber(inventory.getPart().getPartNumber())
                .partName(inventory.getPart().getName())
                .partCategory(inventory.getPart().getCategory())
                .partDescription(inventory.getPart().getDescription())
                .currentStock(inventory.getCurrentStock())
                .reservedStock(inventory.getReservedStock())
                .availableStock(availableStock)
                .minimumStock(inventory.getMinimumStock())
                .maximumStock(inventory.getMaximumStock())
                .unitCost(inventory.getUnitCost())
                .totalValue(inventory.getUnitCost().multiply(BigDecimal.valueOf(inventory.getCurrentStock())))
                .stockStatus(stockStatus)
                .lastUpdated(inventory.getLastUpdated())
                .lastUpdatedBy(inventory.getLastUpdatedBy() != null ? inventory.getLastUpdatedBy().getUsername() : null)
                .lowStockAlert(inventory.getCurrentStock() <= inventory.getMinimumStock() && inventory.getCurrentStock() > 0)
                .outOfStockAlert(inventory.getCurrentStock() == 0)
                .build();
    }

    private ShipmentResponseDTO mapToShipmentResponseDTO(Shipment shipment) {
        List<ShipmentItem> items = shipmentItemRepository.findByShipmentId(shipment.getId());
        
        return ShipmentResponseDTO.builder()
                .id(shipment.getId())
                .warehouseId(shipment.getWarehouse().getId())
                .warehouseName(shipment.getWarehouse().getName())
                .warehouseLocation(shipment.getWarehouse().getLocation())
                .destinationCenterId(shipment.getDestinationCenterId())
                .status(shipment.getStatus())
                .trackingNumber(shipment.getTrackingNumber())
                .carrier(shipment.getCarrier())
                .shippedAt(shipment.getShippedAt())
                .deliveredAt(null) // Note: deliveredAt field needs to be added to Shipment entity
                .createdAt(LocalDateTime.now()) // Use current time as fallback
                .createdBy(shipment.getCreatedBy() != null ? shipment.getCreatedBy().getUsername() : null)
                .totalItems(items.size())
                .totalQuantity(items.stream().mapToInt(ShipmentItem::getQuantity).sum())
                .totalValue(items.stream()
                        .map(item -> BigDecimal.ZERO.multiply(BigDecimal.valueOf(item.getQuantity()))) // Use 0 as fallback
                        .reduce(BigDecimal.ZERO, BigDecimal::add))
                .items(items.stream()
                        .map(this::mapToShipmentItemResponseDTO)
                        .collect(Collectors.toList()))
                .build();
    }

    private ShipmentResponseDTO.ShipmentItemResponseDTO mapToShipmentItemResponseDTO(ShipmentItem item) {
        return ShipmentResponseDTO.ShipmentItemResponseDTO.builder()
                .id(item.getId())
                .partId(item.getPart().getId())
                .partNumber(item.getPart().getPartNumber())
                .partName(item.getPart().getName())
                .quantity(item.getQuantity())
                .unitCost(BigDecimal.ZERO) // Use 0 as fallback
                .totalCost(BigDecimal.ZERO.multiply(BigDecimal.valueOf(item.getQuantity())))
                .notes(item.getNotes())
                .build();
    }

    private String determineStockStatus(Integer currentStock, Integer minimumStock) {
        if (currentStock == 0) {
            return "out_of_stock";
        } else if (currentStock <= minimumStock) {
            return "low_stock";
        } else if (currentStock > minimumStock * 2) {
            return "overstock";
        } else {
            return "in_stock";
        }
    }
}
