package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.policy.WarrantyConditionDTO;

import java.time.LocalDate;
import java.util.List;

public interface WarrantyConditionService {
    WarrantyConditionDTO create(WarrantyConditionDTO condition, String updatedBy);
    WarrantyConditionDTO update(Integer id, WarrantyConditionDTO condition, String updatedBy);
    void delete(Integer id);
    List<WarrantyConditionDTO> listByModel(Integer vehicleModelId);
    List<WarrantyConditionDTO> listEffectiveByModel(Integer vehicleModelId, LocalDate today);
    WarrantyConditionDTO get(Integer id);
}
