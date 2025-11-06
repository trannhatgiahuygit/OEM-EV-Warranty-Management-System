package com.ev.warranty.service.inter;

import java.util.List;

public interface WarrantyEligibilityService {
    record Result(boolean eligible, List<String> reasons, Integer appliedCoverageYears, Integer appliedCoverageKm) {}

    Result checkByVehicleId(Integer vehicleId);
    Result checkByClaimId(Integer claimId);
}

