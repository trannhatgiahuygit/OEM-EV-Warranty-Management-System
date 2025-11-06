package com.ev.warranty.service;

import com.ev.warranty.model.dto.shipment.ShipmentDTO;
import com.ev.warranty.model.entity.Shipment;
import com.ev.warranty.repository.ShipmentRepository;
import com.ev.warranty.repository.StockReservationRepository;
import com.ev.warranty.service.impl.ShipmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ShipmentServiceImplTest {

    @Mock
    ShipmentRepository shipmentRepository;

    @Mock
    StockReservationRepository stockReservationRepository;

    @InjectMocks
    ShipmentServiceImpl shipmentService;

    Shipment mappedShipment;

    @BeforeEach
    void setup() {
        mappedShipment = Shipment.builder()
                .id(100)
                .trackingNumber("TRK-100")
                .status("in_transit")
                .build();
    }

    @Test
    void getByClaim_shouldReturnMappedShipments_whenMappingExists() {
        given(shipmentRepository.findByClaimId(1)).willReturn(List.of(mappedShipment));

        List<ShipmentDTO> result = shipmentService.getByClaim(1);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(100);
        assertThat(result.get(0).getTrackingNumber()).isEqualTo("TRK-100");
    }

    @Test
    void getByClaim_shouldFallbackToInTransit_whenNoMappingButReservationsExist() {
        given(shipmentRepository.findByClaimId(2)).willReturn(List.of());
        // non-empty reservations -> fallback will return in_transit list
        given(stockReservationRepository.findByClaimId(2)).willReturn(List.of(new com.ev.warranty.model.entity.StockReservation()));
        given(shipmentRepository.findByStatus("in_transit")).willReturn(List.of(mappedShipment));

        List<ShipmentDTO> result = shipmentService.getByClaim(2);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo("in_transit");
    }

    @Test
    void updateStatus_shouldSetShippedAndDeliveredTimestamps() {
        Shipment s = Shipment.builder().id(5).status("pending").build();
        given(shipmentRepository.findById(5)).willReturn(Optional.of(s));
        given(shipmentRepository.save(any())).willAnswer(a -> a.getArgument(0));

        // set shipped
        ShipmentDTO shipped = shipmentService.updateStatus(5, "shipped");
        assertThat(shipped.getStatus()).isEqualTo("shipped");
        assertThat(shipped.getShippedAt()).isNotNull();

        // set delivered
        ShipmentDTO delivered = shipmentService.updateStatus(5, "delivered");
        assertThat(delivered.getStatus()).isEqualTo("delivered");
        assertThat(delivered.getDeliveredAt()).isNotNull();

        ArgumentCaptor<Shipment> captor = ArgumentCaptor.forClass(Shipment.class);
        verify(shipmentRepository, times(2)).save(captor.capture());
        // last save corresponds to "delivered"
        Shipment last = captor.getAllValues().getLast();
        assertThat(last.getStatus()).isEqualTo("delivered");
    }
}
