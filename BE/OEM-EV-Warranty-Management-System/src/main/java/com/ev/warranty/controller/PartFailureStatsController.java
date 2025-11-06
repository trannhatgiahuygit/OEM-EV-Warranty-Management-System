package com.ev.warranty.controller;

import com.ev.warranty.model.dto.part.PartFailureStatsRequestDTO;
import com.ev.warranty.model.dto.part.PartFailureStatsResponseDTO;
import com.ev.warranty.service.inter.PartFailureStatsService;
import com.ev.warranty.security.JwtUtil;  // ✅ Đổi từ util sang security
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/evm/parts")
@RequiredArgsConstructor
@Slf4j
public class PartFailureStatsController {

    private final PartFailureStatsService partFailureStatsService;
    private final JwtUtil jwtUtil;

    /**
     * Generate comprehensive part failure statistics report
     */
    @PostMapping("/failure-statistics/generate")
    @PreAuthorize("hasAnyRole('EVM_STAFF', 'ADMIN')")
    public ResponseEntity<PartFailureStatsResponseDTO> generatePartFailureStats(
            @Valid @RequestBody PartFailureStatsRequestDTO request,
            HttpServletRequest httpRequest) {

        try {
            // ✅ Sử dụng methods có sẵn trong JwtUtil của bạn
            String token = jwtUtil.getTokenFromRequest(httpRequest);
            String username = jwtUtil.getUsernameFromToken(token);

            log.info("EVM: Generating part failure statistics for period {} to {} by user {}",
                    request.getStartDate(), request.getEndDate(), username);

            PartFailureStatsResponseDTO response = partFailureStatsService
                    .generatePartFailureStats(request, username);

            log.info("EVM: Generated part failure statistics report {} with {} total failures",
                    response.getReportId(), response.getExecutiveSummary().getTotalFailures());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error generating part failure statistics: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get quick part failure summary
     */
    @GetMapping("/failure-statistics/quick-summary")
    @PreAuthorize("hasAnyRole('EVM_STAFF', 'ADMIN')")
    public ResponseEntity<PartFailureStatsResponseDTO.ExecutiveSummaryDTO> getQuickFailureStats(
            @RequestParam String startDate,
            @RequestParam String endDate,
            HttpServletRequest httpRequest) {

        try {
            // ✅ Sử dụng methods có sẵn trong JwtUtil của bạn
            String token = jwtUtil.getTokenFromRequest(httpRequest);
            String username = jwtUtil.getUsernameFromToken(token);

            log.info("EVM: Getting quick failure stats for period {} to {} by user {}",
                    startDate, endDate, username);

            PartFailureStatsResponseDTO.ExecutiveSummaryDTO response =
                    partFailureStatsService.getQuickFailureStats(startDate, endDate);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting quick failure stats: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get part failure stats (simplified endpoint as in Postman)
     */
    @GetMapping("/failure-stats")
    @PreAuthorize("hasAnyRole('EVM_STAFF', 'ADMIN')")
    public ResponseEntity<PartFailureStatsResponseDTO.ExecutiveSummaryDTO> getFailureStats(
            @RequestParam String startDate,
            @RequestParam String endDate,
            HttpServletRequest httpRequest) {
        
        // This endpoint redirects to quick-summary for simplicity
        return getQuickFailureStats(startDate, endDate, httpRequest);
    }

    /**
     * Export part failure statistics to CSV
     */
    @PostMapping("/failure-statistics/export-csv")
    @PreAuthorize("hasAnyRole('EVM_STAFF', 'ADMIN')")
    public ResponseEntity<byte[]> exportFailureStatsCsv(
            @Valid @RequestBody PartFailureStatsRequestDTO request,
            HttpServletRequest httpRequest) {
        try {
            String token = jwtUtil.getTokenFromRequest(httpRequest);
            String username = jwtUtil.getUsernameFromToken(token);

            log.info("EVM: Exporting failure stats CSV for {} to {} by {}",
                    request.getStartDate(), request.getEndDate(), username);

            PartFailureStatsResponseDTO report = partFailureStatsService
                    .generatePartFailureStats(request, username);

            var summary = report.getExecutiveSummary();
            StringBuilder csv = new StringBuilder();
            csv.append("Report ID,Start Date,End Date,Total Failures,Unique Parts,Total Vehicles,Total Cost,Avg Cost per Failure,Overall Failure Rate,Risk Trend\n");
            csv.append(report.getReportId()).append(',')
                    .append(request.getStartDate()).append(',')
                    .append(request.getEndDate()).append(',')
                    .append(summary.getTotalFailures()).append(',')
                    .append(summary.getUniquePartsAffected()).append(',')
                    .append(summary.getTotalVehiclesAffected()).append(',')
                    .append(summary.getTotalFailureCost()).append(',')
                    .append(summary.getAverageCostPerFailure()).append(',')
                    .append(summary.getOverallFailureRate()).append(',')
                    .append(summary.getRiskTrend())
                    .append("\n");

            byte[] bytes = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
            String filename = "part-failure-stats-" + report.getReportId() + ".csv";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(bytes);
        } catch (Exception e) {
            log.error("Error exporting failure stats CSV: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}