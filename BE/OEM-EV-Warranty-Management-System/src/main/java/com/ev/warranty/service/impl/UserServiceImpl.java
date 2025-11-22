package com.ev.warranty.service.impl;

import com.ev.warranty.config.SecurityConfig;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.mapper.UserMapper;
import com.ev.warranty.model.dto.user.AdminUserUpdateRequestDTO;
import com.ev.warranty.model.dto.user.UserUpdateRequestDTO;
import com.ev.warranty.model.dto.user.UserUpdateResponseDTO;
import com.ev.warranty.model.entity.Role;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.RoleRepository;
import com.ev.warranty.repository.ServiceCenterRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.service.inter.UserService;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final SecurityConfig config;
    private final RoleRepository roleRepository;
    private final ServiceCenterRepository serviceCenterRepository;

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
    public List<UserUpdateResponseDTO> getUsersByCurrentUserServiceCenter() {
        Integer serviceCenterId = getCurrentUserServiceCenterId();
        if (serviceCenterId == null) {
            log.warn("Current user does not have a service center assigned. Returning empty user list.");
            return List.of();
        }
        List<User> users = userRepository.findByServiceCenterId(serviceCenterId);
        log.debug("Found {} users in service center {}", users.size(), serviceCenterId);
        return users.stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get current user's service center ID from security context
     */
    private Integer getCurrentUserServiceCenterId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) {
                return null;
            }
            String username = auth.getName();
            User user = userRepository.findByUsername(username)
                    .orElse(null);
            if (user == null) {
                return null;
            }
            return user.getServiceCenterId();
        } catch (Exception e) {
            log.warn("Could not get current user service center: {}", e.getMessage());
            return null;
        }
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
        Role newRole = user.getRole(); // Keep current role by default
        if (request.getRoleId() != null) {
            newRole = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new NotFoundException("Role not found with id: " + request.getRoleId()));
            user.setRole(newRole);
        }

        // Admin can update service center ID
        // Validate serviceCenterId for SC_STAFF and SC_TECHNICIAN roles
        String roleName = newRole.getRoleName();
        if ("SC_STAFF".equals(roleName) || "SC_TECHNICIAN".equals(roleName)) {
            if (request.getServiceCenterId() == null) {
                // If serviceCenterId is null and user doesn't have one, require it
                if (user.getServiceCenterId() == null) {
                    throw new BadRequestException("Service center ID is required for " + roleName + " role");
                }
                // If user already has one and request doesn't provide new one, keep existing
            } else {
                // Validate that service center exists
                serviceCenterRepository.findById(request.getServiceCenterId())
                        .orElseThrow(() -> new NotFoundException("Service center not found with id: " + request.getServiceCenterId()));
                user.setServiceCenterId(request.getServiceCenterId());
            }
        } else {
            // For non-SC roles, serviceCenterId should be null
            if (request.getServiceCenterId() != null) {
                throw new BadRequestException("Service center ID can only be assigned to SC_STAFF and SC_TECHNICIAN roles");
            }
            user.setServiceCenterId(null);
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

    @Override
    public List<UserUpdateResponseDTO> getUsersByRole(String roleName) {
        // Ensure the role name matches SC_TECHNICIAN
        if ("technical".equals(roleName)) {
            roleName = "SC_TECHNICIAN";
        }
        List<User> users = userRepository.findByRole_RoleName(roleName);
        return users.stream().map(userMapper::toResponse).collect(Collectors.toList());
    }
}