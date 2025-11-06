package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.shipment.ShipmentDTO;
import com.ev.warranty.model.entity.Shipment;
import com.ev.warranty.model.entity.StockReservation;
import com.ev.warranty.repository.ShipmentRepository;
import com.ev.warranty.repository.StockReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements com.ev.warranty.service.inter.ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final StockReservationRepository stockReservationRepository;

    @Override
    public ShipmentDTO getById(Integer id) {
        Shipment s = shipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
        return toDto(s);
    }

    @Override
    public ShipmentDTO getByTracking(String trackingNumber) {
        Shipment s = shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
        return toDto(s);
    }

    @Override
    public List<ShipmentDTO> getByStatus(String status) {
        return shipmentRepository.findByStatus(status).stream().map(this::toDto).toList();
    }

    @Override
    public List<ShipmentDTO> getByDestinationCenter(Integer destinationCenterId) {
        return shipmentRepository.findByDestinationCenterId(destinationCenterId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public List<ShipmentDTO> getByClaim(Integer claimId) {
        List<ShipmentDTO> mapped = shipmentRepository.findByClaimId(claimId).stream().map(this::toDto).toList();
        if (!mapped.isEmpty()) return mapped;
        // Fallback: infer via reservations then general in_transit visibility
        List<StockReservation> reservations = stockReservationRepository.findByClaimId(claimId);
        if (reservations.isEmpty()) return List.of();
        return shipmentRepository.findByStatus("in_transit").stream().map(this::toDto).toList();
    }

    @Override
    public List<ShipmentDTO> getByWorkOrder(Integer workOrderId) {
        List<ShipmentDTO> mapped = shipmentRepository.findByWorkOrderId(workOrderId).stream().map(this::toDto).toList();
        if (!mapped.isEmpty()) return mapped;
        List<StockReservation> reservations = stockReservationRepository.findByWorkOrderId(workOrderId);
        if (reservations.isEmpty()) return List.of();
        return shipmentRepository.findByStatus("in_transit").stream().map(this::toDto).toList();
    }

    @Override
    public ShipmentDTO updateStatus(Integer shipmentId, String status) {
        Shipment s = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
        s.setStatus(status);
        if ("shipped".equalsIgnoreCase(status) && s.getShippedAt() == null) {
            s.setShippedAt(LocalDateTime.now());
        }
        if ("delivered".equalsIgnoreCase(status)) {
            s.setDeliveredAt(LocalDateTime.now());
        }
        s = shipmentRepository.save(s);
        return toDto(s);
    }

    private ShipmentDTO toDto(Shipment s) {
        return ShipmentDTO.builder()
                .id(s.getId())
                .trackingNumber(s.getTrackingNumber())
                .carrier(s.getCarrier())
                .status(s.getStatus())
                .destinationCenterId(s.getDestinationCenterId())
                .shippedAt(s.getShippedAt())
                .deliveredAt(s.getDeliveredAt())
                .claimId(s.getClaim() != null ? s.getClaim().getId() : null)
                .workOrderId(s.getWorkOrder() != null ? s.getWorkOrder().getId() : null)
                .build();
    }
}
