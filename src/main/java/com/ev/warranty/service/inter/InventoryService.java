package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.inventory.*;
import org.springframework.data.domain.Page;

import java.util.List;

public interface InventoryService {

    /**
     * Get current stock levels for all parts
     * Available to: EVM_STAFF, ADMIN only
     */
    Page<InventoryStockDTO> getCurrentStock(int page, int size, String search, String category, String warehouseId);

    /**
     * Get stock levels for a specific part
     * Available to: All authenticated users
     */
    List<InventoryStockDTO> getPartStock(Integer partId);

    /**
     * Get low stock alerts
     * Available to: EVM_STAFF, ADMIN only
     */
    List<InventoryStockDTO> getLowStockAlerts();

    /**
     * Get out of stock items
     * Available to: EVM_STAFF, ADMIN only
     */
    List<InventoryStockDTO> getOutOfStockItems();

    /**
     * Update stock levels (receive parts)
     * Available to: EVM_STAFF, ADMIN only
     */
    InventoryStockDTO updateStock(Integer partId, Integer warehouseId, Integer quantity, String notes, String updatedBy);

    /**
     * Reserve parts for work order
     * Available to: SC_STAFF, ADMIN only
     */
    List<InventoryStockDTO> reserveParts(PartAllocationRequestDTO request, String reservedBy);

    /**
     * Release reserved parts
     * Available to: SC_STAFF, ADMIN only
     */
    List<InventoryStockDTO> releaseReservedParts(Integer workOrderId, String releasedBy);

    /**
     * Create shipment to service center
     * Available to: EVM_STAFF, ADMIN only
     */
    ShipmentResponseDTO createShipment(ShipmentCreateRequestDTO request, String createdBy);

    /**
     * Get all shipments
     * Available to: EVM_STAFF, ADMIN only
     */
    Page<ShipmentResponseDTO> getAllShipments(int page, int size, String status, String destinationCenterId);

    /**
     * Update shipment status
     * Available to: EVM_STAFF, ADMIN only
     */
    ShipmentResponseDTO updateShipmentStatus(Integer shipmentId, String status, String updatedBy);

    /**
     * Receive shipment at service center
     * Available to: SC_STAFF, ADMIN only
     */
    ShipmentResponseDTO receiveShipment(Integer shipmentId, String receivedBy);

    /**
     * Get shipment details
     * Available to: All authenticated users
     */
    ShipmentResponseDTO getShipmentById(Integer shipmentId);

    /**
     * Get stock history for a part
     * Available to: EVM_STAFF, ADMIN only
     */
    List<InventoryStockDTO> getPartStockHistory(Integer partId, Integer warehouseId);

    /**
     * Generate stock report
     * Available to: EVM_STAFF, ADMIN only
     */
    List<InventoryStockDTO> generateStockReport(String reportType, String warehouseId);

    /**
     * Set minimum stock levels
     * Available to: EVM_STAFF, ADMIN only
     */
    InventoryStockDTO setMinimumStock(Integer partId, Integer warehouseId, Integer minimumStock, String updatedBy);

    /**
     * Get stock alerts and notifications
     * Available to: EVM_STAFF, ADMIN only
     */
    List<InventoryStockDTO> getStockAlerts();
}
