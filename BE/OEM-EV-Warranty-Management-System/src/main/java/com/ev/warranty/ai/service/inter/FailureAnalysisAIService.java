package com.ev.warranty.ai.service.inter;

import com.ev.warranty.ai.model.dto.FailureAnalysisRequestDTO;
import com.ev.warranty.ai.model.dto.FailureAnalysisResponseDTO;

public interface FailureAnalysisAIService {
    FailureAnalysisResponseDTO analyzeFailures(FailureAnalysisRequestDTO request, String requestedBy);
}

