package com.ev.warranty.repository;

import com.ev.warranty.model.entity.StockReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StockReservationRepository extends JpaRepository<StockReservation, Integer> {

    List<StockReservation> findByClaimId(Integer claimId);

    List<StockReservation> findByWorkOrderId(Integer workOrderId);

    @Query("SELECT sr FROM StockReservation sr WHERE sr.claim.id = :claimId OR sr.workOrder.id = :workOrderId")
    List<StockReservation> findByClaimOrWorkOrder(@Param("claimId") Integer claimId,
                                                  @Param("workOrderId") Integer workOrderId);
}

