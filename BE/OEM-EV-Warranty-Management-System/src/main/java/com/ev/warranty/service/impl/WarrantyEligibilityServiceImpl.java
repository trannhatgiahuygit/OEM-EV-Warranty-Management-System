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
        Result result = evaluate(c.getVehicle());
        // Persist auto-check outcome onto claim for auditing
        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            c.setAutoWarrantyEligible(result.eligible());
            c.setAutoWarrantyCheckedAt(java.time.LocalDateTime.now());
            c.setAutoWarrantyReasons(om.writeValueAsString(result.reasons()));
            c.setAutoWarrantyAppliedYears(result.appliedCoverageYears());
            c.setAutoWarrantyAppliedKm(result.appliedCoverageKm());
            claimRepository.save(c);
        } catch (Exception e) {
            // non-fatal
        }
        return result;
    }

    private Result evaluate(Vehicle v) {
        List<String> reasons = new ArrayList<>();
        Integer appliedYears = null;
        Integer appliedKm = null;

        LocalDate today = LocalDate.now();

        // Resolve model id
        Integer modelId = null;
        if (v.getVehicleModel() != null) {
            modelId = v.getVehicleModel().getId();
        } else if (v.getModel() != null) {
            var models = vehicleModelRepository.findAll();
            modelId = models.stream()
                    .filter(m -> v.getModel().equalsIgnoreCase(m.getName()) || v.getModel().equalsIgnoreCase(m.getCode()))
                    .map(m -> m.getId()).findFirst().orElse(null);
        }

        WarrantyCondition wc = null;
        if (modelId != null) {
            List<WarrantyCondition> conditions = warrantyConditionRepository.findEffectiveByModel(modelId, today);
            if (!conditions.isEmpty()) {
                wc = conditions.getFirst();
                appliedYears = wc.getCoverageYears();
                appliedKm = wc.getCoverageKm();
            }
        }

        // Evaluate by date
        Boolean withinDate = null;
        if (v.getWarrantyEnd() != null) {
            withinDate = !today.isAfter(v.getWarrantyEnd());
            if (withinDate == Boolean.FALSE) {
                reasons.add("Warranty expired on " + v.getWarrantyEnd());
            }
        } else if (wc != null && wc.getCoverageYears() != null) {
            LocalDate start = v.getWarrantyStart() != null ? v.getWarrantyStart() : v.getRegistrationDate();
            if (start == null) {
                withinDate = false;
                reasons.add("Missing warranty start/registration date to compute expiry");
            } else {
                LocalDate end = start.plusYears(wc.getCoverageYears());
                withinDate = !today.isAfter(end);
                if (withinDate == Boolean.FALSE) {
                    reasons.add("Warranty expired on " + end + " (" + wc.getCoverageYears() + "y from start)");
                }
            }
        }

        // Evaluate by mileage
        Boolean withinKm = null;
        if (wc != null && wc.getCoverageKm() != null) {
            if (v.getMileageKm() == null) {
                withinKm = false;
                reasons.add("Missing current mileage for km-based policy");
            } else {
                withinKm = v.getMileageKm() <= wc.getCoverageKm();
                if (withinKm == Boolean.FALSE) {
                    reasons.add("Mileage exceeded: " + v.getMileageKm() + "km > " + wc.getCoverageKm() + "km");
                }
            }
        }

        // OR policy: eligible if within date OR within km (when defined). If both undefined, not eligible.
        boolean dateOk = withinDate != null && withinDate;
        boolean kmOk = withinKm != null && withinKm;
        boolean eligible = dateOk || kmOk;

        if (eligible) {
            if (dateOk) reasons.add("Within warranty by date");
            if (kmOk) reasons.add("Within warranty by mileage");
        } else {
            if (withinDate == null && withinKm == null) {
                reasons.add("No effective warranty conditions found for model or missing configuration");
            }
        }

        return new Result(eligible, reasons, appliedYears, appliedKm);
    }
}
