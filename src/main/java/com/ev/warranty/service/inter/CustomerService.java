package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.customer.CustomerRequestDTO;
import com.ev.warranty.model.dto.customer.CustomerResponseDTO;

import java.util.Optional;
import java.util.List;

public interface CustomerService {
    Optional<CustomerResponseDTO> findByPhone(String phone);
    CustomerResponseDTO createCustomer(CustomerRequestDTO requestDTO);
    CustomerResponseDTO findById(Integer id);
    List<CustomerResponseDTO> getAllCustomers();
    CustomerResponseDTO updateCustomer(Integer id, CustomerRequestDTO requestDTO);
}
