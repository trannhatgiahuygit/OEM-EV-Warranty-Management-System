package com.ev.warranty.ai.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FailureAnalysisResponseDTO {
    private String analysisId;
    private LocalDateTime generatedAt;
    private String aiModel;
    private String summary; // natural language summary from Gemini
    private List<PatternInsight> topFailurePatterns;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PatternInsight {
        private String pattern;
        private Integer frequency;
        private List<String> affectedModels;
        private BigDecimal averageCost;
        private String rootCause;
        private String recommendation;
    }
}

