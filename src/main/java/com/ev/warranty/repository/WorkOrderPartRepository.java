package com.ev.warranty.repository;

import com.ev.warranty.model.entity.WorkOrderPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WorkOrderPartRepository extends JpaRepository<WorkOrderPart, Integer> {

    List<WorkOrderPart> findByWorkOrderId(Integer workOrderId);

    @Query("SELECT wop FROM WorkOrderPart wop " +
            "JOIN wop.workOrder wo " +
            "JOIN wo.claim c " +
            "WHERE c.createdAt BETWEEN :startDate AND :endDate")
    List<WorkOrderPart> findByClaimDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT wop FROM WorkOrderPart wop " +
            "JOIN wop.part p " +
            "WHERE p.category = :category")
    List<WorkOrderPart> findByPartCategory(@Param("category") String category);

    @Query("SELECT wop FROM WorkOrderPart wop " +
            "JOIN wop.workOrder wo " +
            "JOIN wo.claim c " +
            "JOIN c.vehicle v " +
            "WHERE v.model = :model")
    List<WorkOrderPart> findByVehicleModel(@Param("model") String model);
}
