package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.auth.AuthResponseDTO;
import com.ev.warranty.model.dto.auth.LoginRequestDTO;
import com.ev.warranty.model.dto.auth.RegisterRequestDTO;
import org.springframework.stereotype.Service;

@Service
public interface AuthService {
    AuthResponseDTO register(RegisterRequestDTO request);
    AuthResponseDTO login(LoginRequestDTO request);
}
