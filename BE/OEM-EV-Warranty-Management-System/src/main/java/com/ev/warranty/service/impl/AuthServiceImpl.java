package com.ev.warranty.service.impl;


import com.ev.warranty.model.dto.auth.AuthResponseDTO;
import com.ev.warranty.model.dto.auth.LoginRequestDTO;
import com.ev.warranty.model.dto.auth.RegisterRequestDTO;
import com.ev.warranty.model.entity.Role;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.RoleRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.ServiceCenterRepository;
import com.ev.warranty.security.JwtUtil;
import com.ev.warranty.service.inter.AuthService;
import com.ev.warranty.mapper.UserMapper;
import com.ev.warranty.exception.BadRequestException;
import com.ev.warranty.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ServiceCenterRepository serviceCenterRepository;
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

        // Validate and find role by name
        if (request.getRoleName() == null || request.getRoleName().isEmpty()) {
            throw new BadRequestException("Role name must be provided");
        }

        Role userRole = roleRepository.findByRoleName(request.getRoleName())
                .orElseThrow(() -> new NotFoundException("Role not found: " + request.getRoleName()));

        // Validate serviceCenterId for SC_STAFF and SC_TECHNICIAN roles
        if ("SC_STAFF".equals(request.getRoleName()) || "SC_TECHNICIAN".equals(request.getRoleName())) {
            if (request.getServiceCenterId() == null) {
                throw new BadRequestException("Service center ID is required for " + request.getRoleName() + " role");
            }
            // Validate that service center exists
            serviceCenterRepository.findById(request.getServiceCenterId())
                    .orElseThrow(() -> new NotFoundException("Service center not found with id: " + request.getServiceCenterId()));
        }

        // Create new user
        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(userRole); // Ensure the correct role is set

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

        // Check if user is active
        if (user.getActive() == null || !user.getActive()) {
            throw new BadRequestException("User account is inactive. Please contact administrator.");
        }

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid password");
        }

        // Generate JWT token
        String token = jwtUtil.generateTokenFromUsername(user.getUsername());

        // Use UserMapper to create response
        return userMapper.toResponse(user, token);
    }
}