package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

    // Find vehicle by VIN for registration and lookup
    Optional<Vehicle> findByVin(String vin);

    // Find vehicles by owner for customer management
    List<Vehicle> findByOwnerId(Integer ownerId);

    // Find vehicles by status
    List<Vehicle> findByStatus(String status);

    // Find vehicles within warranty period
    @Query("SELECT v FROM Vehicle v WHERE v.warrantyEndDate > :currentDate")
    List<Vehicle> findVehiclesInWarranty(@Param("currentDate") LocalDateTime currentDate);

    // Find vehicles by model and year for campaign identification
    List<Vehicle> findByModelAndYear(String model, Integer year);

    // Find vehicles by model in list and year range for campaigns
    @Query("SELECT v FROM Vehicle v WHERE v.model IN :models AND v.year BETWEEN :startYear AND :endYear")
    List<Vehicle> findByModelsAndYearRange(@Param("models") List<String> models,
                                          @Param("startYear") Integer startYear,
                                          @Param("endYear") Integer endYear);

    // Find vehicles by VIN range for campaigns
    @Query("SELECT v FROM Vehicle v WHERE v.vin BETWEEN :startVin AND :endVin")
    List<Vehicle> findByVinRange(@Param("startVin") String startVin, @Param("endVin") String endVin);

    // Count vehicles by status for reporting
    Long countByStatus(String status);

    // Find vehicles with expired warranty
    @Query("SELECT v FROM Vehicle v WHERE v.warrantyEndDate < :currentDate")
    List<Vehicle> findVehiclesWithExpiredWarranty(@Param("currentDate") LocalDateTime currentDate);
}
