package com.ev.warranty.ai.service;

import com.ev.warranty.ai.model.dto.FailureAnalysisRequestDTO;
import com.ev.warranty.ai.model.dto.FailureAnalysisResponseDTO;
import com.ev.warranty.ai.service.impl.FailureAnalysisAIServiceImpl;
import com.ev.warranty.ai.service.impl.GeminiClient;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.ClaimItemRepository;
import com.ev.warranty.repository.ClaimRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

public class FailureAnalysisAIServiceImplTest {

    @Test
    void analyzeFailures_returnsInsights() {
        ClaimRepository claimRepo = Mockito.mock(ClaimRepository.class);
        ClaimItemRepository itemRepo = Mockito.mock(ClaimItemRepository.class);
        GeminiClient gemini = Mockito.mock(GeminiClient.class);
        when(gemini.generateContent(Mockito.anyString())).thenReturn("Top issues include battery voltage drop and motor overheating. Recommend recall and software updates.");

        Vehicle v = Vehicle.builder().model("Model X").build();
        Claim c1 = Claim.builder()
                .id(1)
                .claimNumber("CX-1")
                .vehicle(v)
                .customer(new Customer())
                .createdBy(new User())
                .createdAt(LocalDateTime.now().minusMonths(1))
                .build();
        // Set cost through ClaimCost entity
        c1.getOrCreateCost().setCompanyPaidCost(new BigDecimal("2000"));
        // Set diagnostic through ClaimDiagnostic entity
        c1.getOrCreateDiagnostic().setReportedFailure("Battery drains quickly");
        
        Claim c2 = Claim.builder()
                .id(2)
                .claimNumber("CX-2")
                .vehicle(v)
                .customer(new Customer())
                .createdBy(new User())
                .createdAt(LocalDateTime.now().minusMonths(2))
                .build();
        // Set cost through ClaimCost entity
        c2.getOrCreateCost().setCompanyPaidCost(new BigDecimal("1800"));
        // Set diagnostic through ClaimDiagnostic entity
        c2.getOrCreateDiagnostic().setInitialDiagnosis("Motor overheating warning under load");
        when(claimRepo.findAll()).thenReturn(List.of(c1, c2));

        Part pBattery = Part.builder().name("HV Battery").category("Battery").build();
        Part pMotor = Part.builder().name("Drive Motor").category("Motor").build();
        ClaimItem i1 = ClaimItem.builder().id(11).claim(c1).part(pBattery).itemType("PART").costType("WARRANTY").build();
        ClaimItem i2 = ClaimItem.builder().id(12).claim(c2).part(pMotor).itemType("PART").costType("WARRANTY").build();
        when(itemRepo.findByClaimId(1)).thenReturn(List.of(i1));
        when(itemRepo.findByClaimId(2)).thenReturn(List.of(i2));

        FailureAnalysisAIServiceImpl service = new FailureAnalysisAIServiceImpl(claimRepo, itemRepo, gemini);
        FailureAnalysisRequestDTO req = new FailureAnalysisRequestDTO();
        req.setTimeframe("LAST_3_MONTHS");
        req.setGroupBy("PART");
        req.setTopN(5);

        FailureAnalysisResponseDTO res = service.analyzeFailures(req, "tester");
        assertThat(res).isNotNull();
        assertThat(res.getTopFailurePatterns()).isNotEmpty();
        assertThat(res.getSummary()).contains("battery");
    }
}

