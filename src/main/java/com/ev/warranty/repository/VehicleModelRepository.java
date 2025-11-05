package com.ev.warranty.repository;

import com.ev.warranty.model.entity.VehicleModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleModelRepository extends JpaRepository<VehicleModel, Integer> {
    Optional<VehicleModel> findByCode(String code);
    List<VehicleModel> findByActiveTrue();
}
