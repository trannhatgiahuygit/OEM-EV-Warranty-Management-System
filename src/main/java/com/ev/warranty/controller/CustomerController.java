package com.ev.warranty.controller;

import com.ev.warranty.model.dto.CustomerRequestDTO;
import com.ev.warranty.model.dto.CustomerResponseDTO;
import com.ev.warranty.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<CustomerResponseDTO> getCustomerByPhone(@RequestParam String phone) {
        Optional<CustomerResponseDTO> customer = customerService.findByPhone(phone);
        return customer
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CustomerResponseDTO> createCustomer(@Valid @RequestBody CustomerRequestDTO requestDTO) {
        CustomerResponseDTO createdCustomer = customerService.createCustomer(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCustomer);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponseDTO> getCustomerById(@PathVariable Integer id) {
        CustomerResponseDTO customer = customerService.findById(id);
        return ResponseEntity.ok(customer);
    }
}
