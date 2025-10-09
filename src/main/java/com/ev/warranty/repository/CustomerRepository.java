package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    List<Customer> findByNameContainingIgnoreCase(String name);
    List<Customer> findByCreatedById(Integer createdById);
}