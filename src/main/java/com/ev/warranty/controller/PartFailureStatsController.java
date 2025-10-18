package com.ev.warranty.controller;

import com.ev.warranty.model.dto.part.PartFailureStatsRequestDTO;
import com.ev.warranty.model.dto.part.PartFailureStatsResponseDTO;
import com.ev.warranty.service.inter.PartFailureStatsService;
import com.ev.warranty.security.JwtUtil;  // ✅ Đổi từ util sang security
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
}