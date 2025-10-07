package com.ev.warranty.controller;

import com.ev.warranty.model.dto.TechnicianTaskDto;
import com.ev.warranty.model.dto.DiagnosticReportDto;
import com.ev.warranty.model.dto.RepairProgressDto;
import com.ev.warranty.service.TechnicianTaskService;
import com.ev.warranty.service.DiagnosticReportService;
import com.ev.warranty.service.RepairProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/technician")
@RequiredArgsConstructor
@Tag(name = "SC Technician Dashboard", description = "APIs for SC Technician dashboard and summary functions")
public class TechnicianDashboardController {

    private final TechnicianTaskService technicianTaskService;
    private final DiagnosticReportService diagnosticReportService;
    private final RepairProgressService repairProgressService;

    @GetMapping("/{technicianId}/dashboard")
    @Operation(summary = "Get technician dashboard", description = "Get dashboard summary for a technician including tasks, reports, and performance metrics")
    public ResponseEntity<Map<String, Object>> getTechnicianDashboard(
            @PathVariable Integer technicianId) {

        Map<String, Object> dashboard = new HashMap<>();

        // Task statistics
        Long assignedTasks = technicianTaskService.getTaskCountByStatus(technicianId, "ASSIGNED");
        Long inProgressTasks = technicianTaskService.getTaskCountByStatus(technicianId, "IN_PROGRESS");
        Long completedTasks = technicianTaskService.getTaskCountByStatus(technicianId, "COMPLETED");
        List<TechnicianTaskDto> overdueTasks = technicianTaskService.getOverdueTasks(technicianId);

        Map<String, Object> taskStats = new HashMap<>();
        taskStats.put("assigned", assignedTasks);
        taskStats.put("inProgress", inProgressTasks);
        taskStats.put("completed", completedTasks);
        taskStats.put("overdue", overdueTasks.size());
        taskStats.put("overdueDetails", overdueTasks);

        dashboard.put("taskStatistics", taskStats);

        // Recent tasks
        List<TechnicianTaskDto> recentTasks = technicianTaskService.getTasksByTechnician(technicianId);
        dashboard.put("recentTasks", recentTasks.stream().limit(5).toList());

        // Recent diagnostic reports
        List<DiagnosticReportDto> recentReports = diagnosticReportService.getReportsByTechnician(technicianId);
        dashboard.put("recentReports", recentReports.stream().limit(5).toList());

        // Recent repair progress
        List<RepairProgressDto> recentProgress = repairProgressService.getProgressByTechnician(technicianId);
        dashboard.put("recentProgress", recentProgress.stream().limit(5).toList());

        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/{technicianId}/workload")
    @Operation(summary = "Get technician workload", description = "Get current workload and performance metrics for a technician")
    public ResponseEntity<Map<String, Object>> getTechnicianWorkload(
            @PathVariable Integer technicianId,
            @RequestParam(defaultValue = "7") Integer days) {

        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(days);

        Map<String, Object> workload = new HashMap<>();

        // Hours worked in the period
        Double totalHours = repairProgressService.getTotalHoursWorked(technicianId, startDate, endDate);
        workload.put("totalHoursWorked", totalHours);
        workload.put("averageHoursPerDay", totalHours / days);

        // Active tasks
        List<TechnicianTaskDto> activeTasks = technicianTaskService.getTasksByStatus(technicianId, "IN_PROGRESS");
        workload.put("activeTasks", activeTasks);
        workload.put("activeTaskCount", activeTasks.size());

        // Pending diagnoses
        List<DiagnosticReportDto> pendingReports = diagnosticReportService.getReportsByStatus(technicianId, "IN_PROGRESS");
        workload.put("pendingDiagnoses", pendingReports);
        workload.put("pendingDiagnosesCount", pendingReports.size());

        return ResponseEntity.ok(workload);
    }

    @GetMapping("/{technicianId}/performance")
    @Operation(summary = "Get technician performance", description = "Get performance metrics for a technician in a specific period")
    public ResponseEntity<Map<String, Object>> getTechnicianPerformance(
            @PathVariable Integer technicianId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        Map<String, Object> performance = new HashMap<>();

        // Task completion statistics
        Long completedTasksInPeriod = technicianTaskService.getTaskCountByStatus(technicianId, "COMPLETED");
        performance.put("completedTasks", completedTasksInPeriod);

        // Total hours worked
        Double totalHours = repairProgressService.getTotalHoursWorked(technicianId, startDate, endDate);
        performance.put("totalHours", totalHours);

        // Diagnostic reports completed
        Long completedReports = (long) diagnosticReportService.getReportsByStatus(technicianId, "COMPLETED").size();
        performance.put("completedReports", completedReports);

        // Calculate efficiency metrics
        if (completedTasksInPeriod > 0 && totalHours > 0) {
            performance.put("tasksPerHour", completedTasksInPeriod.doubleValue() / totalHours);
            performance.put("averageHoursPerTask", totalHours / completedTasksInPeriod.doubleValue());
        }

        return ResponseEntity.ok(performance);
    }

    @GetMapping("/{technicianId}/tasks/priority/{priority}")
    @Operation(summary = "Get tasks by priority", description = "Get tasks for technician filtered by priority level")
    public ResponseEntity<List<TechnicianTaskDto>> getTasksByPriority(
            @PathVariable Integer technicianId,
            @PathVariable String priority) {
        List<TechnicianTaskDto> tasks = technicianTaskService.getTasksByTechnician(technicianId)
                .stream()
                .filter(task -> priority.equalsIgnoreCase(task.getPriority()))
                .toList();
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/{technicianId}/claim/{claimId}/start-work")
    @Operation(summary = "Start work on claim", description = "Technician starts working on a specific claim")
    public ResponseEntity<Map<String, Object>> startWorkOnClaim(
            @PathVariable Integer technicianId,
            @PathVariable Integer claimId,
            @RequestParam String workDescription) {

        Map<String, Object> result = new HashMap<>();

        // Start a repair progress entry
        RepairProgressDto progress = repairProgressService.startProgressStep(
                claimId, "WORK_STARTED", technicianId, workDescription);

        // Update related tasks to in progress
        List<TechnicianTaskDto> claimTasks = technicianTaskService.getTasksByClaim(claimId);
        for (TechnicianTaskDto task : claimTasks) {
            if ("ASSIGNED".equals(task.getStatus())) {
                technicianTaskService.updateTaskStatus(task.getId(), "IN_PROGRESS", "Started working on claim");
            }
        }

        result.put("progress", progress);
        result.put("message", "Work started successfully on claim " + claimId);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/{technicianId}/claim/{claimId}/complete-work")
    @Operation(summary = "Complete work on claim", description = "Technician completes work on a specific claim")
    public ResponseEntity<Map<String, Object>> completeWorkOnClaim(
            @PathVariable Integer technicianId,
            @PathVariable Integer claimId,
            @RequestParam String completionNotes) {

        Map<String, Object> result = new HashMap<>();

        // Get latest progress and mark as completed
        RepairProgressDto latestProgress = repairProgressService.getLatestProgress(claimId);
        RepairProgressDto completedProgress = repairProgressService.completeProgressStep(
                latestProgress.getId(), completionNotes);

        // Complete related tasks
        List<TechnicianTaskDto> claimTasks = technicianTaskService.getTasksByClaim(claimId);
        for (TechnicianTaskDto task : claimTasks) {
            if ("IN_PROGRESS".equals(task.getStatus())) {
                technicianTaskService.updateTaskStatus(task.getId(), "COMPLETED", completionNotes);
            }
        }

        result.put("progress", completedProgress);
        result.put("message", "Work completed successfully on claim " + claimId);

        return ResponseEntity.ok(result);
    }
}
