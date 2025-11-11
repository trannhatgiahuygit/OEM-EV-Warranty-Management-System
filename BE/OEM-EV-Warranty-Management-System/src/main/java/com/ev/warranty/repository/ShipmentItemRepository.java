package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ShipmentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentItemRepository extends JpaRepository<ShipmentItem, Integer> {
    
    List<ShipmentItem> findByShipmentId(Integer shipmentId);
    List<ShipmentItem> findByPartId(Integer partId);
    
    @Query("SELECT si FROM ShipmentItem si WHERE si.shipment.id = :shipmentId AND si.part.id = :partId")
    Optional<ShipmentItem> findByShipmentIdAndPartId(@Param("shipmentId") Integer shipmentId, @Param("partId") Integer partId);
    
    @Query("SELECT SUM(si.quantity) FROM ShipmentItem si WHERE si.part.id = :partId")
    Long getTotalQuantityByPartId(@Param("partId") Integer partId);
    
    @Query("SELECT si FROM ShipmentItem si WHERE si.shipment.status = :status")
    List<ShipmentItem> findByShipmentStatus(@Param("status") String status);
    
    @Query("SELECT si FROM ShipmentItem si WHERE si.shipment.destinationCenterId = :destinationCenterId")
    List<ShipmentItem> findByDestinationCenterId(@Param("destinationCenterId") Integer destinationCenterId);
}
