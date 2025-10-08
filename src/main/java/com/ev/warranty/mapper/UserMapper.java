package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.AuthResponseDTO;
import com.ev.warranty.model.dto.RegisterRequestDTO;
import com.ev.warranty.model.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public User toEntity(RegisterRequestDTO dto) {
        return User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .fullName(dto.getFullname())
                .phone(dto.getPhone())
                .build();
    }

    public AuthResponseDTO toResponse(User user, String token) {
        return AuthResponseDTO.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .fullname(user.getFullName())
                .role(user.getRole().getName())
                .token(token)
                .createdAt(user.getCreatedAt())
                .build();
    }
}