package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {
    Optional<Vehicle> findByVin(String vin);
    boolean existsByVin(String vin);
    List<Vehicle> findByCustomerId(Integer customerId);

    @Query("SELECT v FROM Vehicle v WHERE v.customer.id = :customerId ORDER BY v.createdAt DESC")
    List<Vehicle> findByCustomerIdOrderByCreatedAtDesc(@Param("customerId") Integer customerId);

    @Query("SELECT v FROM Vehicle v WHERE v.warrantyEnd >= :currentDate")
    List<Vehicle> findVehiclesWithActiveWarranty(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT v FROM Vehicle v WHERE v.warrantyEnd BETWEEN :startDate AND :endDate")
    List<Vehicle> findVehiclesWithWarrantyExpiringBetween(@Param("startDate") LocalDate startDate,
                                                          @Param("endDate") LocalDate endDate);
}