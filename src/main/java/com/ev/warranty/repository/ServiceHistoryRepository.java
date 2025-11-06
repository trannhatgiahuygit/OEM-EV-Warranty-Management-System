package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ServiceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceHistoryRepository extends JpaRepository<ServiceHistory, Integer> {
    List<ServiceHistory> findByVehicle_Id(Integer vehicleId);
    List<ServiceHistory> findByCustomer_Id(Integer customerId);
}

