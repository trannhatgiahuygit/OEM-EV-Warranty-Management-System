package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.shipment.ShipmentDTO;

import java.util.List;

public interface ShipmentService {
    ShipmentDTO getById(Integer id);
    ShipmentDTO getByTracking(String trackingNumber);
    List<ShipmentDTO> getByStatus(String status);
    List<ShipmentDTO> getByDestinationCenter(Integer destinationCenterId);
    List<ShipmentDTO> getByClaim(Integer claimId);
    List<ShipmentDTO> getByWorkOrder(Integer workOrderId);
    ShipmentDTO updateStatus(Integer shipmentId, String status);
}
