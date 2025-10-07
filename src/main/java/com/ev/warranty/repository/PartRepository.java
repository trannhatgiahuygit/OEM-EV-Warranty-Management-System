package com.ev.warranty.repository;

import com.ev.warranty.model.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PartRepository extends JpaRepository<Part, Integer> {

    // Find part by part number
    Optional<Part> findByPartNumber(String partNumber);

    // Find part by serial number for tracking
    Optional<Part> findBySerialNumber(String serialNumber);

    // Find parts by category
    List<Part> findByCategoryOrderByPartName(String category);

    // Find parts by status
    List<Part> findByStatusOrderByPartName(String status);

    // Find parts installed in specific vehicle
    List<Part> findByInstalledVehicleIdOrderByInstallationDateDesc(Integer vehicleId);

    // Find parts by supplier
    List<Part> findBySupplierOrderByPartName(String supplier);

    // Find parts with low stock
    @Query("SELECT p FROM Part p WHERE p.stockQuantity <= p.minimumStock AND p.status = 'AVAILABLE'")
    List<Part> findPartsWithLowStock();

    // Find parts out of stock
    List<Part> findByStockQuantityAndStatus(Integer stockQuantity, String status);

    // Find parts received in date range
    @Query("SELECT p FROM Part p WHERE p.receivedDate BETWEEN :startDate AND :endDate ORDER BY p.receivedDate DESC")
    List<Part> findPartsReceivedInDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Find parts by warranty period for warranty analysis
    List<Part> findByWarrantyPeriodMonthsOrderByPartName(Integer warrantyPeriodMonths);

    // Find parts installed in date range
    @Query("SELECT p FROM Part p WHERE p.installationDate BETWEEN :startDate AND :endDate ORDER BY p.installationDate DESC")
    List<Part> findPartsInstalledInDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Search parts by name or part number
    @Query("SELECT p FROM Part p WHERE LOWER(p.partName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(p.partNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Part> searchPartsByNameOrNumber(@Param("searchTerm") String searchTerm);

    // Count parts by status for inventory reporting
    Long countByStatus(String status);

    // Find parts needing reorder (low stock + available)
    @Query("SELECT p FROM Part p WHERE p.stockQuantity <= p.minimumStock AND p.status = 'AVAILABLE' ORDER BY p.stockQuantity ASC")
    List<Part> findPartsNeedingReorder();
}
