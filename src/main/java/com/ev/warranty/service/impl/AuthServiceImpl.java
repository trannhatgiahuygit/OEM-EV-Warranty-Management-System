package com.ev.warranty.service.impl;


import com.ev.warranty.config.SecurityConfig;
import com.ev.warranty.model.dto.AuthResponseDTO;
import com.ev.warranty.model.dto.LoginRequestDTO;
import com.ev.warranty.model.dto.RegisterRequestDTO;
import com.ev.warranty.model.entity.Role;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.RoleRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.security.JwtUtil;
import com.ev.warranty.service.inter.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.ev.warranty.mapper.UserMapper;

import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SecurityConfig passwordEncoder;
    private final JwtUtil jwtUtil;
    private  final UserMapper userMapper;

    @Override
    public AuthResponseDTO register(RegisterRequestDTO request) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        // Find requested role
        Role userRole = roleRepository.findByName(request.getName().trim())
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getName()));

        // Validate role name
        if (!Arrays.asList("SC_STAFF", "SC_TECHNICIAN", "EVM_STAFF", "ADMIN").contains(userRole.getName())) {
            throw new RuntimeException("Invalid role name. Must be one of: SC_STAFF, SC_TECHNICIAN, EVM_STAFF, ADMIN" );
        }

        // Create new user
        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.passwordEncoder().encode(request.getPassword()));
        user.setRole(userRole);

        // Debug: In ra để kiểm tra
        System.out.println("Before save - fullname: " + user.getFullName());

        // Save user
        User savedUser = userRepository.save(user);

        // Debug: In ra để kiểm tra sau khi save
        System.out.println("After save - fullname: " + savedUser.getFullName());

        // Generate JWT token
        String token = jwtUtil.generateTokenFromUsername(savedUser.getUsername());

        // Return auth response
        return new AuthResponseDTO(
                token,
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getRole().getName(),
                savedUser.getCreatedAt()
        );
    }

    @Override
    public AuthResponseDTO login(LoginRequestDTO request) {
        // Find user by username
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate password using passwordEncoder
        if (!passwordEncoder.passwordEncoder().matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid password");
        }

        // Generate JWT token
        String token = jwtUtil.generateTokenFromUsername(user.getUsername());

        // Return auth response with user details
        return new AuthResponseDTO(
                token,
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().getName(),
                user.getCreatedAt()

        );
    }



}