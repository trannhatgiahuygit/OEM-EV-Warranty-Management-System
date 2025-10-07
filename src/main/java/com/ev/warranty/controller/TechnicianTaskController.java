package com.ev.warranty.controller;

import com.ev.warranty.model.dto.TechnicianTaskDto;
import com.ev.warranty.service.TechnicianTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technician/tasks")
@RequiredArgsConstructor
@Tag(name = "Technician Task Management", description = "APIs for managing technician tasks")
public class TechnicianTaskController {

    private final TechnicianTaskService technicianTaskService;

    @PostMapping("/assign")
    @Operation(summary = "Assign task to technician", description = "SC Staff assigns a new task to a technician")
    public ResponseEntity<TechnicianTaskDto> assignTask(
            @RequestBody TechnicianTaskDto taskDto,
            @Parameter(description = "ID of the SC Staff assigning the task")
            @RequestParam Integer assignedById) {
        TechnicianTaskDto createdTask = technicianTaskService.assignTask(taskDto, assignedById);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);
    }

    @PutMapping("/{taskId}/status")
    @Operation(summary = "Update task status", description = "Technician updates the status of their assigned task")
    public ResponseEntity<TechnicianTaskDto> updateTaskStatus(
            @PathVariable Integer taskId,
            @RequestParam String status,
            @RequestParam(required = false) String notes) {
        TechnicianTaskDto updatedTask = technicianTaskService.updateTaskStatus(taskId, status, notes);
        return ResponseEntity.ok(updatedTask);
    }

    @PutMapping("/{taskId}/hours")
    @Operation(summary = "Update actual hours worked", description = "Technician updates actual hours spent on the task")
    public ResponseEntity<TechnicianTaskDto> updateActualHours(
            @PathVariable Integer taskId,
            @RequestParam Double actualHours) {
        TechnicianTaskDto updatedTask = technicianTaskService.updateActualHours(taskId, actualHours);
        return ResponseEntity.ok(updatedTask);
    }

    @GetMapping("/technician/{technicianId}")
    @Operation(summary = "Get all tasks for technician", description = "Get all tasks assigned to a specific technician")
    public ResponseEntity<List<TechnicianTaskDto>> getTasksByTechnician(
            @PathVariable Integer technicianId) {
        List<TechnicianTaskDto> tasks = technicianTaskService.getTasksByTechnician(technicianId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/technician/{technicianId}/status/{status}")
    @Operation(summary = "Get tasks by status", description = "Get tasks for technician filtered by status")
    public ResponseEntity<List<TechnicianTaskDto>> getTasksByStatus(
            @PathVariable Integer technicianId,
            @PathVariable String status) {
        List<TechnicianTaskDto> tasks = technicianTaskService.getTasksByStatus(technicianId, status);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/technician/{technicianId}/overdue")
    @Operation(summary = "Get overdue tasks", description = "Get overdue tasks for a technician")
    public ResponseEntity<List<TechnicianTaskDto>> getOverdueTasks(
            @PathVariable Integer technicianId) {
        List<TechnicianTaskDto> tasks = technicianTaskService.getOverdueTasks(technicianId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/claim/{claimId}")
    @Operation(summary = "Get tasks by claim", description = "Get all tasks related to a specific claim")
    public ResponseEntity<List<TechnicianTaskDto>> getTasksByClaim(
            @PathVariable Integer claimId) {
        List<TechnicianTaskDto> tasks = technicianTaskService.getTasksByClaim(claimId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/technician/{technicianId}/count/{status}")
    @Operation(summary = "Get task count by status", description = "Get count of tasks for technician by status")
    public ResponseEntity<Long> getTaskCountByStatus(
            @PathVariable Integer technicianId,
            @PathVariable String status) {
        Long count = technicianTaskService.getTaskCountByStatus(technicianId, status);
        return ResponseEntity.ok(count);
    }
}
