package com.ev.warranty.controller;

import com.ev.warranty.model.dto.technician.TechnicianPerformanceDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/technicians")
@RequiredArgsConstructor
public class TechnicianController {

    @GetMapping("/{id}/performance")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<TechnicianPerformanceDto> getPerformance(
            @PathVariable Integer id,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        // Mock response for now
        TechnicianPerformanceDto performance = new TechnicianPerformanceDto();
        performance.setTechnicianId(id);
        performance.setTechnicianName("Sample Technician");
        performance.setTotalClaims(10);
        performance.setCompletedClaims(8);

        return ResponseEntity.ok(performance);
    }
}