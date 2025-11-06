package com.ev.warranty.ai.service.impl;

import com.ev.warranty.ai.config.GeminiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class GeminiClient {
    private final GeminiProperties properties;
    private final RestTemplate restTemplate;

    // Minimal JSON shape for Gemini generateContent
    public String generateContent(String prompt) {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            log.warn("Gemini API key is missing. Set GEMINI_API_KEY env or ai.gemini.api-key in properties.");
            return null;
        }
        String url = properties.getApiBaseUrl() + "/models/" + properties.getModel() + ":generateContent?key=" + properties.getApiKey();

        String body = "{\n" +
                "  \"contents\": [ { \"parts\": [ { \"text\": " + jsonEscape(prompt) + " } ] } ]\n" +
                "}";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity, (Class<Map<String, Object>>)(Class<?>)Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // Parse simplified path: candidates[0].content.parts[0].text
                Object candidates = response.getBody().get("candidates");
                if (candidates instanceof List<?> list && !list.isEmpty()) {
                    Object first = list.get(0);
                    if (first instanceof Map<?,?> cand) {
                        Object content = cand.get("content");
                        if (content instanceof Map<?,?> cMap) {
                            Object parts = cMap.get("parts");
                            if (parts instanceof List<?> pList && !pList.isEmpty()) {
                                Object p0 = pList.get(0);
                                if (p0 instanceof Map<?,?> p0Map) {
                                    Object text = p0Map.get("text");
                                    return text != null ? text.toString() : null;
                                }
                            }
                        }
                    }
                }
            }
            log.warn("Gemini unexpected response: {}", response);
        } catch (Exception ex) {
            log.error("Gemini call failed", ex);
        }
        return null;
    }

    private String jsonEscape(String s) {
        if (s == null) return "\"\"";
        return "\"" + s
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t") + "\"";
    }
}
