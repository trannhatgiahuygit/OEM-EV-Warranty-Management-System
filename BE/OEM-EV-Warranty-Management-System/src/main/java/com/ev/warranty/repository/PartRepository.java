package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PartRepository extends JpaRepository<Part, Integer> {
    Optional<Part> findByPartNumber(String partNumber);
    List<Part> findByCategory(String category);
    boolean existsByPartNumber(String partNumber);

    @Query("SELECT p FROM Part p WHERE p.category = :category ORDER BY p.name")
    List<Part> findByCategoryOrderByName(String category);
}