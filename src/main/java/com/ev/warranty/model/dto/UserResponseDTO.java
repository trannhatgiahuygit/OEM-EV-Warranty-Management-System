package com.ev.warranty.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserResponseDTO {
    private int id;
    private String username;
    private String email;
    private String fullname;
    private String phone;
    private String roleName; // thay vì cả object Role, chỉ cần tên
    private LocalDate createdAt;
    private LocalDate updatedAt;
}
