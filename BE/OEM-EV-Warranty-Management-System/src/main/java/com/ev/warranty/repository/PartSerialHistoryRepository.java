package com.ev.warranty.repository;

import com.ev.warranty.model.entity.PartSerialHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PartSerialHistoryRepository extends JpaRepository<PartSerialHistory, Integer> {
    List<PartSerialHistory> findByPartSerialIdOrderByCreatedAtDesc(Integer partSerialId);

    List<PartSerialHistory> findByVehicleIdOrderByCreatedAtDesc(Integer vehicleId);

    @Query("SELECT psh FROM PartSerialHistory psh WHERE psh.partSerial.serialNumber = :serialNumber ORDER BY psh.createdAt DESC")
    List<PartSerialHistory> findBySerialNumberOrderByCreatedAtDesc(@Param("serialNumber") String serialNumber);
}

