package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.vehicle.VehicleModelDTO;

import java.util.List;

public interface VehicleModelService {
    VehicleModelDTO create(VehicleModelDTO dto, String updatedBy);
    VehicleModelDTO update(Integer id, VehicleModelDTO dto, String updatedBy);
    void delete(Integer id);
    VehicleModelDTO get(Integer id);
    VehicleModelDTO getByCode(String code);
    List<VehicleModelDTO> listAll();
    List<VehicleModelDTO> listActive();
}
