package com.ev.warranty.model.dto.payment;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class VNPayReturnResponse {
    private boolean success;
    private String txnRef;
    private String responseCode; // vnp_ResponseCode
    private String message;
    private Map<String, String> rawParams;
}

