package com.ev.warranty.controller;

import com.ev.warranty.model.dto.user.AdminUserUpdateRequestDTO;
import com.ev.warranty.model.dto.user.UserUpdateRequestDTO;
import com.ev.warranty.model.dto.user.UserUpdateResponseDTO;
import com.ev.warranty.service.inter.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ========== PROFILE ENDPOINTS (All authenticated users) ==========

    @GetMapping("/profile")
    public ResponseEntity<UserUpdateResponseDTO> getCurrentUserProfile(Authentication authentication) {
        String username = authentication.getName();
        UserUpdateResponseDTO profile = userService.getCurrentUserProfile(username);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserUpdateResponseDTO> updateProfile(
            @Valid @RequestBody UserUpdateRequestDTO request,
            Authentication authentication) {

        String username = authentication.getName();
        UserUpdateResponseDTO updatedUser = userService.updateProfile(username, request);
        return ResponseEntity.ok(updatedUser);
    }

    // ========== ADMIN ENDPOINTS (Admin only) ==========

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<UserUpdateResponseDTO>> getAllUsers() {
        List<UserUpdateResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserUpdateResponseDTO> getUserById(@PathVariable Integer userId) {
        UserUpdateResponseDTO user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserUpdateResponseDTO> adminUpdateUser(
            @PathVariable Integer userId,
            @Valid @RequestBody AdminUserUpdateRequestDTO request) {

        UserUpdateResponseDTO updatedUser = userService.adminUpdateUser(userId, request);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/technical")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SC_STAFF')")
    public ResponseEntity<List<UserUpdateResponseDTO>> getTechnicalUsers() {
        List<UserUpdateResponseDTO> users = userService.getUsersByRole("technical");
        return ResponseEntity.ok(users);
    }
}