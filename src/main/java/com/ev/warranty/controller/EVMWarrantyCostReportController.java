package com.ev.warranty.controller;

import com.ev.warranty.model.dto.cost.WarrantyCostReportRequestDTO;
import com.ev.warranty.model.dto.cost.WarrantyCostReportResponseDTO;
import com.ev.warranty.service.inter.EVMWarrantyCostReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/evm/reports/warranty-costs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "EVM Warranty Cost Reports", description = "EVM Staff APIs for warranty cost analysis and reporting")
public class EVMWarrantyCostReportController {

    private final EVMWarrantyCostReportService reportService;

    /**
     * Generate comprehensive warranty cost report
     * Available to: EVM_STAFF, ADMIN only
     * Current user trannhatgiahuygit (SC_STAFF) should get 403 Forbidden
     */
    @PostMapping("/generate")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Generate warranty cost report",
            description = "Generate comprehensive warranty cost analysis report with trends, breakdowns, and insights")
    public ResponseEntity<WarrantyCostReportResponseDTO> generateCostReport(
            @Valid @RequestBody WarrantyCostReportRequestDTO request,
            Authentication authentication) {

        String username = authentication.getName();
        log.info("EVM user {} generating warranty cost report for period {} to {}",
                username, request.getReportStartDate(), request.getReportEndDate());

        WarrantyCostReportResponseDTO report = reportService.generateCostReport(request, username);

        log.info("EVM user {} generated report {} with total cost: ${}",
                username, report.getReportId(), report.getExecutiveSummary().getTotalWarrantyCost());

        return ResponseEntity.ok(report);
    }

    /**
     * Generate quick summary report for dashboard
     * Available to: EVM_STAFF, ADMIN only
     */
    @GetMapping("/quick-summary")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Generate quick cost summary",
            description = "Generate quick warranty cost summary for specified date range")
    public ResponseEntity<WarrantyCostReportResponseDTO.ExecutiveSummaryDTO> getQuickSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {

        String username = authentication.getName();
        log.info("EVM user {} requesting quick summary for {} to {}", username, startDate, endDate);

        WarrantyCostReportResponseDTO.ExecutiveSummaryDTO summary = reportService.generateQuickSummary(startDate, endDate);

        log.info("EVM user {} retrieved quick summary: {} claims, ${} total cost",
                username, summary.getTotalClaims(), summary.getTotalWarrantyCost());

        return ResponseEntity.ok(summary);
    }

    /**
     * Export warranty cost report
     * Available to: EVM_STAFF, ADMIN only
     */
    @PostMapping("/export")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Export warranty cost report",
            description = "Export warranty cost report to CSV format")
    public ResponseEntity<byte[]> exportReport(
            @Valid @RequestBody WarrantyCostReportRequestDTO request,
            Authentication authentication) {
        String username = authentication.getName();
        log.info("EVM user {} exporting warranty cost report to CSV for period {} to {}",
                username, request.getReportStartDate(), request.getReportEndDate());

        WarrantyCostReportResponseDTO report = reportService.generateCostReport(request, username);
        var summary = report.getExecutiveSummary();

        StringBuilder csv = new StringBuilder();
        csv.append("Report ID,Start Date,End Date,Total Claims,Total Warranty Cost,Average Cost per Claim\n");
        csv.append(report.getReportId()).append(',')
                .append(request.getReportStartDate()).append(',')
                .append(request.getReportEndDate()).append(',')
                .append(summary.getTotalClaims()).append(',')
                .append(summary.getTotalWarrantyCost()).append(',')
                .append(summary.getAverageCostPerClaim())
                .append("\n");

        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
        String filename = "warranty-cost-report-" + report.getReportId() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}