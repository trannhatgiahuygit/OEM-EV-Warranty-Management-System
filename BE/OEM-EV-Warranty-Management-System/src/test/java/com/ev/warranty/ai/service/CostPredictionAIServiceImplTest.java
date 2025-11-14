package com.ev.warranty.ai.service;

import com.ev.warranty.ai.model.dto.CostPredictionRequestDTO;
import com.ev.warranty.ai.model.dto.CostPredictionResponseDTO;
import com.ev.warranty.ai.service.impl.CostPredictionAIServiceImpl;
import com.ev.warranty.ai.service.impl.GeminiClient;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.Customer;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.repository.ClaimRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

public class CostPredictionAIServiceImplTest {

    @Test
    void predictCosts_basicFlow_returnsForecast() {
        ClaimRepository repo = Mockito.mock(ClaimRepository.class);
        GeminiClient gemini = Mockito.mock(GeminiClient.class);
        when(gemini.generateContent(Mockito.anyString())).thenReturn("- Optimize parts supply\n- Improve diagnostics\n- Preventive campaigns");

        Claim c1 = Claim.builder()
                .id(1)
                .claimNumber("C1")
                .vehicle(Vehicle.builder().model("M1").build())
                .customer(new Customer())
                .createdBy(new User())
                .createdAt(LocalDateTime.now().minusMonths(2))
                .build();
        // Set cost through ClaimCost entity
        com.ev.warranty.model.entity.ClaimCost cost1 = com.ev.warranty.model.entity.ClaimCost.builder()
                .claim(c1)
                .companyPaidCost(new BigDecimal("1000"))
                .build();
        c1.setCost(cost1);
        
        Claim c2 = Claim.builder()
                .id(2)
                .claimNumber("C2")
                .vehicle(Vehicle.builder().model("M1").build())
                .customer(new Customer())
                .createdBy(new User())
                .createdAt(LocalDateTime.now().minusMonths(1))
                .build();
        // Set cost through ClaimCost entity
        com.ev.warranty.model.entity.ClaimCost cost2 = com.ev.warranty.model.entity.ClaimCost.builder()
                .claim(c2)
                .companyPaidCost(new BigDecimal("1500"))
                .build();
        c2.setCost(cost2);
        when(repo.findAll()).thenReturn(List.of(c1, c2));

        CostPredictionAIServiceImpl service = new CostPredictionAIServiceImpl(repo, gemini);
        CostPredictionRequestDTO req = new CostPredictionRequestDTO();
        req.setForecastPeriod("NEXT_3_MONTHS");

        CostPredictionResponseDTO res = service.predictCosts(req, "tester");
        assertThat(res.getPredictions()).hasSize(3);
        assertThat(res.getRecommendations()).isNotEmpty();
        assertThat(res.getAiModel()).isEqualTo("Gemini");
    }
}

