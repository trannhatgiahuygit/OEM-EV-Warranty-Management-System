package com.ev.warranty.service.impl;

import com.ev.warranty.config.SecurityConfig;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.mapper.UserMapper;
import com.ev.warranty.model.dto.AdminUserUpdateRequestDTO;
import com.ev.warranty.model.dto.UserUpdateRequestDTO;
import com.ev.warranty.model.dto.UserUpdateResponseDTO;
import com.ev.warranty.model.entity.Role;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.RoleRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.service.inter.UserService;
import com.ev.warranty.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final SecurityConfig config;
    private final RoleRepository roleRepository;

    @Override
    public User create(User user) {
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    @Transactional
    public UserUpdateResponseDTO updateProfile(String username, UserUpdateRequestDTO request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        // Update basic fields
        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName());
        }

        if (StringUtils.hasText(request.getEmail())) {
            // Check email uniqueness
            if (userRepository.existsByEmailAndUsername(request.getEmail(), username)) {
                throw new ValidationException("Email is already in use by another user");
            }
            user.setEmail(request.getEmail());
        }

        if (StringUtils.hasText(request.getPhone())) {
            user.setPhone(request.getPhone());
        }

        // Password change validation
        if (StringUtils.hasText(request.getNewPassword())) {
            if (!StringUtils.hasText(request.getCurrentPassword())) {
                throw new ValidationException("Current password is required to change password");
            }

            // Verify current password
            if (!config.passwordEncoder().matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new ValidationException("Current password is incorrect");
            }

            // Set new password
            user.setPasswordHash(config.passwordEncoder().encode(request.getNewPassword()));
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toResponse(updatedUser);
    }

    @Override
    public UserUpdateResponseDTO getCurrentUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        return userMapper.toResponse(user);
    }

    @Override
    public List<UserUpdateResponseDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserUpdateResponseDTO getUserById(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));

        return userMapper.toResponse(user);
    }

    @Override
    public UserUpdateResponseDTO adminUpdateUser(Integer userId, AdminUserUpdateRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));

        // Update basic fields
        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName());
        }

        if (StringUtils.hasText(request.getEmail())) {
            // Check email uniqueness
            if (userRepository.existsByEmailAndId(request.getEmail(), userId)) {
                throw new ValidationException("Email is already in use by another user");
            }
            user.setEmail(request.getEmail());
        }

        if (StringUtils.hasText(request.getPhone())) {
            user.setPhone(request.getPhone());
        }

        // Admin can change role
        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new NotFoundException("Role not found with id: " + request.getRoleId()));
            user.setRole(role);
        }

        // Admin can reset password without current password
        if (StringUtils.hasText(request.getNewPassword())) {
            user.setPasswordHash(config.passwordEncoder().encode(request.getNewPassword()));
        }

        // Admin can activate/deactivate user
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));

        user.setActive(false);
        userRepository.save(user);

    }

}