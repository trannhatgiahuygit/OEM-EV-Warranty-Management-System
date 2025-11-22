package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.customer.CustomerRequestDTO;
import com.ev.warranty.model.dto.customer.CustomerResponseDTO;
import com.ev.warranty.model.entity.Customer;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.CustomerRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.mapper.CustomerMapper;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.service.inter.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final CustomerMapper customerMapper;

    public Optional<CustomerResponseDTO> findByPhone(String phone) {
        System.out.println("Searching for phone: " + phone); // Debug log
        Optional<Customer> customer = customerRepository.findByPhone(phone);
        System.out.println("Found customer: " + customer.isPresent()); // Debug log
        return customer.map(customerMapper::toDTO);
    }

    public CustomerResponseDTO createCustomer(CustomerRequestDTO requestDTO) {
        // Check for duplicate phone
        if (customerRepository.existsByPhone(requestDTO.getPhone())) {
            throw new ValidationException("Số điện thoại '" + requestDTO.getPhone() + "' đã được sử dụng bởi khách hàng khác.");
        }

        // Check for duplicate email (if provided)
        if (requestDTO.getEmail() != null && !requestDTO.getEmail().trim().isEmpty()) {
            if (customerRepository.existsByEmail(requestDTO.getEmail())) {
                throw new ValidationException("Email '" + requestDTO.getEmail() + "' đã được sử dụng bởi khách hàng khác.");
            }
        }

        Customer customer = customerMapper.toEntity(requestDTO);

        // Set the current authenticated user as the creator
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new NotFoundException("Current user not found"));
        customer.setCreatedBy(currentUser);

        Customer savedCustomer = customerRepository.save(customer);
        return customerMapper.toDTO(savedCustomer);
    }

    public CustomerResponseDTO findById(Integer id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Customer not found with id: " + id));
        return customerMapper.toDTO(customer);
    }

    @Override
    public List<CustomerResponseDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(customerMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CustomerResponseDTO updateCustomer(Integer id, CustomerRequestDTO requestDTO) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Customer not found with id: " + id));

        // Check for duplicate phone (excluding current customer)
        Optional<Customer> existingCustomerByPhone = customerRepository.findByPhone(requestDTO.getPhone());
        if (existingCustomerByPhone.isPresent() && !existingCustomerByPhone.get().getId().equals(id)) {
            throw new ValidationException("Số điện thoại '" + requestDTO.getPhone() + "' đã được sử dụng bởi khách hàng khác.");
        }

        // Check for duplicate email (excluding current customer, if provided)
        if (requestDTO.getEmail() != null && !requestDTO.getEmail().trim().isEmpty()) {
            Optional<Customer> existingCustomerByEmail = customerRepository.findByEmail(requestDTO.getEmail());
            if (existingCustomerByEmail.isPresent() && !existingCustomerByEmail.get().getId().equals(id)) {
                throw new ValidationException("Email '" + requestDTO.getEmail() + "' đã được sử dụng bởi khách hàng khác.");
            }
        }

        // Cập nhật các trường từ requestDTO
        customer.setName(requestDTO.getName());
        customer.setEmail(requestDTO.getEmail());
        customer.setPhone(requestDTO.getPhone());
        customer.setAddress(requestDTO.getAddress());
        // Có thể bổ sung cập nhật các trường khác nếu cần
        Customer updatedCustomer = customerRepository.save(customer);
        return customerMapper.toDTO(updatedCustomer);
    }
}
