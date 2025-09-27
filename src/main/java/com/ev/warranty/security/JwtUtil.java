package com.ev.warranty.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@Slf4j
public class JwtUtil {
    @Value("${spring.app.issuer}")
    private String issuer;

    @Value("${spring.app.jwtExpirationMs}")
    private int jwtExpirationMs; // Thoi gian song cua token

    @Value("${spring.app.secret}")
    private String secret;
    // Authorization: Bearer ferw346rytr123467ytrgfrefghk734twregfnhmgj,kli75u654trqwdVfbk874653twef

    public String getTokenFromRequest(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        log.debug("Authorize token: {}", token);
        if(token != null && token.startsWith("Bearer ")) {
            return token.substring(7);
        }
        return null;
    }

    public String generateTokenFromUsername(String username) {
        return JWT.create()
                .withIssuer(issuer) // Thang nao lam cai token thi de do day
                .withIssuedAt(new Date()) // Thoi gian tao token. Vi du: 12h30p
                .withExpiresAt(new Date(System.currentTimeMillis() + jwtExpirationMs)) // Thoi gian token se bi vo hieu hoa
                .withSubject(username) // Thuong la ten cua user
                .sign(Algorithm.HMAC256(secret));
    }

    public String getUsernameFromToken(String token) {
        return JWT.require(Algorithm.HMAC256(secret))
                .withIssuer(issuer)
                .build()
                .verify(token)
                .getSubject();
    }

    public boolean validateToken(String token) {
        JWTVerifier verifier;
        try {
            verifier = JWT.require(Algorithm.HMAC256(secret))
                    .withIssuer(issuer)
                    .build();
            verifier.verify(token);
            return true;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


}
