package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.CustomerRequestDTO;
import com.ev.warranty.model.dto.CustomerResponseDTO;
import com.ev.warranty.model.entity.Customer;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.CustomerRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.mapper.CustomerMapper;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.service.CustomerService;
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
}
