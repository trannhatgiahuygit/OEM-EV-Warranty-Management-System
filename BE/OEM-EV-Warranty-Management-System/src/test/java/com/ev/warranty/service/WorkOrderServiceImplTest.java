package com.ev.warranty.service;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.mapper.WorkOrderMapper;
import com.ev.warranty.model.dto.workorder.WorkOrderCreateRequestDTO;
import com.ev.warranty.model.dto.workorder.WorkOrderPartDTO;
import com.ev.warranty.model.dto.workorder.WorkOrderResponseDTO;
import com.ev.warranty.model.dto.workorder.WorkOrderUpdateRequestDTO;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import com.ev.warranty.service.impl.WorkOrderServiceImpl;
import com.ev.warranty.service.inter.PartSerialService;
import com.ev.warranty.service.inter.TechnicianProfileService;
import com.ev.warranty.service.inter.ThirdPartyPartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WorkOrderServiceImplTest {

    @Mock private WorkOrderRepository workOrderRepository;
    @Mock private WorkOrderPartRepository workOrderPartRepository;
    @Mock private ClaimRepository claimRepository;
    @Mock private ClaimStatusRepository claimStatusRepository;
    @Mock private ClaimStatusHistoryRepository claimStatusHistoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private PartSerialRepository partSerialRepository;
    @Mock private WorkOrderMapper workOrderMapper;
    @Mock private TechnicianProfileService technicianProfileService;
    @Mock private ThirdPartyPartRepository thirdPartyPartRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private ThirdPartyPartSerialRepository thirdPartyPartSerialRepository;
    @Mock private PartSerialService partSerialService;
    @Mock private ThirdPartyPartService thirdPartyPartService;
    @Mock private StockReservationRepository stockReservationRepository;

    @InjectMocks private WorkOrderServiceImpl workOrderService;

    private Claim claim;
    private ClaimStatus readyStatus;
    private User technician;

    @BeforeEach
    void setup() {
        readyStatus = ClaimStatus.builder().id(10).code("READY_FOR_REPAIR").label("Ready for Repair").build();
        claim = Claim.builder().id(1).claimNumber("CLM-001").status(readyStatus).repairType("EVM_REPAIR").build();
        technician = User.builder().id(100).username("tech1").email("t@x.com")
                .role(Role.builder().id(5).roleName("SC_TECHNICIAN").build()).active(true).build();

        // Stub system user fallback used by WorkOrderServiceImpl#getCurrentUser
        when(userRepository.findByUsername("system")).thenReturn(Optional.of(
                User.builder().id(9999).username("system").role(Role.builder().roleName("ADMIN").build()).build()
        ));
        // Stub empty reservations/serials to avoid NPE in installPartsOnVehicle
        when(thirdPartyPartSerialRepository.findByReservedForClaimIdAndStatus(anyInt(), anyString()))
                .thenReturn(Collections.emptyList());
        when(stockReservationRepository.findByClaimOrWorkOrder(anyInt(), anyInt()))
                .thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("createWorkOrder should create work order when claim status READY_FOR_REPAIR")
    void testCreateWorkOrderSuccess() {
        WorkOrderCreateRequestDTO req = WorkOrderCreateRequestDTO.builder()
                .claimId(1)
                .technicianId(100)
                .estimatedLaborHours(BigDecimal.valueOf(2))
                .startTime(LocalDateTime.now())
                .build();

        when(claimRepository.findById(1)).thenReturn(Optional.of(claim));
        when(userRepository.findById(100)).thenReturn(Optional.of(technician));
        when(technicianProfileService.canAssignWork(100, req.getStartTime())).thenReturn(true);

        // Save returns entity with id assigned
        when(workOrderRepository.save(any())).thenAnswer(inv -> {
            WorkOrder wo = inv.getArgument(0);
            wo.setId(999);
            return wo;
        });
        when(workOrderMapper.toResponseDTO(any())).thenAnswer(inv -> {
            WorkOrder w = inv.getArgument(0);
            return WorkOrderResponseDTO.builder().id(w.getId()).status(w.getStatus()).claimId(w.getClaim().getId()).build();
        });

        WorkOrderResponseDTO dto = workOrderService.createWorkOrder(req);

        assertNotNull(dto);
        assertEquals(999, dto.getId());
        assertEquals("OPEN", dto.getStatus());
        verify(workOrderRepository).save(any(WorkOrder.class));
        verify(technicianProfileService).incrementWorkload(100);
    }

    @Test
    @DisplayName("createWorkOrder should fail when claim status not READY_FOR_REPAIR")
    void testCreateWorkOrderInvalidStatus() {
        ClaimStatus other = ClaimStatus.builder().id(11).code("OPEN").label("Open").build();
        claim.setStatus(other);
        when(claimRepository.findById(1)).thenReturn(Optional.of(claim));
        WorkOrderCreateRequestDTO req = WorkOrderCreateRequestDTO.builder().claimId(1).technicianId(100).build();
        assertThrows(ValidationException.class, () -> workOrderService.createWorkOrder(req));
    }

    @Test
    @DisplayName("createWorkOrder should fail for SC_REPAIR manual creation")
    void testCreateWorkOrderScRepairManualBlocked() {
        claim.setRepairType("SC_REPAIR");
        when(claimRepository.findById(1)).thenReturn(Optional.of(claim));
        WorkOrderCreateRequestDTO req = WorkOrderCreateRequestDTO.builder().claimId(1).technicianId(100).build();
        assertThrows(ValidationException.class, () -> workOrderService.createWorkOrder(req));
    }

    @Test
    @DisplayName("updateWorkOrder to DONE sets endTime and triggers claim status update")
    void testUpdateWorkOrderToDoneTriggersStatus() {
        // Prepare existing work order
        WorkOrder wo = WorkOrder.builder().id(50).claim(claim).status("OPEN").build();
        when(workOrderRepository.findById(50)).thenReturn(Optional.of(wo));
        when(workOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ClaimStatus handoverPending = ClaimStatus.builder().id(77).code("HANDOVER_PENDING").label("Handover Pending").build();
        when(claimStatusRepository.findByCode("HANDOVER_PENDING")).thenReturn(Optional.of(handoverPending));

        when(workOrderMapper.toResponseDTO(any())).thenReturn(WorkOrderResponseDTO.builder().id(50).status("DONE").build());
        when(workOrderPartRepository.findByWorkOrderId(50)).thenReturn(Collections.emptyList());

        WorkOrderUpdateRequestDTO update = WorkOrderUpdateRequestDTO.builder().status("DONE").build();
        WorkOrderResponseDTO resp = workOrderService.updateWorkOrder(50, update);

        assertEquals("DONE", resp.getStatus());
        assertNotNull(wo.getEndTime(), "End time should be auto set when marking DONE");
        verify(claimStatusRepository).findByCode("HANDOVER_PENDING");
        verify(claimRepository).save(any());
    }

    @Test
    @DisplayName("assignTechnician validates role and increments workload")
    void testAssignTechnician() {
        WorkOrder wo = WorkOrder.builder().id(60).status("OPEN").build();
        when(workOrderRepository.findById(60)).thenReturn(Optional.of(wo));
        when(userRepository.findById(100)).thenReturn(Optional.of(technician));
        when(technicianProfileService.canAssignWork(eq(100), any())).thenReturn(true);
        when(workOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(workOrderMapper.toResponseDTO(any())).thenReturn(WorkOrderResponseDTO.builder().id(60).build());

        WorkOrderResponseDTO dto = workOrderService.assignTechnician(60, 100);
        assertEquals(60, dto.getId());
        assertEquals(technician, wo.getTechnician());
        verify(technicianProfileService).incrementWorkload(100);
    }

    @Test
    @DisplayName("completeWorkOrderWithStats sets DONE, labor hours and updates technician stats")
    void testCompleteWorkOrderWithStats() {
        WorkOrder wo = WorkOrder.builder().id(70).status("OPEN").laborHours(BigDecimal.ZERO).technician(technician).claim(claim).build();
        when(workOrderRepository.findById(70)).thenReturn(Optional.of(wo));
        when(workOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(workOrderMapper.toResponseDTO(any())).thenReturn(WorkOrderResponseDTO.builder().id(70).status("DONE").laborHours(BigDecimal.valueOf(3)).build());
        when(workOrderPartRepository.findByWorkOrderId(70)).thenReturn(Collections.emptyList());
        when(claimStatusRepository.findByCode("HANDOVER_PENDING")).thenReturn(Optional.of(ClaimStatus.builder().id(31).code("HANDOVER_PENDING").build()));

        WorkOrderResponseDTO dto = workOrderService.completeWorkOrderWithStats(70, "OK", BigDecimal.valueOf(3));
        assertEquals("DONE", dto.getStatus());
        assertEquals(BigDecimal.valueOf(3), wo.getLaborHours());
        verify(technicianProfileService).decrementWorkload(technician.getId());
        verify(technicianProfileService).updateWorkOrderCompletion(technician.getId(), BigDecimal.valueOf(3));
    }

    @Test
    @DisplayName("addPartToWorkOrder adds EVM warehouse part serial")
    void testAddPartToWorkOrderEvm() {
        WorkOrder wo = WorkOrder.builder().id(80).status("OPEN").build();
        Part part = Part.builder().id(200).name("Battery").build();
        PartSerial serial = PartSerial.builder().id(300).serialNumber("SN300").part(part).status("in_stock").build();
        when(workOrderRepository.findById(80)).thenReturn(Optional.of(wo));
        when(partSerialRepository.findById(300)).thenReturn(Optional.of(serial));
        when(workOrderPartRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(workOrderPartRepository.findByWorkOrderId(80)).thenReturn(List.of(WorkOrderPart.builder().id(400).workOrder(wo).part(part).partSerial(serial).partSource("EVM_WAREHOUSE").quantity(1).build()));
        when(workOrderMapper.toResponseDTO(any())).thenReturn(WorkOrderResponseDTO.builder().id(80).build());
        when(workOrderMapper.toPartDTO(any())).thenAnswer(inv -> {
            WorkOrderPart wop = inv.getArgument(0);
            return WorkOrderPartDTO.builder().id(wop.getId()).partSerialId(wop.getPartSerial().getId()).quantity(wop.getQuantity()).partSource(wop.getPartSource()).build();
        });

        WorkOrderPartDTO addDto = WorkOrderPartDTO.builder().partSerialId(300).partSource("EVM_WAREHOUSE").quantity(1).build();
        WorkOrderResponseDTO resp = workOrderService.addPartToWorkOrder(80, addDto);
        assertEquals(80, resp.getId());
        verify(workOrderPartRepository).save(any());
    }

    @Test
    @DisplayName("startWorkOrder sets start time and updates claim status to REPAIR_IN_PROGRESS")
    void testStartWorkOrder() {
        ClaimStatus open = ClaimStatus.builder().id(90).code("OPEN").build();
        claim.setStatus(open);
        WorkOrder wo = WorkOrder.builder().id(81).claim(claim).technician(technician).status("OPEN").build();
        when(workOrderRepository.findById(81)).thenReturn(Optional.of(wo));
        when(workOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        ClaimStatus inProgress = ClaimStatus.builder().id(91).code("REPAIR_IN_PROGRESS").build();
        when(claimStatusRepository.findByCode("REPAIR_IN_PROGRESS")).thenReturn(Optional.of(inProgress));
        when(workOrderMapper.toResponseDTO(any())).thenReturn(WorkOrderResponseDTO.builder().id(81).status("OPEN").build());

        WorkOrderResponseDTO dto = workOrderService.startWorkOrder(81);
        assertNotNull(wo.getStartTime());
        assertEquals("REPAIR_IN_PROGRESS", claim.getStatus().getCode());
        assertEquals(81, dto.getId());
    }

    @Test
    @DisplayName("canTechnicianTakeNewWorkOrder delegates to technicianProfileService")
    void testCanTechnicianTakeNewWorkOrder() {
        when(technicianProfileService.canAssignWork(100)).thenReturn(true);
        assertTrue(workOrderService.canTechnicianTakeNewWorkOrder(100, 5));
    }

    @Test
    @DisplayName("createWorkOrder throws when technician not found")
    void testCreateWorkOrderTechnicianNotFound() {
        when(claimRepository.findById(1)).thenReturn(Optional.of(claim));
        when(userRepository.findById(100)).thenReturn(Optional.empty());
        WorkOrderCreateRequestDTO req = WorkOrderCreateRequestDTO.builder().claimId(1).technicianId(100).build();
        assertThrows(NotFoundException.class, () -> workOrderService.createWorkOrder(req));
    }

    @Test
    @DisplayName("assignTechnician throws when technician inactive")
    void testAssignTechnicianInactive() {
        WorkOrder wo = WorkOrder.builder().id(82).status("OPEN").build();
        User inactiveTech = User.builder().id(101).username("tech2")
                .role(Role.builder().roleName("SC_TECHNICIAN").build()).active(false).build();
        when(workOrderRepository.findById(82)).thenReturn(Optional.of(wo));
        when(userRepository.findById(101)).thenReturn(Optional.of(inactiveTech));
        assertThrows(ValidationException.class, () -> workOrderService.assignTechnician(82, 101));
    }
}
