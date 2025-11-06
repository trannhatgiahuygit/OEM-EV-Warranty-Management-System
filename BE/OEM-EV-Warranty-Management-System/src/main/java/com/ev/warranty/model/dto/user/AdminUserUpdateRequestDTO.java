package com.ev.warranty.model.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdminUserUpdateRequestDTO {

    @Size(min = 1, max = 150, message = "Full name must be between 1 and 150 characters")
    private String fullName;

    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @Size(max = 30, message = "Phone number cannot exceed 30 characters")
    private String phone;

    private Integer roleId; // Admin có thể thay đổi role

    private Integer serviceCenterId; // Admin có thể thay đổi service center ID (required for SC_STAFF and SC_TECHNICIAN)

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String newPassword; // Admin có thể reset password mà không cần current password

    private Boolean active; // Admin có thể active/deactive user
}