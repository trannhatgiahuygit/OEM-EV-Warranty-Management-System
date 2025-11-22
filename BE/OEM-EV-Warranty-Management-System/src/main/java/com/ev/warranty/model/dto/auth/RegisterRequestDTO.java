package com.ev.warranty.model.dto.auth;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RegisterRequestDTO {
    
    @NotBlank(message = "Username is required")
    @Size(min = 4, message = "Username must be at least 4 characters")
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be in valid format")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
        message = "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
    )
    private String password;
    
    private String fullname;
    
    @NotBlank(message = "Phone is required")
    @Size(min = 10, max = 10, message = "Phone must be exactly 10 characters")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must contain only digits")
    private String phone;
    
    @NotBlank(message = "Role name is required")
    @Pattern(
        regexp = "^(SC_STAFF|SC_TECHNICIAN|EVM_STAFF)$",
        message = "Role name must be one of: SC_STAFF, SC_TECHNICIAN, EVM_STAFF"
    )
    private String roleName;
    
    private Integer serviceCenterId; // Required for SC_STAFF and SC_TECHNICIAN roles
}
