package com.ev.warranty.controller;

import com.ev.warranty.model.dto.RepairProgressDto;
import com.ev.warranty.service.RepairProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/technician/repair-progress")
@RequiredArgsConstructor
@Tag(name = "Repair Progress Management", description = "APIs for managing repair progress by technicians")
public class RepairProgressController {

    private final RepairProgressService repairProgressService;

    @PostMapping
    @Operation(summary = "Create repair progress", description = "Technician creates a new repair progress entry")
    public ResponseEntity<RepairProgressDto> createRepairProgress(
            @RequestBody RepairProgressDto progressDto) {
        RepairProgressDto createdProgress = repairProgressService.createRepairProgress(progressDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProgress);
    }

    @PostMapping("/start-step")
    @Operation(summary = "Start progress step", description = "Technician starts a new progress step for a claim")
    public ResponseEntity<RepairProgressDto> startProgressStep(
            @RequestParam Integer claimId,
            @RequestParam String progressStep,
            @RequestParam Integer technicianId,
            @RequestParam String description) {
        RepairProgressDto progress = repairProgressService.startProgressStep(claimId, progressStep, technicianId, description);
        return ResponseEntity.status(HttpStatus.CREATED).body(progress);
    }

    @PutMapping("/{progressId}")
    @Operation(summary = "Update repair progress", description = "Technician updates an existing repair progress entry")
    public ResponseEntity<RepairProgressDto> updateRepairProgress(
            @PathVariable Integer progressId,
            @RequestBody RepairProgressDto progressDto) {
        RepairProgressDto updatedProgress = repairProgressService.updateRepairProgress(progressId, progressDto);
        return ResponseEntity.ok(updatedProgress);
    }

    @PutMapping("/{progressId}/complete")
    @Operation(summary = "Complete progress step", description = "Technician marks a progress step as completed")
    public ResponseEntity<RepairProgressDto> completeProgressStep(
            @PathVariable Integer progressId,
            @Parameter(description = "Completion notes")
            @RequestParam String completionNotes) {
        RepairProgressDto completedProgress = repairProgressService.completeProgressStep(progressId, completionNotes);
        return ResponseEntity.ok(completedProgress);
    }

    @GetMapping("/claim/{claimId}")
    @Operation(summary = "Get progress by claim", description = "Get all repair progress entries for a specific claim")
    public ResponseEntity<List<RepairProgressDto>> getProgressByClaim(
            @PathVariable Integer claimId) {
        List<RepairProgressDto> progressList = repairProgressService.getProgressByClaim(claimId);
        return ResponseEntity.ok(progressList);
    }

    @GetMapping("/technician/{technicianId}")
    @Operation(summary = "Get progress by technician", description = "Get all repair progress entries by a technician")
    public ResponseEntity<List<RepairProgressDto>> getProgressByTechnician(
            @PathVariable Integer technicianId) {
        List<RepairProgressDto> progressList = repairProgressService.getProgressByTechnician(technicianId);
        return ResponseEntity.ok(progressList);
    }

    @GetMapping("/technician/{technicianId}/status/{status}")
    @Operation(summary = "Get progress by status", description = "Get repair progress entries filtered by status")
    public ResponseEntity<List<RepairProgressDto>> getProgressByStatus(
            @PathVariable Integer technicianId,
            @PathVariable String status) {
        List<RepairProgressDto> progressList = repairProgressService.getProgressByStatus(technicianId, status);
        return ResponseEntity.ok(progressList);
    }

    @GetMapping("/claim/{claimId}/latest")
    @Operation(summary = "Get latest progress", description = "Get the latest repair progress for a claim")
    public ResponseEntity<RepairProgressDto> getLatestProgress(
            @PathVariable Integer claimId) {
        RepairProgressDto latestProgress = repairProgressService.getLatestProgress(claimId);
        return ResponseEntity.ok(latestProgress);
    }

    @GetMapping("/technician/{technicianId}/hours-worked")
    @Operation(summary = "Get total hours worked", description = "Get total hours worked by technician in date range")
    public ResponseEntity<Double> getTotalHoursWorked(
            @PathVariable Integer technicianId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Double totalHours = repairProgressService.getTotalHoursWorked(technicianId, startDate, endDate);
        return ResponseEntity.ok(totalHours);
    }

    @GetMapping("/claim/{claimId}/completed-steps")
    @Operation(summary = "Get completed steps count", description = "Get count of completed steps for a claim")
    public ResponseEntity<Long> getCompletedStepsCount(
            @PathVariable Integer claimId) {
        Long count = repairProgressService.getCompletedStepsCount(claimId);
        return ResponseEntity.ok(count);
    }
}
