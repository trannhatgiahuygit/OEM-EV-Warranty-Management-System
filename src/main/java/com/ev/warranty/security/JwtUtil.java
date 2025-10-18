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

    @Value("${spring.app.jwtExpirationSec}")
    private int jwtExpirationSec; // Thời gian sống của token (tính bằng giây)

    @Value("${spring.app.secret}")
    private String secret;

    // Authorization: Bearer <token>
    public String getTokenFromRequest(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        log.debug("Authorize token: {}", token);
        if (token != null && token.startsWith("Bearer ")) {
            return token.substring(7);
        }
        return null;
    }

    public String generateTokenFromUsername(String username) {
        long expirationInMs = jwtExpirationSec * 1000L; // ⚠️ đổi giây sang mili-giây
        return JWT.create()
                .withIssuer(issuer)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + expirationInMs))
                .withSubject(username)
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
        try {
            JWTVerifier verifier = JWT.require(Algorithm.HMAC256(secret))
                    .withIssuer(issuer)
                    .build();
            verifier.verify(token);
            return true;
        } catch (Exception e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public String extractUsernameFromRequest(HttpServletRequest request) {
        String token = getTokenFromRequest(request);
        if (token != null && validateToken(token)) {
            return getUsernameFromToken(token);
        }
        return null;
    }
}
