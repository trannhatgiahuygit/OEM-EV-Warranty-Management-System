package com.ev.warranty.ai.service.inter;

import com.ev.warranty.ai.model.dto.CostPredictionRequestDTO;
import com.ev.warranty.ai.model.dto.CostPredictionResponseDTO;

public interface CostPredictionAIService {
    CostPredictionResponseDTO predictCosts(CostPredictionRequestDTO request, String requestedBy);
}

