package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.CustomerRequestDTO;
import com.ev.warranty.model.dto.CustomerResponseDTO;
import com.ev.warranty.model.entity.Customer;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {

    public Customer toEntity(CustomerRequestDTO dto) {
        return Customer.builder()
                .name(dto.getName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .address(dto.getAddress())
                .build();
    }

    public CustomerResponseDTO toDTO(Customer entity) {
        return CustomerResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .address(entity.getAddress())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
