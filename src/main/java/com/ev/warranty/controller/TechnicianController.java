package com.ev.warranty.controller;

import com.ev.warranty.model.dto.technician.TechnicianPerformanceDto;
import com.ev.warranty.service.inter.TechnicianService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/technicians")
@RequiredArgsConstructor
public class TechnicianController {

    private final TechnicianService technicianService;

    @GetMapping("/{id}/performance")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<?> getPerformance(
            @PathVariable Integer id,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        TechnicianPerformanceDto performance = technicianService.getTechnicianPerformance(id, startDate, endDate);
        if (performance == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Technician not found or not active");
        }
        return ResponseEntity.ok(performance);
    }
}