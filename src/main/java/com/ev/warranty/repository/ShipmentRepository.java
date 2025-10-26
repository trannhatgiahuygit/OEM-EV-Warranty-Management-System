package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Integer> {
    
    List<Shipment> findByStatus(String status);
    Page<Shipment> findByStatus(String status, Pageable pageable);
    
    List<Shipment> findByDestinationCenterId(Integer destinationCenterId);
    List<Shipment> findByWarehouseId(Integer warehouseId);
    
    @Query("SELECT s FROM Shipment s WHERE s.status = :status AND s.destinationCenterId = :destinationCenterId")
    List<Shipment> findByStatusAndDestinationCenterId(@Param("status") String status, @Param("destinationCenterId") Integer destinationCenterId);
    
    @Query("SELECT s FROM Shipment s WHERE s.createdBy.username = :createdBy")
    List<Shipment> findByCreatedBy(@Param("createdBy") String createdBy);
    
    @Query("SELECT s FROM Shipment s WHERE s.shippedAt BETWEEN :startDate AND :endDate")
    List<Shipment> findByShippedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT s FROM Shipment s WHERE s.deliveredAt BETWEEN :startDate AND :endDate")
    List<Shipment> findByDeliveredAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT s FROM Shipment s WHERE s.trackingNumber = :trackingNumber")
    Optional<Shipment> findByTrackingNumber(@Param("trackingNumber") String trackingNumber);
    
    @Query("SELECT COUNT(s) FROM Shipment s WHERE s.status = :status")
    Long countByStatus(@Param("status") String status);
    
    @Query("SELECT COUNT(s) FROM Shipment s WHERE s.destinationCenterId = :destinationCenterId AND s.status = :status")
    Long countByDestinationCenterIdAndStatus(@Param("destinationCenterId") Integer destinationCenterId, @Param("status") String status);
}
