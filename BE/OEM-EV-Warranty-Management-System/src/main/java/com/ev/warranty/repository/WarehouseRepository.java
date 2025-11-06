package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Integer> {
    
    Optional<Warehouse> findByName(String name);
    List<Warehouse> findByLocation(String location);
    
    @Query("SELECT w FROM Warehouse w WHERE w.active = true")
    List<Warehouse> findActiveWarehouses();
    
    @Query("SELECT w FROM Warehouse w WHERE w.location LIKE %:location%")
    List<Warehouse> findByLocationContaining(@Param("location") String location);
    
    @Query("SELECT w FROM Warehouse w WHERE w.warehouseType = :type")
    List<Warehouse> findByWarehouseType(@Param("type") String type);
}
