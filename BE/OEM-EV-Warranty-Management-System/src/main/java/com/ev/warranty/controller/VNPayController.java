package com.ev.warranty.controller;

import com.ev.warranty.model.dto.payment.VNPayCreatePaymentRequest;
import com.ev.warranty.model.dto.payment.VNPayPaymentInitResponse;
import com.ev.warranty.model.dto.payment.VNPayReturnResponse;
import com.ev.warranty.service.inter.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment/vnpay")
@RequiredArgsConstructor
@Tag(name = "VNPay", description = "VNPay sandbox payment integration")
public class VNPayController {

    private final PaymentService paymentService;

    @PostMapping("/create")
    @Operation(summary = "Create VNPay payment", description = "Generate a VNPay payment URL for sandbox environment")
    public ResponseEntity<VNPayPaymentInitResponse> createPayment(@RequestBody VNPayCreatePaymentRequest request,
                                                                  HttpServletRequest servletRequest) {
        VNPayPaymentInitResponse resp = paymentService.createVNPayPayment(request, servletRequest);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/return-test")
    @Operation(summary = "Simulate VNPay return", description = "Test signature verification using query params")
    public ResponseEntity<VNPayReturnResponse> testReturn(@RequestParam Map<String, String> allParams) {
        VNPayReturnResponse resp = paymentService.handleVNPayReturn(allParams);
        return ResponseEntity.ok(resp);
    }
}

