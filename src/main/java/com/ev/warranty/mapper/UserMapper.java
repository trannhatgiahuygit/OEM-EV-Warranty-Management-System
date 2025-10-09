package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.AuthResponseDTO;
import com.ev.warranty.model.dto.RegisterRequestDTO;
import com.ev.warranty.model.dto.UserUpdateRequestDTO;
import com.ev.warranty.model.dto.UserUpdateResponseDTO;
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

    public UserUpdateResponseDTO toResponse(User user) {
        return UserUpdateResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole().getName())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}