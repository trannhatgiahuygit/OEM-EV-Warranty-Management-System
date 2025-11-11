package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Inventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Integer> {
    
    List<Inventory> findByPartId(Integer partId);
    List<Inventory> findByWarehouseId(Integer warehouseId);
    Page<Inventory> findByWarehouseId(Integer warehouseId, Pageable pageable);
    
    Optional<Inventory> findByPartIdAndWarehouseId(Integer partId, Integer warehouseId);
    
    @Query("SELECT i FROM Inventory i WHERE i.currentStock <= i.minimumStock AND i.currentStock > 0")
    List<Inventory> findLowStockItems();
    
    @Query("SELECT i FROM Inventory i WHERE i.currentStock = 0")
    List<Inventory> findOutOfStockItems();
    
    @Query("SELECT i FROM Inventory i WHERE i.currentStock <= i.minimumStock")
    List<Inventory> findStockAlerts();
    
    @Query("SELECT i FROM Inventory i WHERE i.part.category = :category")
    List<Inventory> findByPartCategory(@Param("category") String category);
    
    @Query("SELECT i FROM Inventory i WHERE i.part.name LIKE %:search% OR i.part.partNumber LIKE %:search%")
    List<Inventory> findByPartNameOrNumber(@Param("search") String search);
    
    @Query("SELECT i FROM Inventory i WHERE i.warehouse.id = :warehouseId AND i.currentStock <= i.minimumStock")
    List<Inventory> findLowStockByWarehouse(@Param("warehouseId") Integer warehouseId);
    
    @Query("SELECT SUM(i.currentStock) FROM Inventory i WHERE i.part.id = :partId")
    Long getTotalStockByPartId(@Param("partId") Integer partId);
    
    @Query("SELECT SUM(i.reservedStock) FROM Inventory i WHERE i.part.id = :partId")
    Long getTotalReservedStockByPartId(@Param("partId") Integer partId);
}
