package com.ev.warranty.service.impl;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.model.entity.WarrantyCondition;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.VehicleRepository;
import com.ev.warranty.repository.VehicleModelRepository;
import com.ev.warranty.repository.WarrantyConditionRepository;
import com.ev.warranty.service.inter.WarrantyEligibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WarrantyEligibilityServiceImpl implements WarrantyEligibilityService {

    private final VehicleRepository vehicleRepository;
    private final ClaimRepository claimRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final WarrantyConditionRepository warrantyConditionRepository;

    @Override
    public Result checkByVehicleId(Integer vehicleId) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new NotFoundException("Vehicle not found"));
        return evaluate(v);
    }

    @Override
    public Result checkByClaimId(Integer claimId) {
        Claim c = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));
        if (c.getVehicle() == null) throw new NotFoundException("Claim has no vehicle linked");
        // Hibernate lazy safeguard
        c.getVehicle().getVin();
        return evaluate(c.getVehicle());
    }

    private Result evaluate(Vehicle v) {
        List<String> reasons = new ArrayList<>();
        boolean eligible = true;
        Integer appliedYears = null;
        Integer appliedKm = null;

        LocalDate today = LocalDate.now();
        if (v.getWarrantyEnd() == null) {
            eligible = false;
            reasons.add("Missing warranty end date");
        } else if (!v.getWarrantyEnd().isAfter(today)) {
            eligible = false;
            reasons.add("Warranty expired on " + v.getWarrantyEnd());
        }

        // Try apply model-specific conditions if any
        if (v.getModel() != null) {
            // Find model by name or code best-effort
            var models = vehicleModelRepository.findAll();
            Integer modelId = models.stream()
                    .filter(m -> v.getModel().equalsIgnoreCase(m.getName()) || v.getModel().equalsIgnoreCase(m.getCode()))
                    .map(m -> m.getId()).findFirst().orElse(null);
            if (modelId != null) {
                List<WarrantyCondition> conditions = warrantyConditionRepository.findEffectiveByModel(modelId, today);
                if (!conditions.isEmpty()) {
                    WarrantyCondition wc = conditions.getFirst();
                    appliedYears = wc.getCoverageYears();
                    appliedKm = wc.getCoverageKm();
                    // Mileage check
                    if (appliedKm != null && v.getMileageKm() != null && v.getMileageKm() > appliedKm) {
                        eligible = false;
                        reasons.add("Mileage exceeded: " + v.getMileageKm() + "km > " + appliedKm + "km");
                    }
                }
            }
        }

        return new Result(eligible, reasons, appliedYears, appliedKm);
    }
}

