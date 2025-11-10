package com.ev.warranty.util;

import jakarta.servlet.http.HttpServletRequest;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class VNPayUtils {

    public static String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hash.append(String.format("%02x", b));
            }
            return hash.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Error generating HMAC SHA512 signature", e);
        }
    }

    public static String buildQueryString(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        try {
            for (Iterator<Map.Entry<String, String>> it = params.entrySet().iterator(); it.hasNext(); ) {
                Map.Entry<String, String> entry = it.next();
                sb.append(URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII.toString()));
                sb.append('=');
                sb.append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII.toString()));
                if (it.hasNext()) sb.append('&');
            }
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
        return sb.toString();
    }

    public static SortedMap<String, String> sortAndFilter(Map<String, String> params) {
        SortedMap<String, String> sorted = new TreeMap<>();
        for (Map.Entry<String, String> e : params.entrySet()) {
            String k = e.getKey();
            String v = e.getValue();
            if (v != null && !v.isEmpty() && !k.equalsIgnoreCase("vnp_SecureHash") && !k.equalsIgnoreCase("vnp_SecureHashType")) {
                sorted.put(k, v);
            }
        }
        return sorted;
    }

    public static String getIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty()) {
            return ip.split(",")[0].trim();
        }
        ip = request.getHeader("X-Real-IP");
        return (ip != null && !ip.isEmpty()) ? ip : request.getRemoteAddr();
    }

    public static boolean verifySignature(Map<String, String> allParams, String secret) {
        SortedMap<String, String> sorted = sortAndFilter(allParams);
        String data = buildQueryString(sorted);
        String expected = hmacSHA512(secret, data);
        String provided = allParams.get("vnp_SecureHash");
        return expected.equalsIgnoreCase(provided);
    }
}

