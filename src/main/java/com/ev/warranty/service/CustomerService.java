package com.ev.warranty.service;

import com.ev.warranty.model.dto.CustomerRequestDTO;
import com.ev.warranty.model.dto.CustomerResponseDTO;

import java.util.Optional;
import java.util.List;

public interface CustomerService {
    Optional<CustomerResponseDTO> findByPhone(String phone);
    CustomerResponseDTO createCustomer(CustomerRequestDTO requestDTO);
    CustomerResponseDTO findById(Integer id);
    List<CustomerResponseDTO> getAllCustomers();
}
