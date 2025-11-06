package com.ev.warranty.model.dto.customer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerResponseDTO {
    private Integer id;
    private String name;
    private String phone;
    private String email;
    private String address;
    private LocalDateTime createdAt;
}
