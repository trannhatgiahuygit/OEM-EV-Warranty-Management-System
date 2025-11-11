package com.ev.warranty.model.dto.payment;

import lombok.Data;

@Data
public class VNPayCreatePaymentRequest {
    // Amount in VND (e.g., 100000 for 100,000 VND)
    private long amount;
    // Display info to show on VNPay checkout
    private String orderInfo;
    // Optional: default "other"
    private String orderType;
    // Optional: "vn" or "en"; default "vn"
    private String locale;
    // Optional: bank code
    private String bankCode;
    // Optional: custom transaction ref; if blank, server generates
    private String txnRef;
}

