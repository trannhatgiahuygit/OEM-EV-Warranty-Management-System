package com.ev.warranty.repository;

import com.ev.warranty.model.entity.WorkOrderPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderPartRepository extends JpaRepository<WorkOrderPart, Integer> {

    List<WorkOrderPart> findByWorkOrderId(Integer workOrderId);

    @Query("SELECT wop FROM WorkOrderPart wop WHERE wop.workOrder.claim.id = :claimId")
    List<WorkOrderPart> findByClaimId(@Param("claimId") Integer claimId);

    @Query("SELECT wop FROM WorkOrderPart wop WHERE wop.partSerial.id = :partSerialId")
    List<WorkOrderPart> findByPartSerialId(@Param("partSerialId") Integer partSerialId);
}
