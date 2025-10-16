package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.user.AdminUserUpdateRequestDTO;
import com.ev.warranty.model.dto.user.UserUpdateRequestDTO;
import com.ev.warranty.model.dto.user.UserUpdateResponseDTO;
import com.ev.warranty.model.entity.User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public interface UserService {
    User create(User user);

    Optional<User> findByUsername(String username);
    // Self-update profile
    UserUpdateResponseDTO updateProfile(String username, UserUpdateRequestDTO request);
    UserUpdateResponseDTO getCurrentUserProfile(String username);

    // Admin functions
    List<UserUpdateResponseDTO> getAllUsers();
    UserUpdateResponseDTO getUserById(Integer userId);
    UserUpdateResponseDTO adminUpdateUser(Integer userId, AdminUserUpdateRequestDTO request);
    void deleteUser(Integer userId);
}

