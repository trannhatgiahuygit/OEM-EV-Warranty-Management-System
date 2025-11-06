package com.ev.warranty.controller;

import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartDTO;
import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartSerialDTO;
import com.ev.warranty.service.inter.ThirdPartyPartService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/third-party-parts")
@RequiredArgsConstructor
public class ThirdPartyPartController {

    private final ThirdPartyPartService service;

    @GetMapping("/service-center/{scId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "List third-party parts by service center")
    public ResponseEntity<List<ThirdPartyPartDTO>> getByServiceCenter(@PathVariable Integer scId) {
        return ResponseEntity.ok(service.getPartsByServiceCenter(scId));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Create third-party part")
    public ResponseEntity<ThirdPartyPartDTO> create(@RequestBody ThirdPartyPartDTO dto,
                                                    Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.createPart(dto, user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Update third-party part")
    public ResponseEntity<ThirdPartyPartDTO> update(@PathVariable Integer id,
                                                    @RequestBody ThirdPartyPartDTO dto,
                                                    Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.updatePart(id, dto, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_ADMIN')")
    @Operation(summary = "Delete third-party part")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.deletePart(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{partId}/serials")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Add serial to third-party part")
    public ResponseEntity<ThirdPartyPartSerialDTO> addSerial(@PathVariable Integer partId,
                                                             @RequestParam @NotBlank String serialNumber,
                                                             Authentication auth) {
        String user = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(service.addSerial(partId, serialNumber, user));
    }

    @GetMapping("/{partId}/serials/available")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF','ROLE_SC_TECHNICIAN','ROLE_ADMIN')")
    @Operation(summary = "Get available serials for third-party part")
    public ResponseEntity<List<ThirdPartyPartSerialDTO>> getAvailableSerials(@PathVariable Integer partId) {
        return ResponseEntity.ok(service.getAvailableSerials(partId));
    }
}
