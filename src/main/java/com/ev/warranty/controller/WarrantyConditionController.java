package com.ev.warranty.controller;

import com.ev.warranty.model.dto.policy.WarrantyConditionDTO;
import com.ev.warranty.service.inter.WarrantyConditionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/warranty-conditions")
@RequiredArgsConstructor
@Tag(name = "Warranty Conditions", description = "Manage warranty coverage conditions by vehicle model")
public class WarrantyConditionController {

    private final WarrantyConditionService service;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Create warranty condition",
               description = "Create a new warranty condition record tied to a VehicleModel. Requires EVM_STAFF or ADMIN.",
               responses = {@ApiResponse(responseCode = "201", description = "Created",
                   content = @Content(schema = @Schema(implementation = WarrantyConditionDTO.class)))})
    public ResponseEntity<WarrantyConditionDTO> create(
            @Valid @RequestBody WarrantyConditionDTO dto,
            Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Update warranty condition",
               description = "Update an existing condition by id. Provide the same vehicleModelId or a new one if reassigning.")
    public ResponseEntity<WarrantyConditionDTO> update(
            @PathVariable Integer id,
            @Valid @RequestBody WarrantyConditionDTO dto,
            Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.update(id, dto, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Delete warranty condition",
               description = "Delete a condition by id. Consider toggling 'active' to false instead in production.")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "List warranty conditions by model",
               description = "List all warranty conditions tied to a model id.")
    public ResponseEntity<List<WarrantyConditionDTO>> listByModel(
            @Parameter(description = "Vehicle model id") @RequestParam Integer modelId) {
        return ResponseEntity.ok(service.listByModel(modelId));
    }

    @GetMapping("/effective")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "List effective warranty conditions",
               description = "List conditions effective today for a given model id.")
    public ResponseEntity<List<WarrantyConditionDTO>> listEffectiveByModel(
            @Parameter(description = "Vehicle model id") @RequestParam Integer modelId) {
        return ResponseEntity.ok(service.listEffectiveByModel(modelId, LocalDate.now()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_EVM_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Get condition by id",
               description = "Fetch a single warranty condition by id.")
    public ResponseEntity<WarrantyConditionDTO> get(@PathVariable Integer id) {
        return ResponseEntity.ok(service.get(id));
    }
}
