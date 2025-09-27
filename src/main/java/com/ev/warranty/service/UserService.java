package com.ev.warranty.service;

import com.ev.warranty.model.entity.User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public interface UserService {
    User create(User user);

    Optional<User> findByUsername(String username);
    // các hàm CRUD khác
}

