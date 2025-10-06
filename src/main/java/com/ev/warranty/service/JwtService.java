package com.ev.warranty.service;

import org.springframework.security.core.userdetails.UserDetails;

public interface JwtService {
    String generateToken(UserDetails userDetails);
    boolean validateToken(String token);
    String getUsernameFromToken(String token);
}
