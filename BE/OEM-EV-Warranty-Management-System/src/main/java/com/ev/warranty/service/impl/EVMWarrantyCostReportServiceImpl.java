package com.ev.warranty.service.impl;

import com.ev.warranty.mapper.EVMWarrantyCostReportMapper;
import com.ev.warranty.model.dto.cost.WarrantyCostReportRequestDTO;
import com.ev.warranty.model.dto.cost.WarrantyCostReportResponseDTO;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.service.inter.EVMWarrantyCostReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EVMWarrantyCostReportServiceImpl implements EVMWarrantyCostReportService {

    private final ClaimRepository claimRepository;
    private final EVMWarrantyCostReportMapper reportMapper;

    @Override
    public WarrantyCostReportResponseDTO generateCostReport(WarrantyCostReportRequestDTO request, String generatedBy) {
        log.info("EVM: Generating warranty cost report for period {} to {} by user {}",
                request.getReportStartDate(), request.getReportEndDate(), generatedBy);

        // Get filtered claims data for the period
        List<Claim> periodClaims = getClaimsForPeriod(request);

        // Get previous period claims if comparison requested
        List<Claim> previousPeriodClaims = null;
        if (Boolean.TRUE.equals(request.getIncludePreviousPeriod())) {
            previousPeriodClaims = getPreviousPeriodClaims(request);
        }

        // ✅ DELEGATE ALL MAPPING TO MAPPER
        WarrantyCostReportResponseDTO report = reportMapper.mapToCompleteReport(
                periodClaims, request, generatedBy, previousPeriodClaims);

        log.info("EVM: Generated warranty cost report {} with {} claims, total cost: ${}",
                report.getReportId(), periodClaims.size(), report.getExecutiveSummary().getTotalWarrantyCost());

        return report;
    }

    @Override
    public WarrantyCostReportResponseDTO.ExecutiveSummaryDTO generateQuickSummary(LocalDate startDate, LocalDate endDate) {
        log.info("EVM: Generating quick summary for period {} to {}", startDate, endDate);

        List<Claim> claims = claimRepository.findAll().stream()
                .filter(claim -> isInDateRange(claim, startDate, endDate))
                .collect(Collectors.toList());

        // ✅ FIXED: Pass ALL claims, let mapper handle the separation
        return reportMapper.mapToExecutiveSummary(claims);
    }

    // ==================== PRIVATE HELPER METHODS (Business Logic Only) ====================

    private List<Claim> getClaimsForPeriod(WarrantyCostReportRequestDTO request) {
        return claimRepository.findAll().stream()
                .filter(claim -> isInDateRange(claim, request.getReportStartDate(), request.getReportEndDate()))
                .filter(claim -> matchesFilters(claim, request))
                .collect(Collectors.toList());
    }

    private List<Claim> getPreviousPeriodClaims(WarrantyCostReportRequestDTO request) {
        LocalDate prevStart, prevEnd;
        String comparisonType = request.getComparisonType();

        if ("YOY".equals(comparisonType)) {
            prevStart = request.getReportStartDate().minusYears(1);
            prevEnd = request.getReportEndDate().minusYears(1);
        } else { // MOM or default
            prevStart = request.getReportStartDate().minusMonths(1);
            prevEnd = request.getReportEndDate().minusMonths(1);
        }

        return claimRepository.findAll().stream()
                .filter(claim -> isInDateRange(claim, prevStart, prevEnd))
                .filter(claim -> matchesFilters(claim, request))
                .collect(Collectors.toList());
    }

    private boolean isInDateRange(Claim claim, LocalDate startDate, LocalDate endDate) {
        if (claim.getCreatedAt() == null) return false;

        LocalDate claimDate = claim.getCreatedAt().toLocalDate();
        return !claimDate.isBefore(startDate) && !claimDate.isAfter(endDate);
    }

    private boolean matchesFilters(Claim claim, WarrantyCostReportRequestDTO request) {
        // Vehicle model filter
        if (request.getVehicleModels() != null && !request.getVehicleModels().isEmpty()) {
            if (!request.getVehicleModels().contains(claim.getVehicle().getModel())) {
                return false;
            }
        }

        // Status filter
        if (request.getStatusCodes() != null && !request.getStatusCodes().isEmpty()) {
            if (!request.getStatusCodes().contains(claim.getStatus().getCode())) {
                return false;
            }
        }

        // Cost threshold filters
        if (request.getMinCostThreshold() != null) {
            if (claim.getWarrantyCost().compareTo(request.getMinCostThreshold()) < 0) {
                return false;
            }
        }

        if (request.getMaxCostThreshold() != null) {
            if (claim.getWarrantyCost().compareTo(request.getMaxCostThreshold()) > 0) {
                return false;
            }
        }

        // Zero cost filter
        if (!Boolean.TRUE.equals(request.getIncludeZeroCostClaims())) {
            if (claim.getWarrantyCost().compareTo(java.math.BigDecimal.ZERO) == 0) {
                return false;
            }
        }

        return true;
    }
}