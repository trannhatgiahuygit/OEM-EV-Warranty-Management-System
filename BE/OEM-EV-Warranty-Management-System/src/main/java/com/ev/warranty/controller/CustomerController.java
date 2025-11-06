package com.ev.warranty.controller;

import com.ev.warranty.model.dto.customer.CustomerRequestDTO;
import com.ev.warranty.model.dto.customer.CustomerResponseDTO;
import com.ev.warranty.service.inter.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    /**
     * Get all customers
     * Available to: SC_STAFF, EVM_STAFF, ADMIN, SC_TECHNICIAN
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_EVM_STAFF', 'ROLE_ADMIN', 'ROLE_SC_TECHNICIAN')")
    public ResponseEntity<List<CustomerResponseDTO>> getAllCustomers() {
        List<CustomerResponseDTO> customers = customerService.getAllCustomers();
        return ResponseEntity.ok(customers);
    }

    /**
     * Search customer by phone number
     * Available to: SC_STAFF, EVM_STAFF, ADMIN
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<CustomerResponseDTO> getCustomerByPhone(@RequestParam String phone) {
        Optional<CustomerResponseDTO> customer = customerService.findByPhone(phone);
        return customer
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());

    }

    /**
     * Create a new customer
     * Available to: SC_STAFF, EVM_STAFF, ADMIN
     */
    @PostMapping("/create")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<CustomerResponseDTO> createCustomer(@Valid @RequestBody CustomerRequestDTO requestDTO) {
        CustomerResponseDTO createdCustomer = customerService.createCustomer(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCustomer);
    }

    /**
     * Get customer by ID
     * Available to: SC_STAFF, EVM_STAFF, ADMIN
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<CustomerResponseDTO> getCustomerById(@PathVariable Integer id) {
        CustomerResponseDTO customer = customerService.findById(id);
        return ResponseEntity.ok(customer);
    }

    /**
     * Update customer by ID
     * Available to: SC_STAFF, ADMIN
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<CustomerResponseDTO> updateCustomer(@PathVariable Integer id, @Valid @RequestBody CustomerRequestDTO requestDTO) {
        CustomerResponseDTO updatedCustomer = customerService.updateCustomer(id, requestDTO);
        return ResponseEntity.ok(updatedCustomer);
    }
}