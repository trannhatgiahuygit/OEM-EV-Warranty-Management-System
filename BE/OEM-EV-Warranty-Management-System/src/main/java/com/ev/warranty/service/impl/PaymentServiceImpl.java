package com.ev.warranty.service.impl;

import com.ev.warranty.config.VNPayProperties;
import com.ev.warranty.model.dto.payment.VNPayCreatePaymentRequest;
import com.ev.warranty.model.dto.payment.VNPayPaymentInitResponse;
import com.ev.warranty.model.dto.payment.VNPayReturnResponse;
import com.ev.warranty.service.inter.PaymentService;
import com.ev.warranty.util.VNPayUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.SortedMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentServiceImpl implements PaymentService {

    @Qualifier("VNPayProperties")
    private final VNPayProperties vnPayProperties;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Override
    @Transactional
    public VNPayPaymentInitResponse createVNPayPayment(VNPayCreatePaymentRequest req, HttpServletRequest servletRequest) {
        if (req.getAmount() <= 0) {
            throw new IllegalArgumentException("Amount must be > 0");
        }

        String txnRef = (req.getTxnRef() != null && !req.getTxnRef().isBlank()) ? req.getTxnRef() : generateTxnRef();
        LocalDateTime createDate = LocalDateTime.now();
        LocalDateTime expireDate = createDate.plusMinutes(15);

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnPayProperties.getTmnCode());
        params.put("vnp_Amount", String.valueOf(req.getAmount() * 100)); // multiply by 100 as VNPay spec
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", safe(req.getOrderInfo(), "Warranty payment"));
        params.put("vnp_OrderType", safe(req.getOrderType(), "other"));
        params.put("vnp_Locale", safe(req.getLocale(), "vn"));
        params.put("vnp_ReturnUrl", vnPayProperties.getReturnUrl());
        params.put("vnp_IpAddr", VNPayUtils.getIpAddress(servletRequest));
        params.put("vnp_CreateDate", FORMATTER.format(createDate));
        params.put("vnp_ExpireDate", FORMATTER.format(expireDate));
        if (req.getBankCode() != null && !req.getBankCode().isBlank()) {
            params.put("vnp_BankCode", req.getBankCode());
        }

        // Sort and sign
        SortedMap<String, String> sorted = VNPayUtils.sortAndFilter(params);
        String query = VNPayUtils.buildQueryString(sorted);
        String secureHash = VNPayUtils.hmacSHA512(vnPayProperties.getHashSecret(), query);
        String paymentUrl = vnPayProperties.getPayUrl() + "?" + query + "&vnp_SecureHash=" + secureHash;

        log.info("Generated VNPay payment URL for txnRef {}", txnRef);

        return VNPayPaymentInitResponse.builder()
                .paymentUrl(paymentUrl)
                .txnRef(txnRef)
                .amount(req.getAmount())
                .expireAt(FORMATTER.format(expireDate))
                .build();
    }

    @Override
    public VNPayReturnResponse handleVNPayReturn(Map<String, String> queryParams) {
        boolean signatureValid = VNPayUtils.verifySignature(queryParams, vnPayProperties.getHashSecret());
        String responseCode = queryParams.get("vnp_ResponseCode");
        String txnRef = queryParams.get("vnp_TxnRef");

        boolean success = signatureValid && "00".equals(responseCode);
        String message;
        if (!signatureValid) {
            message = "Invalid signature";
        } else if ("00".equals(responseCode)) {
            message = "Payment successful";
        } else {
            message = "Payment failed (code=" + responseCode + ")";
        }

        log.info("VNPay return received txnRef={}, success={}, code={}", txnRef, success, responseCode);

        return VNPayReturnResponse.builder()
                .success(success)
                .txnRef(txnRef)
                .responseCode(responseCode)
                .message(message)
                .rawParams(queryParams)
                .build();
    }

    private String generateTxnRef() {
        return UUID.randomUUID().toString().replaceAll("-", "").substring(0, 12);
    }

    private String safe(String value, String def) {
        return (value == null || value.isBlank()) ? def : value.trim();
    }
}

