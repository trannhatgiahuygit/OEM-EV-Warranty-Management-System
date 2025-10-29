package com.ev.warranty.controller;

import com.ev.warranty.model.dto.workorder.*;
import com.ev.warranty.service.inter.WorkOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/work-orders")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Work Orders", description = "APIs for managing work orders and repair processes")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Create new work order",
            description = "Create a work order from an approved claim. Automatically checks technician availability.")
    public ResponseEntity<WorkOrderResponseDTO> createWorkOrder(
            @Valid @RequestBody WorkOrderCreateRequestDTO request) {
        WorkOrderResponseDTO response = workOrderService.createWorkOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Get work order details", description = "Retrieve detailed information about a work order")
    public ResponseEntity<WorkOrderResponseDTO> getWorkOrderById(
            @Parameter(description = "Work Order ID") @PathVariable Integer id) {
        WorkOrderResponseDTO response = workOrderService.getWorkOrderById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/update")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Update work order", description = "Update work order progress and details")
    public ResponseEntity<WorkOrderResponseDTO> updateWorkOrder(
            @Parameter(description = "Work Order ID") @PathVariable Integer id,
            @Valid @RequestBody WorkOrderUpdateRequestDTO request) {
        WorkOrderResponseDTO response = workOrderService.updateWorkOrder(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Complete work order",
            description = "Mark work order as completed. Automatically updates technician workload.")
    public ResponseEntity<WorkOrderResponseDTO> completeWorkOrder(
            @Parameter(description = "Work Order ID") @PathVariable Integer id) {
        WorkOrderResponseDTO response = workOrderService.completeWorkOrder(id);
        return ResponseEntity.ok(response);
    }

    // ✅ NEW: Complete with statistics
    @PutMapping("/{id}/complete-with-stats")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Complete work order with labor hours",
            description = "Complete work order and update technician statistics")
    public ResponseEntity<WorkOrderResponseDTO> completeWorkOrderWithStats(
            @Parameter(description = "Work Order ID") @PathVariable Integer id,
            @RequestParam String result,
            @RequestParam BigDecimal laborHours) {
        WorkOrderResponseDTO response = workOrderService.completeWorkOrderWithStats(id, result, laborHours);
        return ResponseEntity.ok(response);
    }

    // ✅ NEW: Start work order
    @PutMapping("/{id}/start")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_TECHNICIAN', 'ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Start work order", description = "Change work order status to IN_PROGRESS")
    public ResponseEntity<WorkOrderResponseDTO> startWorkOrder(
            @Parameter(description = "Work Order ID") @PathVariable Integer id) {
        WorkOrderResponseDTO response = workOrderService.startWorkOrder(id);
        return ResponseEntity.ok(response);
    }

    // ✅ NEW: Cancel work order
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Cancel work order",
            description = "Cancel work order and free up technician's workload")
    public ResponseEntity<WorkOrderResponseDTO> cancelWorkOrder(
            @Parameter(description = "Work Order ID") @PathVariable Integer id,
            @RequestParam String reason) {
        WorkOrderResponseDTO response = workOrderService.cancelWorkOrder(id, reason);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/claim/{claimId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Get work orders by claim", description = "Retrieve all work orders for a specific claim")
    public ResponseEntity<List<WorkOrderResponseDTO>> getWorkOrdersByClaimId(
            @Parameter(description = "Claim ID") @PathVariable Integer claimId) {
        List<WorkOrderResponseDTO> response = workOrderService.getWorkOrdersByClaimId(claimId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/technician/{technicianId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_TECHNICIAN', 'ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get work orders by technician", description = "Retrieve all work orders assigned to a technician")
    public ResponseEntity<List<WorkOrderResponseDTO>> getWorkOrdersByTechnicianId(
            @Parameter(description = "Technician ID") @PathVariable Integer technicianId) {
        List<WorkOrderResponseDTO> response = workOrderService.getWorkOrdersByTechnicianId(technicianId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get all work orders", description = "Retrieve paginated list of all work orders")
    public ResponseEntity<Page<WorkOrderResponseDTO>> getAllWorkOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("DESC") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<WorkOrderResponseDTO> response = workOrderService.getAllWorkOrders(pageable);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/add-part")
    @PreAuthorize("hasAuthority('ROLE_SC_TECHNICIAN') or hasAuthority('ROLE_SC_STAFF')")
    @Operation(summary = "Add part to work order", description = "Add a part that was used in the repair")
    public ResponseEntity<WorkOrderResponseDTO> addPartToWorkOrder(
            @Parameter(description = "Work Order ID") @PathVariable Integer id,
            @Valid @RequestBody WorkOrderPartDTO partDTO) {
        WorkOrderResponseDTO response = workOrderService.addPartToWorkOrder(id, partDTO);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{workOrderId}/parts/{partId}")
    @PreAuthorize("hasAuthority('ROLE_SC_TECHNICIAN') or hasAuthority('ROLE_SC_STAFF')")
    @Operation(summary = "Remove part from work order", description = "Remove a part from the work order")
    public ResponseEntity<Void> removePartFromWorkOrder(
            @Parameter(description = "Work Order ID") @PathVariable Integer workOrderId,
            @Parameter(description = "Part ID") @PathVariable Integer partId) {
        workOrderService.removePartFromWorkOrder(workOrderId, partId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/parts")
    @PreAuthorize("hasAuthority('ROLE_SC_STAFF') or hasAuthority('ROLE_SC_TECHNICIAN')")
    @Operation(summary = "Get work order parts", description = "Retrieve all parts used in a work order")
    public ResponseEntity<List<WorkOrderPartDTO>> getWorkOrderParts(
            @Parameter(description = "Work Order ID") @PathVariable Integer id) {
        List<WorkOrderPartDTO> response = workOrderService.getWorkOrderParts(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/technician/{technicianId}/can-take-new")
    @PreAuthorize("hasAuthority('ROLE_SC_STAFF') or hasAuthority('ROLE_SC_TECHNICIAN')")
    @Operation(summary = "Check if technician can take new work order",
            description = "Check if technician has capacity for additional work orders (uses TechnicianProfile)")
    public ResponseEntity<Boolean> canTechnicianTakeNewWorkOrder(
            @Parameter(description = "Technician ID") @PathVariable Integer technicianId,
            @RequestParam(defaultValue = "5") int maxActiveWorkOrders) {
        boolean canTake = workOrderService.canTechnicianTakeNewWorkOrder(technicianId, maxActiveWorkOrders);
        return ResponseEntity.ok(canTake);
    }

    // ✅ UPDATED: Use service method for assignment
    @PutMapping("/{id}/assign-technician")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Assign technician to work order",
            description = "Assign or change technician for a work order. Automatically checks availability and updates workload.")
    public ResponseEntity<WorkOrderResponseDTO> assignTechnician(
            @PathVariable Integer id,
            @Valid @RequestBody WorkOrderAssignTechnicianRequestDTO request) {
        WorkOrderResponseDTO response = workOrderService.assignTechnician(id, request.getTechnicianId());
        return ResponseEntity.ok(response);
    }

    // ✅ NEW: Reassign technician
    @PutMapping("/{id}/reassign-technician")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Reassign work order to different technician",
            description = "Move work order to a different technician. Updates both technicians' workload.")
    public ResponseEntity<WorkOrderResponseDTO> reassignTechnician(
            @PathVariable Integer id,
            @Valid @RequestBody WorkOrderAssignTechnicianRequestDTO request) {
        WorkOrderResponseDTO response = workOrderService.reassignTechnician(id, request.getTechnicianId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/technician/{id}/workload")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_ADMIN')")
    @Operation(summary = "Get technician workload",
            description = "Get current workload and capacity for a technician (integrates with TechnicianProfile)")
    public ResponseEntity<WorkOrderWorkloadDTO> getTechnicianWorkload(
            @Parameter(description = "Technician ID") @PathVariable Integer id) {
        log.info("Getting workload for technician ID: {}", id);

        WorkOrderWorkloadDTO workload = workOrderService.getTechnicianWorkload(id);

        log.info("Retrieved workload for technician ID: {}", id);
        return ResponseEntity.ok(workload);
    }
}