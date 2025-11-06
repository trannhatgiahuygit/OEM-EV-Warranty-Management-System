package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.part.PartFailureStatsRequestDTO;
import com.ev.warranty.model.dto.part.PartFailureStatsResponseDTO;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.WorkOrderPart;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.WorkOrderPartRepository;
import com.ev.warranty.repository.VehicleRepository;
import com.ev.warranty.service.inter.PartFailureStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartFailureStatsServiceImpl implements PartFailureStatsService {

    private final ClaimRepository claimRepository;
    private final WorkOrderPartRepository workOrderPartRepository;
    private final VehicleRepository vehicleRepository;

    @Override
    public PartFailureStatsResponseDTO generatePartFailureStats(
            PartFailureStatsRequestDTO request,
            String generatedBy) {

        log.info("Generating part failure statistics for period {} to {} by user {}",
                request.getStartDate(), request.getEndDate(), generatedBy);

        // Get filtered claims data
        List<Claim> periodClaims = getFilteredClaims(request);

        // Get work order parts data
        List<WorkOrderPart> failedParts = getFailedParts(periodClaims);

        // Calculate total vehicles for rate calculations
        long totalVehicles = getTotalVehiclesCount(request);

        // Generate report ID
        String reportId = generateReportId(request, generatedBy);

        // Build comprehensive report
        return PartFailureStatsResponseDTO.builder()
                .reportId(reportId)
                .analysisStartDate(request.getStartDate())
                .analysisEndDate(request.getEndDate())
                .generatedAt(LocalDateTime.now())
                .generatedBy(generatedBy)
                .executiveSummary(buildExecutiveSummary(periodClaims, failedParts, totalVehicles))
                .partStatistics(buildPartStatistics(failedParts, request))
                .categoryStatistics(buildCategoryStatistics(failedParts))
                .timeBasedStatistics(buildTimeBasedStatistics(periodClaims, request.getGroupBy()))
                .vehicleModelStatistics(buildVehicleModelStatistics(periodClaims, request))
                .riskAnalysis(buildRiskAnalysis(failedParts, periodClaims))
                .recommendations(generateRecommendations(failedParts, periodClaims))
                .build();
    }

    @Override
    public PartFailureStatsResponseDTO.ExecutiveSummaryDTO getQuickFailureStats(
            String startDate, String endDate) {

        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);

        List<Claim> claims = claimRepository.findAll().stream()
                .filter(claim -> isInDateRange(claim, start, end))
                .collect(Collectors.toList());

        List<WorkOrderPart> failedParts = getFailedParts(claims);
        long totalVehicles = vehicleRepository.count();

        return buildExecutiveSummary(claims, failedParts, totalVehicles);
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private List<Claim> getFilteredClaims(PartFailureStatsRequestDTO request) {
        return claimRepository.findAll().stream()
                .filter(claim -> isInDateRange(claim, request.getStartDate(), request.getEndDate()))
                .filter(claim -> matchesFilters(claim, request))
                .collect(Collectors.toList());
    }

    private boolean isInDateRange(Claim claim, LocalDate startDate, LocalDate endDate) {
        if (claim.getCreatedAt() == null) return false;
        LocalDate claimDate = claim.getCreatedAt().toLocalDate();
        return !claimDate.isBefore(startDate) && !claimDate.isAfter(endDate);
    }

    private boolean matchesFilters(Claim claim, PartFailureStatsRequestDTO request) {
        // Vehicle model filter
        if (request.getVehicleModels() != null && !request.getVehicleModels().isEmpty()) {
            if (!request.getVehicleModels().contains(claim.getVehicle().getModel())) {
                return false;
            }
        }

        // Vehicle year filter
        if (request.getVehicleYears() != null && !request.getVehicleYears().isEmpty()) {
            if (!request.getVehicleYears().contains(claim.getVehicle().getYear())) {
                return false;
            }
        }

        return true;
    }

    private List<WorkOrderPart> getFailedParts(List<Claim> claims) {
        Set<Integer> claimIds = claims.stream()  // Set<Integer> nhưng claim.getId() trả về Long
                .map(Claim::getId)
                .collect(Collectors.toSet());

        return workOrderPartRepository.findAll().stream()
                .filter(wop -> claimIds.contains(wop.getWorkOrder().getClaim().getId()))
                .collect(Collectors.toList());
    }

    private long getTotalVehiclesCount(PartFailureStatsRequestDTO request) {
        long totalVehicles = vehicleRepository.count();

        // Apply vehicle model filter if specified
        if (request.getVehicleModels() != null && !request.getVehicleModels().isEmpty()) {
            totalVehicles = vehicleRepository.findAll().stream()
                    .filter(v -> request.getVehicleModels().contains(v.getModel()))
                    .count();
        }

        return totalVehicles;
    }

    private String generateReportId(PartFailureStatsRequestDTO request, String generatedBy) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return String.format("PFS-%s-%s-%s",
                request.getStartDate().format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                request.getEndDate().format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                timestamp);
    }

    private PartFailureStatsResponseDTO.ExecutiveSummaryDTO buildExecutiveSummary(
            List<Claim> claims, List<WorkOrderPart> failedParts, long totalVehicles) {

        if (claims.isEmpty()) {
            return PartFailureStatsResponseDTO.ExecutiveSummaryDTO.builder()
                    .totalFailures(0)
                    .uniquePartsAffected(0)
                    .totalVehiclesAffected(0)
                    .totalFailureCost(BigDecimal.ZERO)
                    .averageCostPerFailure(BigDecimal.ZERO)
                    .overallFailureRate(BigDecimal.ZERO)
                    .riskTrend("STABLE")
                    .build();
        }

        int totalFailures = failedParts.size();
        int uniqueParts = (int) failedParts.stream()
                .map(fp -> fp.getPart().getPartNumber())
                .distinct()
                .count();

        int vehiclesAffected = (int) claims.stream()
                .map(claim -> claim.getVehicle().getId())
                .distinct()
                .count();

        BigDecimal totalCost = claims.stream()
                .map(Claim::getWarrantyCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgCost = totalFailures == 0 ? BigDecimal.ZERO :
                totalCost.divide(BigDecimal.valueOf(totalFailures), 2, RoundingMode.HALF_UP);

        // Calculate failure rate per 1000 vehicles
        BigDecimal failureRate = totalVehicles == 0 ? BigDecimal.ZERO :
                BigDecimal.valueOf(totalFailures * 1000.0 / totalVehicles)
                        .setScale(2, RoundingMode.HALF_UP);

        // Find most failed category and part
        String mostFailedCategory = findMostFailedCategory(failedParts);
        String mostFailedPart = findMostFailedPart(failedParts);

        return PartFailureStatsResponseDTO.ExecutiveSummaryDTO.builder()
                .totalFailures(totalFailures)
                .uniquePartsAffected(uniqueParts)
                .totalVehiclesAffected(vehiclesAffected)
                .totalFailureCost(totalCost)
                .averageCostPerFailure(avgCost)
                .mostFailedPartCategory(mostFailedCategory)
                .mostFailedPartNumber(mostFailedPart)
                .overallFailureRate(failureRate)
                .riskTrend(determineTrend(claims))
                .build();
    }

    private String findMostFailedCategory(List<WorkOrderPart> failedParts) {
        return failedParts.stream()
                .collect(Collectors.groupingBy(
                        fp -> fp.getPart().getCategory(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
    }

    private String findMostFailedPart(List<WorkOrderPart> failedParts) {
        return failedParts.stream()
                .collect(Collectors.groupingBy(
                        fp -> fp.getPart().getPartNumber(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
    }

    private String determineTrend(List<Claim> claims) {
        // Simple trend analysis based on claim dates
        if (claims.size() < 2) return "STABLE";

        // Compare first half vs second half of period
        claims.sort((c1, c2) -> c1.getCreatedAt().compareTo(c2.getCreatedAt()));
        int midPoint = claims.size() / 2;
        int firstHalf = midPoint;
        int secondHalf = claims.size() - midPoint;

        if (secondHalf > firstHalf * 1.2) return "INCREASING";
        if (secondHalf < firstHalf * 0.8) return "DECREASING";
        return "STABLE";
    }

    private List<PartFailureStatsResponseDTO.PartFailureStatsDTO> buildPartStatistics(
            List<WorkOrderPart> failedParts, PartFailureStatsRequestDTO request) {

        Map<String, List<WorkOrderPart>> partGroups = failedParts.stream()
                .collect(Collectors.groupingBy(fp -> fp.getPart().getPartNumber()));

        return partGroups.entrySet().stream()
                .map(entry -> buildPartStat(entry.getKey(), entry.getValue()))
                .filter(stat -> request.getMinFailureCount() == null ||
                        stat.getFailureCount() >= request.getMinFailureCount())
                .sorted((s1, s2) -> s2.getFailureCount().compareTo(s1.getFailureCount()))
                .collect(Collectors.toList());
    }

    private PartFailureStatsResponseDTO.PartFailureStatsDTO buildPartStat(
            String partNumber, List<WorkOrderPart> failures) {

        if (failures.isEmpty()) return null;

        WorkOrderPart sample = failures.get(0);
        int failureCount = failures.size();

        // Calculate cost metrics
        BigDecimal totalCost = failures.stream()
                .map(fp -> fp.getWorkOrder().getClaim().getWarrantyCost())
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgCost = failureCount == 0 ? BigDecimal.ZERO :
                totalCost.divide(BigDecimal.valueOf(failureCount), 2, RoundingMode.HALF_UP);

        // Get affected vehicles
        int vehiclesAffected = (int) failures.stream()
                .map(fp -> fp.getWorkOrder().getClaim().getVehicle().getId())
                .distinct()
                .count();

        // Determine risk level
        String riskLevel = determineRiskLevel(failureCount, totalCost);

        // Get failure dates
        LocalDate firstFailure = failures.stream()
                .map(fp -> fp.getWorkOrder().getClaim().getCreatedAt().toLocalDate())
                .min(LocalDate::compareTo)
                .orElse(null);

        LocalDate lastFailure = failures.stream()
                .map(fp -> fp.getWorkOrder().getClaim().getCreatedAt().toLocalDate())
                .max(LocalDate::compareTo)
                .orElse(null);

        return PartFailureStatsResponseDTO.PartFailureStatsDTO.builder()
                .partNumber(partNumber)
                .partName(sample.getPart().getName())
                .category(sample.getPart().getCategory())
                .failureCount(failureCount)
                .totalFailureCost(totalCost)
                .averageCostPerFailure(avgCost)
                .vehiclesAffected(vehiclesAffected)
                .riskLevel(riskLevel)
                .firstFailureDate(firstFailure)
                .lastFailureDate(lastFailure)
                .recallIssued(false) // TODO: Check against recall campaigns
                .build();
    }

    private String determineRiskLevel(int failureCount, BigDecimal totalCost) {
        if (failureCount >= 10 || totalCost.compareTo(BigDecimal.valueOf(5000)) >= 0) {
            return "CRITICAL";
        } else if (failureCount >= 5 || totalCost.compareTo(BigDecimal.valueOf(2000)) >= 0) {
            return "HIGH";
        } else if (failureCount >= 2 || totalCost.compareTo(BigDecimal.valueOf(500)) >= 0) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private List<PartFailureStatsResponseDTO.CategoryFailureStatsDTO> buildCategoryStatistics(
            List<WorkOrderPart> failedParts) {

        Map<String, List<WorkOrderPart>> categoryGroups = failedParts.stream()
                .collect(Collectors.groupingBy(fp -> fp.getPart().getCategory()));

        return categoryGroups.entrySet().stream()
                .map(entry -> buildCategoryStat(entry.getKey(), entry.getValue()))
                .sorted((s1, s2) -> s2.getFailureCount().compareTo(s1.getFailureCount()))
                .collect(Collectors.toList());
    }

    private PartFailureStatsResponseDTO.CategoryFailureStatsDTO buildCategoryStat(
            String category, List<WorkOrderPart> failures) {

        int failureCount = failures.size();
        int uniqueParts = (int) failures.stream()
                .map(fp -> fp.getPart().getPartNumber())
                .distinct()
                .count();

        BigDecimal totalCost = failures.stream()
                .map(fp -> fp.getWorkOrder().getClaim().getWarrantyCost())
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String riskLevel = determineRiskLevel(failureCount, totalCost);

        return PartFailureStatsResponseDTO.CategoryFailureStatsDTO.builder()
                .category(category)
                .failureCount(failureCount)
                .uniqueParts(uniqueParts)
                .totalCost(totalCost)
                .riskLevel(riskLevel)
                .trend("STABLE") // TODO: Implement trend calculation
                .build();
    }

    private List<PartFailureStatsResponseDTO.TimeBasedStatsDTO> buildTimeBasedStatistics(
            List<Claim> claims, String groupBy) {

        if ("MONTH".equals(groupBy)) {
            return buildMonthlyStats(claims);
        } else if ("QUARTER".equals(groupBy)) {
            return buildQuarterlyStats(claims);
        }
        return new ArrayList<>();
    }

    private List<PartFailureStatsResponseDTO.TimeBasedStatsDTO> buildMonthlyStats(List<Claim> claims) {
        Map<String, List<Claim>> monthlyGroups = claims.stream()
                .collect(Collectors.groupingBy(claim ->
                        claim.getCreatedAt().toLocalDate().format(DateTimeFormatter.ofPattern("yyyy-MM"))));

        return monthlyGroups.entrySet().stream()
                .map(entry -> buildTimeStat(entry.getKey(), entry.getValue(), "MONTH"))
                .sorted((s1, s2) -> s1.getPeriod().compareTo(s2.getPeriod()))
                .collect(Collectors.toList());
    }

    private List<PartFailureStatsResponseDTO.TimeBasedStatsDTO> buildQuarterlyStats(List<Claim> claims) {
        Map<String, List<Claim>> quarterlyGroups = claims.stream()
                .collect(Collectors.groupingBy(claim -> {
                    LocalDate date = claim.getCreatedAt().toLocalDate();
                    int quarter = (date.getMonthValue() - 1) / 3 + 1;
                    return date.getYear() + "-Q" + quarter;
                }));

        return quarterlyGroups.entrySet().stream()
                .map(entry -> buildTimeStat(entry.getKey(), entry.getValue(), "QUARTER"))
                .sorted((s1, s2) -> s1.getPeriod().compareTo(s2.getPeriod()))
                .collect(Collectors.toList());
    }

    private PartFailureStatsResponseDTO.TimeBasedStatsDTO buildTimeStat(
            String period, List<Claim> periodClaims, String groupBy) {

        int failureCount = periodClaims.size();
        BigDecimal totalCost = periodClaims.stream()
                .map(Claim::getWarrantyCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate period start and end dates
        LocalDate periodStart = null;
        LocalDate periodEnd = null;

        if ("MONTH".equals(groupBy) && period.matches("\\d{4}-\\d{2}")) {
            periodStart = LocalDate.parse(period + "-01");
            periodEnd = periodStart.withDayOfMonth(periodStart.lengthOfMonth());
        } else if ("QUARTER".equals(groupBy) && period.matches("\\d{4}-Q\\d")) {
            int year = Integer.parseInt(period.substring(0, 4));
            int quarter = Integer.parseInt(period.substring(6));
            periodStart = LocalDate.of(year, (quarter - 1) * 3 + 1, 1);
            periodEnd = periodStart.plusMonths(3).minusDays(1);
        }

        return PartFailureStatsResponseDTO.TimeBasedStatsDTO.builder()
                .period(period)
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .failureCount(failureCount)
                .totalCost(totalCost)
                .trend("STABLE") // TODO: Implement trend vs previous period
                .build();
    }

    private List<PartFailureStatsResponseDTO.VehicleModelStatsDTO> buildVehicleModelStatistics(
            List<Claim> claims, PartFailureStatsRequestDTO request) {

        Map<String, List<Claim>> modelGroups = claims.stream()
                .collect(Collectors.groupingBy(claim -> claim.getVehicle().getModel()));

        return modelGroups.entrySet().stream()
                .map(entry -> buildVehicleModelStat(entry.getKey(), entry.getValue()))
                .sorted((s1, s2) -> s2.getFailureCount().compareTo(s1.getFailureCount()))
                .collect(Collectors.toList());
    }

    private PartFailureStatsResponseDTO.VehicleModelStatsDTO buildVehicleModelStat(
            String model, List<Claim> modelClaims) {

        int failureCount = modelClaims.size();
        BigDecimal totalCost = modelClaims.stream()
                .map(Claim::getWarrantyCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Get vehicle year (most common)
        Integer vehicleYear = modelClaims.stream()
                .map(claim -> claim.getVehicle().getYear())
                .collect(Collectors.groupingBy(year -> year, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        // Count total vehicles of this model
        long totalVehicles = vehicleRepository.findAll().stream()
                .filter(v -> v.getModel().equals(model))
                .count();

        BigDecimal failureRate = totalVehicles == 0 ? BigDecimal.ZERO :
                BigDecimal.valueOf(failureCount * 100.0 / totalVehicles)
                        .setScale(2, RoundingMode.HALF_UP);

        String qualityRating = determineQualityRating(failureRate);

        // Get top failed parts for this model
        List<String> topFailedParts = getTopFailedPartsForModel(modelClaims);

        return PartFailureStatsResponseDTO.VehicleModelStatsDTO.builder()
                .vehicleModel(model)
                .vehicleYear(vehicleYear)
                .failureCount(failureCount)
                .totalVehicles((int) totalVehicles)
                .failureRate(failureRate)
                .totalCost(totalCost)
                .qualityRating(qualityRating)
                .topFailedParts(topFailedParts)
                .build();
    }

    private List<String> getTopFailedPartsForModel(List<Claim> modelClaims) {
        Set<Integer> claimIds = modelClaims.stream()  // Set<Integer> nhưng claim.getId() trả về Long
                .map(Claim::getId)
                .collect(Collectors.toSet());

        return workOrderPartRepository.findAll().stream()
                .filter(wop -> claimIds.contains(wop.getWorkOrder().getClaim().getId()))
                .collect(Collectors.groupingBy(
                        wop -> wop.getPart().getPartNumber(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private String determineQualityRating(BigDecimal failureRate) {
        if (failureRate.compareTo(BigDecimal.valueOf(1.0)) <= 0) return "EXCELLENT";
        if (failureRate.compareTo(BigDecimal.valueOf(3.0)) <= 0) return "GOOD";
        if (failureRate.compareTo(BigDecimal.valueOf(6.0)) <= 0) return "FAIR";
        return "POOR";
    }

    private PartFailureStatsResponseDTO.RiskAnalysisDTO buildRiskAnalysis(
            List<WorkOrderPart> failedParts, List<Claim> claims) {

        // High risk parts (failure count >= 3)
        List<String> highRiskParts = failedParts.stream()
                .collect(Collectors.groupingBy(
                        fp -> fp.getPart().getPartNumber(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .filter(entry -> entry.getValue() >= 3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Emerging risks - parts with increasing failure trends
        List<String> emergingRisks = identifyEmergingRisks(failedParts);

        // Quality improvements - parts with decreasing failure trends
        List<String> qualityImprovements = identifyQualityImprovements(failedParts);

        // Recall candidates based on failure patterns
        List<String> recallCandidates = highRiskParts.stream()
                .limit(2)
                .collect(Collectors.toList());

        return PartFailureStatsResponseDTO.RiskAnalysisDTO.builder()
                .highRiskParts(highRiskParts)
                .emergingRisks(emergingRisks)
                .qualityImprovements(qualityImprovements)
                .recallCandidates(recallCandidates)
                .predictedNextMonthFailures(calculatePredictedFailures(claims))
                .overallQualityTrend(determineTrend(claims))
                .build();
    }

    private List<String> identifyEmergingRisks(List<WorkOrderPart> failedParts) {
        // Simple implementation - parts with recent failures
        return failedParts.stream()
                .filter(fp -> fp.getWorkOrder().getClaim().getCreatedAt()
                        .isAfter(LocalDateTime.now().minusMonths(1)))
                .map(fp -> fp.getPart().getPartNumber())
                .distinct()
                .limit(3)
                .collect(Collectors.toList());
    }

    private List<String> identifyQualityImprovements(List<WorkOrderPart> failedParts) {
        // Simple implementation - parts with no recent failures
        Set<String> recentFailedParts = failedParts.stream()
                .filter(fp -> fp.getWorkOrder().getClaim().getCreatedAt()
                        .isAfter(LocalDateTime.now().minusMonths(1)))
                .map(fp -> fp.getPart().getPartNumber())
                .collect(Collectors.toSet());

        return failedParts.stream()
                .map(fp -> fp.getPart().getPartNumber())
                .distinct()
                .filter(partNumber -> !recentFailedParts.contains(partNumber))
                .limit(2)
                .collect(Collectors.toList());
    }

    private BigDecimal calculatePredictedFailures(List<Claim> claims) {
        if (claims.isEmpty()) return BigDecimal.ZERO;

        // Simple linear prediction based on recent trend
        long recentFailures = claims.stream()
                .filter(claim -> claim.getCreatedAt().isAfter(LocalDateTime.now().minusMonths(1)))
                .count();

        return BigDecimal.valueOf(recentFailures * 1.1) // 10% increase assumption
                .setScale(0, RoundingMode.HALF_UP);
    }

    private List<String> generateRecommendations(List<WorkOrderPart> failedParts, List<Claim> claims) {
        List<String> recommendations = new ArrayList<>();

        // Category-based recommendations
        Map<String, Long> categoryFailures = failedParts.stream()
                .collect(Collectors.groupingBy(
                        fp -> fp.getPart().getCategory(),
                        Collectors.counting()
                ));

        if (categoryFailures.getOrDefault("Electronics", 0L) > 5) {
            recommendations.add("Review software quality assurance and electronic component testing procedures");
        }

        if (categoryFailures.getOrDefault("Battery", 0L) > 3) {
            recommendations.add("Enhance battery management system monitoring and thermal protection");
        }

        if (categoryFailures.getOrDefault("Motor", 0L) > 2) {
            recommendations.add("Implement enhanced motor bearing quality control and testing");
        }

        // High failure rate recommendations
        if (failedParts.size() > 10) {
            recommendations.add("Conduct comprehensive supplier quality audit for frequently failing components");
        }

        // General recommendations
        recommendations.add("Implement predictive maintenance alerts for high-risk components");
        recommendations.add("Enhance quality control testing procedures during manufacturing");
        recommendations.add("Consider extended warranty coverage for identified high-risk parts");

        return recommendations;
    }
}