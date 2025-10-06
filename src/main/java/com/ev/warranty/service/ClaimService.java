package com.ev.warranty.service;

import com.ev.warranty.model.dto.ClaimDto;

import java.util.List;

// Claim business logic
public interface ClaimService {

    // Create new warranty claim
    ClaimDto createClaim(ClaimDto.CreateRequest request);

    // Get all claims
    List<ClaimDto> getAllClaims();

    // Get claim by ID
    ClaimDto getClaimById(Integer claimId);

    // Get claim by claim number
    ClaimDto getClaimByNumber(String claimNumber);

    // Update claim
    ClaimDto updateClaim(Integer claimId, ClaimDto.UpdateRequest request);

    // Assign technician to claim
    ClaimDto assignTechnician(Integer claimId, ClaimDto.AssignTechnicianRequest request);

    // Get claims by status
    List<ClaimDto> getClaimsByStatus(String status);

    // Get claims by priority
    List<ClaimDto> getClaimsByPriority(String priority);

    // Get claims by technician
    List<ClaimDto> getClaimsByTechnician(Integer technicianId);

    // Get claims by vehicle
    List<ClaimDto> getClaimsByVehicle(Integer vehicleId);

    // Get claims by customer
    List<ClaimDto> getClaimsByCustomer(Integer customerId);

    // Get active claims in progress
    List<ClaimDto> getActiveClaimsInProgress();

    // Get claims requiring parts
    List<ClaimDto> getClaimsRequiringParts();

    // Update claim status only
    ClaimDto updateClaimStatus(Integer claimId, String status);

    // Complete claim
    ClaimDto completeClaim(Integer claimId, String notes);

    // Close claim
    ClaimDto closeClaim(Integer claimId, String notes);
}
