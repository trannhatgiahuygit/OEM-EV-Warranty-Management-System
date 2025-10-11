package com.ev.warranty.service.impl;

import com.ev.warranty.service.inter.JwtService;
import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtServiceImpl implements JwtService {

    @Value("${spring.app.secret}")
    private String secretKey;

    @Value("${spring.app.jwtExpirationSec}")
    private long jwtExpirationSec; // Thời gian sống của token (tính bằng giây)

    @Override
    public String generateToken(UserDetails userDetails) {
        long expirationInMs = jwtExpirationSec * 1000L; // ⚠️ đổi giây sang mili-giây
        return JWT.create()
                .withSubject(userDetails.getUsername())
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + expirationInMs))
                .sign(Algorithm.HMAC256(secretKey));
    }

    @Override
    public boolean validateToken(String token) {
        try {
            JWTVerifier verifier = JWT.require(Algorithm.HMAC256(secretKey)).build();
            verifier.verify(token);
            return true;
        } catch (JWTVerificationException e) {
            return false;
        }
    }

    @Override
    public String getUsernameFromToken(String token) {
        return JWT.decode(token).getSubject();
    }
}
