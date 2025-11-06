package com.ev.warranty.model.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserUpdateResponseDTO {
    private Integer id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private Boolean active;
    private Integer serviceCenterId; // Service center ID for SC_STAFF and SC_TECHNICIAN
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}