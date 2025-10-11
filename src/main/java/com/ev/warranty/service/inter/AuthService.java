package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.AuthResponseDTO;
import com.ev.warranty.model.dto.LoginRequestDTO;
import com.ev.warranty.model.dto.RegisterRequestDTO;
import org.springframework.stereotype.Service;

@Service
public interface AuthService {
    AuthResponseDTO register(RegisterRequestDTO request);
    AuthResponseDTO login(LoginRequestDTO request);
}
