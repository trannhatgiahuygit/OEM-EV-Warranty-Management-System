package com.ev.warranty.controller;

import com.ev.warranty.model.dto.DiagnosticReportDto;
import com.ev.warranty.service.DiagnosticReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technician/diagnostic-reports")
@RequiredArgsConstructor
@Tag(name = "Diagnostic Report Management", description = "APIs for managing diagnostic reports by technicians")
public class DiagnosticReportController {

    private final DiagnosticReportService diagnosticReportService;

    @PostMapping
    @Operation(summary = "Create diagnostic report", description = "Technician creates a new diagnostic report for a claim")
    public ResponseEntity<DiagnosticReportDto> createDiagnosticReport(
            @RequestBody DiagnosticReportDto reportDto) {
        DiagnosticReportDto createdReport = diagnosticReportService.createDiagnosticReport(reportDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdReport);
    }

    @PutMapping("/{reportId}")
    @Operation(summary = "Update diagnostic report", description = "Technician updates an existing diagnostic report")
    public ResponseEntity<DiagnosticReportDto> updateDiagnosticReport(
            @PathVariable Integer reportId,
            @RequestBody DiagnosticReportDto reportDto) {
        DiagnosticReportDto updatedReport = diagnosticReportService.updateDiagnosticReport(reportId, reportDto);
        return ResponseEntity.ok(updatedReport);
    }

    @PutMapping("/{reportId}/complete")
    @Operation(summary = "Complete diagnosis", description = "Technician completes the diagnosis with final results")
    public ResponseEntity<DiagnosticReportDto> completeDiagnosis(
            @PathVariable Integer reportId,
            @Parameter(description = "Final diagnosis results")
            @RequestParam String finalResults) {
        DiagnosticReportDto completedReport = diagnosticReportService.completeDiagnosis(reportId, finalResults);
        return ResponseEntity.ok(completedReport);
    }

    @GetMapping("/claim/{claimId}")
    @Operation(summary = "Get report by claim", description = "Get diagnostic report for a specific claim")
    public ResponseEntity<DiagnosticReportDto> getReportByClaim(
            @PathVariable Integer claimId) {
        DiagnosticReportDto report = diagnosticReportService.getReportByClaim(claimId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/technician/{technicianId}")
    @Operation(summary = "Get reports by technician", description = "Get all diagnostic reports created by a technician")
    public ResponseEntity<List<DiagnosticReportDto>> getReportsByTechnician(
            @PathVariable Integer technicianId) {
        List<DiagnosticReportDto> reports = diagnosticReportService.getReportsByTechnician(technicianId);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/vehicle/{vehicleId}")
    @Operation(summary = "Get reports by vehicle", description = "Get all diagnostic reports for a specific vehicle")
    public ResponseEntity<List<DiagnosticReportDto>> getReportsByVehicle(
            @PathVariable Integer vehicleId) {
        List<DiagnosticReportDto> reports = diagnosticReportService.getReportsByVehicle(vehicleId);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/technician/{technicianId}/status/{status}")
    @Operation(summary = "Get reports by status", description = "Get diagnostic reports filtered by status for a technician")
    public ResponseEntity<List<DiagnosticReportDto>> getReportsByStatus(
            @PathVariable Integer technicianId,
            @PathVariable String status) {
        List<DiagnosticReportDto> reports = diagnosticReportService.getReportsByStatus(technicianId, status);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/report-number/{reportNumber}")
    @Operation(summary = "Get report by number", description = "Get diagnostic report by report number")
    public ResponseEntity<DiagnosticReportDto> getReportByNumber(
            @PathVariable String reportNumber) {
        DiagnosticReportDto report = diagnosticReportService.getReportByNumber(reportNumber);
        return ResponseEntity.ok(report);
    }
}
