package com.ev.warranty.ai.controller;

import com.ev.warranty.ai.model.dto.CostPredictionRequestDTO;
import com.ev.warranty.ai.model.dto.CostPredictionResponseDTO;
import com.ev.warranty.ai.model.dto.FailureAnalysisRequestDTO;
import com.ev.warranty.ai.model.dto.FailureAnalysisResponseDTO;
import com.ev.warranty.ai.service.inter.CostPredictionAIService;
import com.ev.warranty.ai.service.inter.FailureAnalysisAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIAnalyticsController {

    private final FailureAnalysisAIService failureAnalysisAIService;
    private final CostPredictionAIService costPredictionAIService;

    @PostMapping("/analyze-failures")
    public ResponseEntity<FailureAnalysisResponseDTO> analyzeFailures(@RequestBody FailureAnalysisRequestDTO request,
                                                                     @RequestHeader(name = "X-User", required = false) String user) {
        FailureAnalysisResponseDTO dto = failureAnalysisAIService.analyzeFailures(request, user != null ? user : "system");
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/predict-costs")
    public ResponseEntity<CostPredictionResponseDTO> predictCosts(@RequestBody CostPredictionRequestDTO request,
                                                                  @RequestHeader(name = "X-User", required = false) String user) {
        CostPredictionResponseDTO dto = costPredictionAIService.predictCosts(request, user != null ? user : "system");
        return ResponseEntity.ok(dto);
    }
}

