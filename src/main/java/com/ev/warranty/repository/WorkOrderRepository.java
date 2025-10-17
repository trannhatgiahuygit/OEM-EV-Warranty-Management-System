package com.ev.warranty.repository;

import com.ev.warranty.model.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Integer> {

    List<WorkOrder> findByClaimId(Integer claimId);

    List<WorkOrder> findByTechnicianId(Integer technicianId);

    @Query("SELECT wo FROM WorkOrder wo WHERE wo.technician.id = :technicianId AND wo.endTime IS NULL")
    List<WorkOrder> findActiveWorkOrdersByTechnician(@Param("technicianId") Integer technicianId);

    @Query("SELECT wo FROM WorkOrder wo WHERE wo.claim.id = :claimId AND wo.endTime IS NULL")
    List<WorkOrder> findActiveWorkOrdersByClaim(@Param("claimId") Integer claimId);

    @Query("SELECT COUNT(wo) FROM WorkOrder wo WHERE wo.technician.id = :technicianId AND wo.endTime IS NULL")
    Long countActiveWorkOrdersByTechnician(@Param("technicianId") Integer technicianId);
}
