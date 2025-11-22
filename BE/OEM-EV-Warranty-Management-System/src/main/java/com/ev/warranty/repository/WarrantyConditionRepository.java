package com.ev.warranty.repository;

import com.ev.warranty.model.entity.WarrantyCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface WarrantyConditionRepository extends JpaRepository<WarrantyCondition, Integer> {

    @Query("SELECT wc FROM WarrantyCondition wc JOIN FETCH wc.vehicleModel WHERE wc.vehicleModel.id = :modelId")
    List<WarrantyCondition> findByVehicleModel_Id(@Param("modelId") Integer vehicleModelId);

    @Query("SELECT wc FROM WarrantyCondition wc JOIN FETCH wc.vehicleModel WHERE wc.vehicleModel.id = :modelId AND wc.active = true " +
           "AND wc.effectiveFrom <= :today AND (wc.effectiveTo IS NULL OR wc.effectiveTo >= :today) " +
           "ORDER BY wc.updatedAt DESC")
    List<WarrantyCondition> findEffectiveByModel(@Param("modelId") Integer modelId,
                                                 @Param("today") LocalDate today);

    @Query("SELECT wc FROM WarrantyCondition wc JOIN FETCH wc.vehicleModel WHERE wc.active = true " +
           "AND wc.effectiveFrom <= :today AND (wc.effectiveTo IS NULL OR wc.effectiveTo >= :today) " +
           "ORDER BY wc.updatedAt DESC")
    List<WarrantyCondition> findAllEffective(@Param("today") LocalDate today);

    @Query("SELECT wc FROM WarrantyCondition wc JOIN FETCH wc.vehicleModel ORDER BY wc.updatedAt DESC")
    List<WarrantyCondition> findAllWithVehicleModel();

    @Query("SELECT wc FROM WarrantyCondition wc JOIN FETCH wc.vehicleModel WHERE wc.id = :id")
    java.util.Optional<WarrantyCondition> findByIdWithVehicleModel(@Param("id") Integer id);
}

