package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClaimStatusRepository extends JpaRepository<ClaimStatus, Integer> {
    Optional<ClaimStatus> findByCode(String code);
    boolean existsByCode(String code);
}
