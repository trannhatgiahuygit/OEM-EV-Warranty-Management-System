package com.ev.warranty.repository;

import com.ev.warranty.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByEmailAndUsername(String email, String username);
    boolean existsByEmailAndId(String email, Integer id);
    List<User> findByRole_RoleName(String roleName);
}
