package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.auth.AuthResponseDTO;
import com.ev.warranty.model.dto.auth.RegisterRequestDTO;
import com.ev.warranty.model.dto.user.UserUpdateResponseDTO;
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
                .role(user.getRole().getRoleName())
                .token(token)
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserUpdateResponseDTO toResponse(User user) {
        return UserUpdateResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole().getRoleName())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}