package com.ev.warranty.ai.service.impl;

import com.ev.warranty.ai.model.dto.FailureAnalysisRequestDTO;
import com.ev.warranty.ai.model.dto.FailureAnalysisResponseDTO;
import com.ev.warranty.ai.service.inter.FailureAnalysisAIService;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.ClaimItem;
import com.ev.warranty.repository.ClaimItemRepository;
import com.ev.warranty.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FailureAnalysisAIServiceImpl implements FailureAnalysisAIService {

    private final ClaimRepository claimRepository;
    private final ClaimItemRepository claimItemRepository;
    private final GeminiClient geminiClient;

    @Override
    public FailureAnalysisResponseDTO analyzeFailures(FailureAnalysisRequestDTO request, String requestedBy) {
        // 1) Collect data window
        LocalDate start;
        LocalDate end;
        String tf = Optional.ofNullable(request.getTimeframe()).orElse("LAST_6_MONTHS");
        LocalDate today = LocalDate.now();
        switch (tf) {
            case "LAST_3_MONTHS" -> { start = today.minusMonths(3); end = today; }
            case "LAST_12_MONTHS" -> { start = today.minusMonths(12); end = today; }
            case "CUSTOM" -> {
                start = LocalDate.parse(request.getStartDate());
                end = LocalDate.parse(request.getEndDate());
            }
            default -> { start = today.minusMonths(6); end = today; }
        }

        // 2) Filter claims
        List<Claim> claims = claimRepository.findAll().stream()
                .filter(c -> c.getCreatedAt() != null)
                .filter(c -> {
                    LocalDate d = c.getCreatedAt().toLocalDate();
                    return !d.isBefore(start) && !d.isAfter(end);
                })
                .filter(c -> request.getVehicleModel() == null ||
                        (c.getVehicle() != null && request.getVehicleModel().equalsIgnoreCase(c.getVehicle().getModel())))
                .collect(Collectors.toList());

        // 3) Aggregate text and costs by simple grouping (PART/MODEL/CATEGORY)
        Map<String, List<Claim>> groups = new HashMap<>();
        String groupBy = Optional.ofNullable(request.getGroupBy()).orElse("PART");
        for (Claim c : claims) {
            String key;
            switch (groupBy) {
                case "MODEL" -> key = c.getVehicle() != null ? String.valueOf(c.getVehicle().getModel()) : "UNKNOWN_MODEL";
                case "CATEGORY" -> key = deriveTopCategory(c);
                default -> key = deriveTopPart(c);
            }
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(c);
        }

        // 4) Build prompt for Gemini
        String prompt = buildFailurePrompt(groups, request.getTopN());
        String aiText = geminiClient.generateContent(prompt);

        // 5) Heuristic parse: we'll just keep AI natural text as summary and craft topN list by stats
        List<FailureAnalysisResponseDTO.PatternInsight> insights = groups.entrySet().stream()
                .sorted((a,b) -> Integer.compare(b.getValue().size(), a.getValue().size()))
                .limit(Optional.ofNullable(request.getTopN()).orElse(10))
                .map(e -> {
                    BigDecimal avgCost = e.getValue().stream()
                            .map(Claim::getCompanyPaidCost)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    int count = e.getValue().size();
                    if (count > 0 && avgCost != null) avgCost = avgCost.divide(BigDecimal.valueOf(count), java.math.RoundingMode.HALF_UP);
                    List<String> models = e.getValue().stream()
                            .map(c -> c.getVehicle() != null ? c.getVehicle().getModel() : null)
                            .filter(Objects::nonNull)
                            .distinct()
                            .limit(5)
                            .collect(Collectors.toList());
                    return FailureAnalysisResponseDTO.PatternInsight.builder()
                            .pattern(e.getKey())
                            .frequency(count)
                            .affectedModels(models)
                            .averageCost(Optional.ofNullable(avgCost).orElse(BigDecimal.ZERO))
                            .rootCause(null) // let AI suggest in summary
                            .recommendation(null)
                            .build();
                })
                .collect(Collectors.toList());

        return FailureAnalysisResponseDTO.builder()
                .analysisId("FA-" + System.currentTimeMillis())
                .generatedAt(LocalDateTime.now())
                .aiModel("Gemini")
                .summary(aiText)
                .topFailurePatterns(insights)
                .build();
    }

    private String deriveTopPart(Claim c) {
        try {
            List<ClaimItem> items = claimItemRepository.findByClaimId(c.getId());
            return items.stream()
                    .filter(i -> i.getPart() != null)
                    .collect(Collectors.groupingBy(i -> i.getPart().getName(), Collectors.counting()))
                    .entrySet().stream().max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey).orElse("UNKNOWN_PART");
        } catch (Exception ex) {
            return "UNKNOWN_PART";
        }
    }

    private String deriveTopCategory(Claim c) {
        try {
            List<ClaimItem> items = claimItemRepository.findByClaimId(c.getId());
            return items.stream()
                    .filter(i -> i.getPart() != null)
                    .collect(Collectors.groupingBy(i -> Optional.ofNullable(i.getPart().getCategory()).orElse("UNCATEGORIZED"), Collectors.counting()))
                    .entrySet().stream().max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey).orElse("UNCATEGORIZED");
        } catch (Exception ex) {
            return "UNCATEGORIZED";
        }
    }

    private String buildFailurePrompt(Map<String, List<Claim>> groups, int topN) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an automotive warranty analysis assistant. Analyze warranty claim groups to identify common failure patterns, root causes, and recommendations.\n");
        sb.append("Return concise insights.\n");
        sb.append("Data summary by group (name | count | sample failure texts | avg cost):\n");
        groups.entrySet().stream()
                .sorted((a,b) -> Integer.compare(b.getValue().size(), a.getValue().size()))
                .limit(topN)
                .forEach(e -> {
                    List<String> samples = e.getValue().stream()
                            .map(c -> Optional.ofNullable(c.getReportedFailure()).orElse(Optional.ofNullable(c.getInitialDiagnosis()).orElse("")))
                            .filter(s -> s != null && !s.isBlank())
                            .limit(3)
                            .map(s -> s.replaceAll("\n", " ").trim())
                            .collect(Collectors.toList());
                    BigDecimal avg = e.getValue().stream().map(Claim::getCompanyPaidCost).filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    int cnt = e.getValue().size();
                    if (cnt > 0) avg = avg.divide(BigDecimal.valueOf(cnt), java.math.RoundingMode.HALF_UP);
                    sb.append("- ").append(e.getKey()).append(" | ").append(cnt)
                            .append(" | samples: ").append(samples)
                            .append(" | avgCost: ").append(avg).append("\n");
                });
        sb.append("Please summarize: top patterns, likely root causes, and actionable recommendations.\n");
        return sb.toString();
    }
}

