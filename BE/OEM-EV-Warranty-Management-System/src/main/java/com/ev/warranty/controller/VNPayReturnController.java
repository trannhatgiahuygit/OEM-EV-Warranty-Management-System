package com.ev.warranty.controller;

import com.ev.warranty.model.dto.payment.VNPayReturnResponse;
import com.ev.warranty.service.inter.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// Separate controller for actual return URL path /vnpay/return (outside /api) to match configured returnUrl
@RestController
@RequiredArgsConstructor
public class VNPayReturnController {

    private final PaymentService paymentService;

    @GetMapping("/vnpay/return")
    public ResponseEntity<VNPayReturnResponse> handleReturn(@RequestParam Map<String, String> allParams, HttpServletRequest request) {
        VNPayReturnResponse resp = paymentService.handleVNPayReturn(allParams);
        return ResponseEntity.ok(resp);
    }
}

