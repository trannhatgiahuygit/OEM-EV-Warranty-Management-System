package com.ev.warranty.service.impl;


import com.ev.warranty.model.dto.auth.AuthResponseDTO;
import com.ev.warranty.model.dto.auth.LoginRequestDTO;
import com.ev.warranty.model.dto.auth.RegisterRequestDTO;
import com.ev.warranty.model.entity.Role;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.RoleRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.security.JwtUtil;
import com.ev.warranty.service.inter.AuthService;
import com.ev.warranty.mapper.UserMapper;
import com.ev.warranty.exception.BadRequestException;
import com.ev.warranty.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;

    @Override
    public AuthResponseDTO register(RegisterRequestDTO request) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        // Find default role (SC_STAFF) or get from request if available
        String roleName = determineRoleName(request);
        Role userRole = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new NotFoundException("Role not found: " + roleName));

        // Validate role name
        if (!Arrays.asList("SC_STAFF", "SC_TECHNICIAN", "EVM_STAFF", "ADMIN").contains(userRole.getRoleName())) {
            throw new BadRequestException("Invalid role name. Must be one of: SC_STAFF, SC_TECHNICIAN, EVM_STAFF, ADMIN");
        }

        // Create new user
        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(userRole);

        // Save user
        User savedUser = userRepository.save(user);

        // Generate JWT token
        String token = jwtUtil.generateTokenFromUsername(savedUser.getUsername());

        // Use UserMapper to create response
        return userMapper.toResponse(savedUser, token);
    }

    @Override
    public AuthResponseDTO login(LoginRequestDTO request) {
        // Find user by username
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid password");
        }

        // Generate JWT token
        String token = jwtUtil.generateTokenFromUsername(user.getUsername());

        // Use UserMapper to create response
        return userMapper.toResponse(user, token);
    }

    private String determineRoleName(RegisterRequestDTO request) {
        // If role is specified in request, use it; otherwise default to SC_STAFF
        return request.getRoleName() != null && !request.getRoleName().isEmpty()
                ? request.getRoleName()
                : "SC_STAFF"; // Default role for new registrations
    }
}