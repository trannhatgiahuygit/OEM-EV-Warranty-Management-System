package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.payment.VNPayCreatePaymentRequest;
import com.ev.warranty.model.dto.payment.VNPayPaymentInitResponse;
import com.ev.warranty.model.dto.payment.VNPayReturnResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

public interface PaymentService {
    VNPayPaymentInitResponse createVNPayPayment(VNPayCreatePaymentRequest request, HttpServletRequest servletRequest);
    VNPayReturnResponse handleVNPayReturn(Map<String, String> queryParams);
}

