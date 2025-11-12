package com.ev.warranty.service;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.mapper.VehicleMapper;
import com.ev.warranty.model.dto.vehicle.VehicleRegisterRequestDTO;
import com.ev.warranty.model.dto.vehicle.VehicleResponseDTO;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import com.ev.warranty.service.impl.VehicleServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class VehicleServiceImplTest {

    @Mock private VehicleRepository vehicleRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private UserRepository userRepository;
    @Mock private PartRepository partRepository;
    @Mock private PartSerialRepository partSerialRepository;
    @Mock private VehicleMapper vehicleMapper;
    @Mock private VehicleModelRepository vehicleModelRepository;

    @InjectMocks private VehicleServiceImpl vehicleService;

    private User adminUser;
    private Customer savedCustomer;
    private VehicleModel linkedModel;
    private Part batteryPart;

    @BeforeEach
    void setUp() {
        adminUser = User.builder().id(10).username("admin").build();
        savedCustomer = Customer.builder().id(101).name("John Doe").email("john@example.com").build();
        linkedModel = VehicleModel.builder().id(55).name("EV Model X Pro").active(true).build();
        batteryPart = Part.builder().id(200).partNumber("BAT-001").name("Battery Pack").category("POWER").build();
    }

    private VehicleRegisterRequestDTO buildValidRequest() {
        return VehicleRegisterRequestDTO.builder()
                .vin("1HGCM82633A004352")
                .licensePlate("ab-1234")
                .model("EV Model Y Standard")
                .vehicleModelId(linkedModel.getId())
                .year(LocalDate.now().getYear())
                .mileageKm(0)
                .customerInfo(VehicleRegisterRequestDTO.CustomerInfoDTO.builder()
                        .name("John Doe")
                        .email("john@example.com")
                        .phone("0900000000")
                        .address("123 Street")
                        .build())
                .registrationDate(LocalDate.now().minusDays(1))
                .installedParts(List.of(
                        VehicleRegisterRequestDTO.PartSerialDTO.builder()
                                .partId(batteryPart.getId())
                                .serialNumber("sn-12345")
                                .manufactureDate(LocalDate.now().minusMonths(1))
                                .installedAt(LocalDateTime.now().minusDays(1))
                                .build()
                ))
                .build();
    }

    @Test
    @DisplayName("registerVehicle: success creates vehicle, parts, and sets metadata for new customer")
    void registerVehicle_success_newCustomer_withParts() {
        VehicleRegisterRequestDTO req = buildValidRequest();

        when(vehicleRepository.existsByVin(req.getVin())).thenReturn(false);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(adminUser));
        when(customerRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenReturn(savedCustomer);
        when(vehicleModelRepository.findById(linkedModel.getId())).thenReturn(Optional.of(linkedModel));

        // Part validations and retrievals
        when(partRepository.existsById(batteryPart.getId())).thenReturn(true);
        when(partSerialRepository.existsBySerialNumber("sn-12345")).thenReturn(false);
        when(partRepository.findById(batteryPart.getId())).thenReturn(Optional.of(batteryPart));
        when(partSerialRepository.save(any())).thenAnswer(inv -> {
            PartSerial ps = inv.getArgument(0);
            ps.setId(300);
            return ps;
        });

        // Persist vehicle and map to DTO
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> {
            Vehicle v = inv.getArgument(0);
            v.setId(999);
            return v;
        });
        when(vehicleMapper.toResponseDTO(any(Vehicle.class))).thenAnswer(inv -> {
            Vehicle v = inv.getArgument(0);
            return VehicleResponseDTO.builder()
                    .id(v.getId())
                    .vin(v.getVin())
                    .licensePlate(v.getLicensePlate())
                    .model(v.getModel())
                    .year(v.getYear())
                    .registrationDate(v.getRegistrationDate())
                    .warrantyStart(v.getWarrantyStart())
                    .warrantyEnd(v.getWarrantyEnd())
                    .mileageKm(v.getMileageKm())
                    .customer(VehicleResponseDTO.CustomerSummaryDTO.builder()
                            .id(savedCustomer.getId())
                            .name(savedCustomer.getName())
                            .email(savedCustomer.getEmail())
                            .build())
                    .build();
        });

        VehicleResponseDTO resp = vehicleService.registerVehicle(req, "admin");

        assertNotNull(resp);
        assertEquals(999, resp.getId());
        // Model should be normalized to linked model name
        assertEquals("EV Model X Pro", resp.getModel());
        assertNotNull(resp.getRegistrationDate());
        assertNotNull(resp.getWarrantyStart());
        assertNotNull(resp.getWarrantyEnd());
        assertNotNull(resp.getCustomer());
        assertEquals(true, resp.getCustomer().getIsNewCustomer());
        assertNotNull(resp.getRegistrationSummary());
        assertEquals("admin", resp.getRegistrationSummary().getRegisteredBy());
        assertEquals(1, resp.getRegistrationSummary().getTotalPartsInstalled());
        assertEquals("5 years", resp.getRegistrationSummary().getWarrantyPeriod());

        verify(vehicleRepository).save(any(Vehicle.class));
        verify(partSerialRepository, times(1)).save(any(PartSerial.class));
    }

    @Test
    @DisplayName("registerVehicle: fails when VIN already exists")
    void registerVehicle_fail_vinExists() {
        VehicleRegisterRequestDTO req = buildValidRequest();
        when(vehicleRepository.existsByVin(req.getVin())).thenReturn(true);
        assertThrows(ValidationException.class, () -> vehicleService.registerVehicle(req, "admin"));
        verify(vehicleRepository, never()).save(any());
    }

    @Test
    @DisplayName("registerVehicle: fails when vehicleModelId missing")
    void registerVehicle_fail_missingModelId() {
        VehicleRegisterRequestDTO req = buildValidRequest();
        req.setVehicleModelId(null);
        when(vehicleRepository.existsByVin(req.getVin())).thenReturn(false);
        // ensure part validations pass so modelId rule triggers
        when(partRepository.existsById(batteryPart.getId())).thenReturn(true);
        when(partSerialRepository.existsBySerialNumber("sn-12345")).thenReturn(false);
        assertThrows(ValidationException.class, () -> vehicleService.registerVehicle(req, "admin"));
    }

    @Test
    @DisplayName("registerVehicle: fails when both customerId and customerInfo provided")
    void registerVehicle_fail_bothCustomerRefsProvided() {
        VehicleRegisterRequestDTO req = buildValidRequest();
        req.setCustomerId(777);
        when(vehicleRepository.existsByVin(req.getVin())).thenReturn(false);
        assertThrows(ValidationException.class, () -> vehicleService.registerVehicle(req, "admin"));
    }

    @Test
    @DisplayName("registerVehicle: fails when part reference not found")
    void registerVehicle_fail_partNotFound() {
        VehicleRegisterRequestDTO req = buildValidRequest();
        when(vehicleRepository.existsByVin(req.getVin())).thenReturn(false);
        // part doesn't exist
        when(partRepository.existsById(batteryPart.getId())).thenReturn(false);
        assertThrows(NotFoundException.class, () -> vehicleService.registerVehicle(req, "admin"));
    }

    @Test
    @DisplayName("registerVehicle: fails when part serial duplicated")
    void registerVehicle_fail_partSerialDuplicate() {
        VehicleRegisterRequestDTO req = buildValidRequest();
        when(vehicleRepository.existsByVin(req.getVin())).thenReturn(false);
        when(partRepository.existsById(batteryPart.getId())).thenReturn(true);
        when(partSerialRepository.existsBySerialNumber("sn-12345")).thenReturn(true);
        assertThrows(ValidationException.class, () -> vehicleService.registerVehicle(req, "admin"));
    }

    @Test
    @DisplayName("updateMileage: success updates mileage and audit fields")
    void updateMileage_success() {
        Vehicle vehicle = Vehicle.builder()
                .id(500)
                .vin("1HGCM82633A004352")
                .mileageKm(100)
                .warrantyStart(LocalDate.now().minusYears(1))
                .warrantyEnd(LocalDate.now().plusYears(2))
                .build();
        when(vehicleRepository.findById(500)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(vehicleMapper.toResponseDTO(any(Vehicle.class))).thenAnswer(inv -> {
            Vehicle v = inv.getArgument(0);
            return VehicleResponseDTO.builder().id(v.getId()).mileageKm(v.getMileageKm()).build();
        });

        VehicleResponseDTO resp = vehicleService.updateMileage(500, 200, "admin");

        assertEquals(200, vehicle.getMileageKm());
        assertEquals("admin", vehicle.getUpdatedBy());
        assertNotNull(vehicle.getUpdatedAt());
        assertEquals(200, resp.getMileageKm());
        verify(vehicleRepository).save(any(Vehicle.class));
    }

    @Test
    @DisplayName("updateMileage: fails when negative")
    void updateMileage_fail_negative() {
        when(vehicleRepository.findById(1)).thenReturn(Optional.of(Vehicle.builder().id(1).mileageKm(0).build()));
        assertThrows(ValidationException.class, () -> vehicleService.updateMileage(1, -1, "admin"));
    }

    @Test
    @DisplayName("updateMileage: fails when less than current")
    void updateMileage_fail_lessThanCurrent() {
        when(vehicleRepository.findById(2)).thenReturn(Optional.of(Vehicle.builder().id(2).mileageKm(500).build()));
        assertThrows(ValidationException.class, () -> vehicleService.updateMileage(2, 400, "admin"));
    }

    @Test
    @DisplayName("findByVin: returns DTO when found")
    void findByVin_success() {
        Vehicle v = Vehicle.builder().id(700).vin("VINVINVINVINVIN12").build();
        when(vehicleRepository.findByVin("VINVINVINVINVIN12")).thenReturn(Optional.of(v));
        when(vehicleMapper.toResponseDTO(v)).thenReturn(VehicleResponseDTO.builder().id(700).vin("VINVINVINVINVIN12").build());
        Optional<VehicleResponseDTO> resp = vehicleService.findByVin("VINVINVINVINVIN12");
        assertTrue(resp.isPresent());
        assertEquals(700, resp.get().getId());
    }

    @Test
    @DisplayName("getWarrantyStatus: throws when vehicle not found")
    void getWarrantyStatus_notFound() {
        when(vehicleRepository.findById(404)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> vehicleService.getWarrantyStatus(404));
    }
}
