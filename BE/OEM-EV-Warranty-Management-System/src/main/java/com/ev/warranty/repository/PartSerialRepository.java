package com.ev.warranty.repository;

import com.ev.warranty.model.entity.PartSerial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PartSerialRepository extends JpaRepository<PartSerial, Integer> {
    Optional<PartSerial> findBySerialNumber(String serialNumber);
    boolean existsBySerialNumber(String serialNumber);
    List<PartSerial> findByInstalledOnVehicleId(Integer vehicleId);
    List<PartSerial> findByPartId(Integer partId);
    List<PartSerial> findByStatus(String status);

    @Query("SELECT ps FROM PartSerial ps WHERE ps.installedOnVehicle.id = :vehicleId AND ps.status = 'installed'")
    List<PartSerial> findActivePartsByVehicleId(@Param("vehicleId") Integer vehicleId);

    @Query("SELECT ps FROM PartSerial ps WHERE ps.part.id = :partId AND ps.status = 'in_stock'")
    List<PartSerial> findAvailablePartsByPartId(@Param("partId") Integer partId);
}