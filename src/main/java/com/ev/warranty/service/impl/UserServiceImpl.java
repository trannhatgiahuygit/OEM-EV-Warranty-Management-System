package com.ev.warranty.service.impl;

import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.service.UserService;

import java.util.Optional;

public class UserServiceImpl implements UserService {
    private UserRepository userRepository;

    @Override
    public User create(User user) {
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
