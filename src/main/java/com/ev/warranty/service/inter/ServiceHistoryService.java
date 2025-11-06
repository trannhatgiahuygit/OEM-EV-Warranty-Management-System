package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.servicehistory.ServiceHistoryRequestDTO;
import com.ev.warranty.model.dto.servicehistory.ServiceHistoryResponseDTO;

import java.util.List;

public interface ServiceHistoryService {
    ServiceHistoryResponseDTO createServiceHistory(ServiceHistoryRequestDTO requestDTO);
    List<ServiceHistoryResponseDTO> getServiceHistoryByVehicle(Integer vehicleId);
    List<ServiceHistoryResponseDTO> getServiceHistoryByCustomer(Integer customerId);
}

