package com.ev.warranty.controller;

import com.ev.warranty.model.dto.shipment.ShipmentDTO;
import com.ev.warranty.service.inter.ShipmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ShipmentControllerTest {

    private MockMvc mockMvc;
    private ShipmentService shipmentService;

    @BeforeEach
    void setup() {
        shipmentService = Mockito.mock(ShipmentService.class);
        ShipmentController controller = new ShipmentController(shipmentService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void trackById_shouldReturnShipment() throws Exception {
        ShipmentDTO dto = ShipmentDTO.builder()
                .id(10)
                .trackingNumber("TRK-10")
                .status("in_transit")
                .shippedAt(LocalDateTime.now())
                .build();
        Mockito.when(shipmentService.getById(anyInt())).thenReturn(dto);

        mockMvc.perform(get("/api/shipments/10/track").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.trackingNumber").value("TRK-10"));
    }
}
