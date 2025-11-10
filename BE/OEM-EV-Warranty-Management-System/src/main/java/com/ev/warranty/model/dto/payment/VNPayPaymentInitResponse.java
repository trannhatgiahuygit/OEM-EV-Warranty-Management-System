package com.ev.warranty.model.dto.payment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VNPayPaymentInitResponse {
    private String paymentUrl;
    private String txnRef;
    private long amount;
    private String expireAt; // yyyyMMddHHmmss
}

