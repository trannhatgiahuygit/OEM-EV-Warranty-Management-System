package com.ev.warranty.ai.service.impl;

import com.ev.warranty.ai.model.dto.CostPredictionRequestDTO;
import com.ev.warranty.ai.model.dto.CostPredictionResponseDTO;
import com.ev.warranty.ai.service.inter.CostPredictionAIService;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CostPredictionAIServiceImpl implements CostPredictionAIService {

    private final ClaimRepository claimRepository;
    private final GeminiClient geminiClient;

    @Override
    public CostPredictionResponseDTO predictCosts(CostPredictionRequestDTO request, String requestedBy) {
        // 1) Collect historical monthly costs (last 24 months)
        LocalDate today = LocalDate.now();
        YearMonth startYm = YearMonth.from(today.minusMonths(24));
        YearMonth endYm = YearMonth.from(today);

        Map<YearMonth, BigDecimal> hist = new LinkedHashMap<>();
        for (YearMonth ym = startYm; !ym.isAfter(endYm); ym = ym.plusMonths(1)) {
            hist.put(ym, BigDecimal.ZERO);
        }

        List<Claim> claims = claimRepository.findAll().stream()
                .filter(c -> c.getCreatedAt() != null)
                .filter(c -> request.getVehicleModel() == null ||
                        (c.getVehicle() != null && request.getVehicleModel().equalsIgnoreCase(c.getVehicle().getModel())))
                .collect(Collectors.toList());

        claims.forEach(c -> {
            YearMonth ym = YearMonth.from(c.getCreatedAt());
            if (hist.containsKey(ym) && c.getCompanyPaidCost() != null) {
                hist.put(ym, hist.get(ym).add(c.getCompanyPaidCost()));
            }
        });

        // 2) Simple trend estimate: moving average + slope
        List<YearMonth> months = new ArrayList<>(hist.keySet());
        List<BigDecimal> values = months.stream().map(hist::get).collect(Collectors.toList());

        BigDecimal avg = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(values.size()), RoundingMode.HALF_UP);

        // naive slope using last 6 months difference
        int N = Math.min(6, values.size());
        BigDecimal slope = BigDecimal.ZERO;
        if (N > 1) {
            BigDecimal first = values.get(values.size() - N);
            BigDecimal last = values.get(values.size() - 1);
            slope = last.subtract(first).divide(BigDecimal.valueOf(N - 1), RoundingMode.HALF_UP);
        }

        int horizon = switch (Optional.ofNullable(request.getForecastPeriod()).orElse("NEXT_12_MONTHS")) {
            case "NEXT_3_MONTHS" -> 3;
            case "NEXT_6_MONTHS" -> 6;
            default -> 12;
        };

        // 3) Forecast
        List<CostPredictionResponseDTO.PredictionPoint> preds = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        YearMonth cursor = YearMonth.from(today).plusMonths(1);
        for (int i = 0; i < horizon; i++) {
            BigDecimal base = avg.add(slope.multiply(BigDecimal.valueOf(i)));
            if (base.compareTo(BigDecimal.ZERO) < 0) base = BigDecimal.ZERO;
            BigDecimal lower = base.multiply(BigDecimal.valueOf(0.93)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal upper = base.multiply(BigDecimal.valueOf(1.07)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal pred = base.setScale(2, RoundingMode.HALF_UP);
            total = total.add(pred);
            preds.add(CostPredictionResponseDTO.PredictionPoint.builder()
                    .period(cursor.toString())
                    .predictedCost(pred)
                    .lowerBound(lower)
                    .upperBound(upper)
                    .confidence(0.8)
                    .build());
            cursor = cursor.plusMonths(1);
        }

        // 4) Let Gemini generate recommendations from trends
        String prompt = buildRecommendationPrompt(hist, preds, request.getVehicleModel());
        String recommendationsText = geminiClient.generateContent(prompt);
        List<String> recs = splitRecommendations(recommendationsText);

        // 5) Trend meta
        String overallTrend = slope.compareTo(BigDecimal.ZERO) > 0 ? "INCREASING" : (slope.compareTo(BigDecimal.ZERO) < 0 ? "DECREASING" : "STABLE");
        double changePercent = values.get(values.size()-1).compareTo(BigDecimal.ZERO) == 0
                ? 0.0
                : values.get(values.size()-1).subtract(values.get(0))
                    .divide(values.get(0).compareTo(BigDecimal.ZERO)==0? BigDecimal.ONE : values.get(0), RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue();

        return CostPredictionResponseDTO.builder()
                .predictionId("CP-" + System.currentTimeMillis())
                .generatedAt(LocalDateTime.now())
                .aiModel("Gemini")
                .historicalAverage(avg.setScale(2, RoundingMode.HALF_UP))
                .predictions(preds)
                .totalForecast(total.setScale(2, RoundingMode.HALF_UP))
                .trends(CostPredictionResponseDTO.TrendSummary.builder()
                        .overallTrend(overallTrend)
                        .changePercent(changePercent)
                        .keyDrivers(recs.size() > 0 ? recs.subList(0, Math.min(3, recs.size())) : List.of())
                        .build())
                .recommendations(recs)
                .build();
    }

    private String buildRecommendationPrompt(Map<YearMonth, BigDecimal> hist,
                                             List<CostPredictionResponseDTO.PredictionPoint> preds,
                                             String vehicleModel) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an automotive warranty cost forecasting assistant.\n");
        sb.append("Given historical monthly costs and forecasts, produce concise recommendations to mitigate rising costs, preventive actions, and risk alerts.\n");
        if (vehicleModel != null) sb.append("Vehicle model focus: ").append(vehicleModel).append("\n");
        sb.append("Historical: \n");
        hist.forEach((k,v) -> sb.append(k).append(": ").append(v).append("\n"));
        sb.append("Forecast: \n");
        preds.forEach(p -> sb.append(p.getPeriod()).append(": ").append(p.getPredictedCost())
                .append(" (LB ").append(p.getLowerBound()).append(", UB ").append(p.getUpperBound()).append(")\n"));
        sb.append("Return 3-6 bullet recommendations, each one short.");
        return sb.toString();
    }

    private List<String> splitRecommendations(String text) {
        if (text == null || text.isBlank()) return List.of();
        String[] lines = text.split("\r?\n");
        return Arrays.stream(lines)
                .map(l -> l.replaceFirst("^[-*]\\s*", "").trim())
                .filter(l -> !l.isBlank())
                .limit(6)
                .collect(Collectors.toList());
    }
}

