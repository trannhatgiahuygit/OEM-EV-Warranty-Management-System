package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {
    @Query("SELECT v FROM Vehicle v LEFT JOIN FETCH v.vehicleModel WHERE v.vin = :vin")
    Optional<Vehicle> findByVin(@Param("vin") String vin);
    
    boolean existsByVin(String vin);
    List<Vehicle> findByCustomerId(Integer customerId);

    @Query("SELECT v FROM Vehicle v LEFT JOIN FETCH v.vehicleModel WHERE v.customer.id = :customerId ORDER BY v.createdAt DESC")
    List<Vehicle> findByCustomerIdOrderByCreatedAtDesc(@Param("customerId") Integer customerId);

    @Query("SELECT v FROM Vehicle v LEFT JOIN FETCH v.vehicleModel WHERE v.warrantyEnd >= :currentDate")
    List<Vehicle> findVehiclesWithActiveWarranty(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT v FROM Vehicle v LEFT JOIN FETCH v.vehicleModel WHERE v.warrantyEnd BETWEEN :startDate AND :endDate")
    List<Vehicle> findVehiclesWithWarrantyExpiringBetween(@Param("startDate") LocalDate startDate,
                                                          @Param("endDate") LocalDate endDate);
    
    @Query("SELECT v FROM Vehicle v LEFT JOIN FETCH v.vehicleModel")
    @Override
    @NonNull
    List<Vehicle> findAll();
    
    @Query("SELECT v FROM Vehicle v LEFT JOIN FETCH v.vehicleModel WHERE v.vehicleModel IS NOT NULL AND v.vehicleModel.type = :vehicleType")
    List<Vehicle> findByVehicleType(@Param("vehicleType") String vehicleType);
    
    @Query("SELECT v FROM Vehicle v LEFT JOIN FETCH v.vehicleModel WHERE v.id = :id")
    @Override
    @NonNull
    Optional<Vehicle> findById(@Param("id") @NonNull Integer id);
}