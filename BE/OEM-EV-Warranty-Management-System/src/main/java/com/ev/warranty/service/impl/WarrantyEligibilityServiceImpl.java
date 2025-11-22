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

/**
 * Service implementation that performs automatic warranty eligibility checks.
 *
 * Responsibilities:
 * - Provide eligibility check entry points by vehicle id or by claim id.
 * - Evaluate a vehicle against effective warranty conditions (model-based or specific dates/km).
 * - When checking by claim, persist the auto-check outcome onto the claim for auditing.
 *
 * Note: This class contains pure evaluation logic and a small persistence step for audit when
 * evaluating via a Claim. It does not create or modify warranty policies; it only reads
 * repositories and computes eligibility based on model conditions and vehicle attributes.
 */
@Service
@RequiredArgsConstructor
public class WarrantyEligibilityServiceImpl implements WarrantyEligibilityService {

    // Repositories required to resolve vehicle, claim, vehicle model and warranty conditions.
    private final VehicleRepository vehicleRepository;
    private final ClaimRepository claimRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final WarrantyConditionRepository warrantyConditionRepository;

    /**
     * Public API: check warranty eligibility by vehicle id.
     * - Loads vehicle entity and delegates to evaluate(vehicle).
     */
    @Override
    public Result checkByVehicleId(Integer vehicleId) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new NotFoundException("Vehicle not found"));
        return evaluate(v);
    }

    /**
     * Public API: check warranty eligibility by claim id.
     * - Loads the claim and ensures it has an associated vehicle.
     * - Calls evaluate(vehicle) to compute eligibility.
     * - Persists audit fields on the claim (autoWarrantyEligible, autoWarrantyCheckedAt,
     *   autoWarrantyReasons, autoWarrantyAppliedYears/ Km) so the automatic decision is
     *   recorded on the claim.
     * - This persistence is best-effort: exceptions are swallowed since the evaluation
     *   result is still returned to the caller.
     */
    @Override
    public Result checkByClaimId(Integer claimId) {
        Claim c = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));
        if (c.getVehicle() == null) throw new NotFoundException("Claim has no vehicle linked");
        // Hibernate lazy safeguard: touch VIN so vehicle proxy is initialized if needed
        c.getVehicle().getVin();
        Result result = evaluate(c.getVehicle());
        // Persist auto-check outcome onto claim for auditing
        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            com.ev.warranty.model.entity.ClaimWarrantyEligibility eligibility = c.getOrCreateWarrantyEligibility();
            eligibility.setAutoWarrantyEligible(result.eligible());
            eligibility.setAutoWarrantyCheckedAt(java.time.LocalDateTime.now());
            // store reasons as JSON array string
            eligibility.setAutoWarrantyReasons(om.writeValueAsString(result.reasons()));
            eligibility.setAutoWarrantyAppliedYears(result.appliedCoverageYears());
            eligibility.setAutoWarrantyAppliedKm(result.appliedCoverageKm());
            c.setWarrantyEligibility(eligibility);
            claimRepository.save(c);
        } catch (Exception e) {
            // Non-fatal: auditing persistence failure should not block eligibility response.
        }
        return result;
    }

    /**
     * Core evaluation logic:
     * - Determine applicable warranty condition (by vehicle model or by model name/code lookup).
     * - Evaluate warranty by date and by mileage (km) where applicable.
     * - Follows an OR policy: eligible if within date OR within km when those checks are defined.
     * - Collects human-readable reasons for UI/audit use and returns applied coverage (years/km)
     *   from the resolved warranty condition when available.
     */
    private Result evaluate(Vehicle v) {
        List<String> reasons = new ArrayList<>();
        Integer appliedYears = null;
        Integer appliedKm = null;

        LocalDate today = LocalDate.now();

        // Resolve model id: prefer linked VehicleModel entity, otherwise attempt lookup by name/code
        Integer modelId = null;
        if (v.getVehicleModel() != null) {
            modelId = v.getVehicleModel().getId();
        } else if (v.getModel() != null) {
            // If only a model string is present on vehicle, try to find matching VehicleModel
            var models = vehicleModelRepository.findAll();
            modelId = models.stream()
                    .filter(m -> v.getModel().equalsIgnoreCase(m.getName()) || v.getModel().equalsIgnoreCase(m.getCode()))
                    .map(m -> m.getId()).findFirst().orElse(null);
        }

        WarrantyCondition wc = null;
        if (modelId != null) {
            // Find effective warranty conditions for the resolved model as of today
            List<WarrantyCondition> conditions = warrantyConditionRepository.findEffectiveByModel(modelId, today);
            if (!conditions.isEmpty()) {
                // Choose the first matching condition (assumes repository gives ordered/filtered results)
                wc = conditions.getFirst();
                appliedYears = wc.getCoverageYears();
                appliedKm = wc.getCoverageKm();
            }
        }

        // Evaluate by date
        Boolean withinDate = null;
        if (v.getWarrantyEnd() != null) {
            // If vehicle has explicit warranty end date, use it.
            withinDate = !today.isAfter(v.getWarrantyEnd());
            if (withinDate == Boolean.FALSE) {
                reasons.add("Warranty expired on " + v.getWarrantyEnd());
            }
        } else if (wc != null && wc.getCoverageYears() != null) {
            // Otherwise, if a warranty condition provides years of coverage, compute end date
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
                // Within km if current mileage is less than or equal to coverage km
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
