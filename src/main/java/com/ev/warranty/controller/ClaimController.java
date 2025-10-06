package com.ev.warranty.controller;

import com.ev.warranty.model.dto.ClaimDto;
import com.ev.warranty.service.ClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ClaimController {

    private final ClaimService claimService;

    // Create new warranty claim
    @PostMapping
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimDto> createClaim(@RequestBody ClaimDto.CreateRequest request) {
        try {
            ClaimDto claim = claimService.createClaim(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(claim);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get all claims for SC Staff dashboard
    @GetMapping
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimDto>> getAllClaims() {
        List<ClaimDto> claims = claimService.getAllClaims();
        return ResponseEntity.ok(claims);
    }

    // Get claim by ID
    @GetMapping("/{claimId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ClaimDto> getClaimById(@PathVariable Integer claimId) {
        try {
            ClaimDto claim = claimService.getClaimById(claimId);
            return ResponseEntity.ok(claim);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get claim by claim number
    @GetMapping("/number/{claimNumber}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ClaimDto> getClaimByNumber(@PathVariable String claimNumber) {
        try {
            ClaimDto claim = claimService.getClaimByNumber(claimNumber);
            return ResponseEntity.ok(claim);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Update claim status and progress
    @PutMapping("/{claimId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ClaimDto> updateClaim(@PathVariable Integer claimId, @RequestBody ClaimDto.UpdateRequest request) {
        try {
            ClaimDto claim = claimService.updateClaim(claimId, request);
            return ResponseEntity.ok(claim);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Assign technician to claim
    @PostMapping("/{claimId}/assign-technician")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimDto> assignTechnician(@PathVariable Integer claimId, @RequestBody ClaimDto.AssignTechnicianRequest request) {
        try {
            ClaimDto claim = claimService.assignTechnician(claimId, request);
            return ResponseEntity.ok(claim);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get claims by status
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimDto>> getClaimsByStatus(@PathVariable String status) {
        List<ClaimDto> claims = claimService.getClaimsByStatus(status);
        return ResponseEntity.ok(claims);
    }

    // Get claims by priority
    @GetMapping("/priority/{priority}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimDto>> getClaimsByPriority(@PathVariable String priority) {
        List<ClaimDto> claims = claimService.getClaimsByPriority(priority);
        return ResponseEntity.ok(claims);
    }

    // Get claims assigned to technician
    @GetMapping("/technician/{technicianId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimDto>> getClaimsByTechnician(@PathVariable Integer technicianId) {
        List<ClaimDto> claims = claimService.getClaimsByTechnician(technicianId);
        return ResponseEntity.ok(claims);
    }

    // Get claims by vehicle
    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimDto>> getClaimsByVehicle(@PathVariable Integer vehicleId) {
        List<ClaimDto> claims = claimService.getClaimsByVehicle(vehicleId);
        return ResponseEntity.ok(claims);
    }

    // Get claims by customer
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimDto>> getClaimsByCustomer(@PathVariable Integer customerId) {
        List<ClaimDto> claims = claimService.getClaimsByCustomer(customerId);
        return ResponseEntity.ok(claims);
    }

    // Get active claims in progress
    @GetMapping("/active")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimDto>> getActiveClaims() {
        List<ClaimDto> claims = claimService.getActiveClaimsInProgress();
        return ResponseEntity.ok(claims);
    }

    // Get claims requiring parts
    @GetMapping("/requiring-parts")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<ClaimDto>> getClaimsRequiringParts() {
        List<ClaimDto> claims = claimService.getClaimsRequiringParts();
        return ResponseEntity.ok(claims);
    }

    // Update claim status only
    @PatchMapping("/{claimId}/status")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ClaimDto> updateClaimStatus(@PathVariable Integer claimId, @RequestParam String status) {
        try {
            ClaimDto claim = claimService.updateClaimStatus(claimId, status);
            return ResponseEntity.ok(claim);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Complete claim
    @PostMapping("/{claimId}/complete")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('SC_TECHNICIAN') or hasRole('ADMIN')")
    public ResponseEntity<ClaimDto> completeClaim(@PathVariable Integer claimId, @RequestParam(required = false) String notes) {
        try {
            ClaimDto claim = claimService.completeClaim(claimId, notes);
            return ResponseEntity.ok(claim);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Close claim
    @PostMapping("/{claimId}/close")
    @PreAuthorize("hasRole('SC_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ClaimDto> closeClaim(@PathVariable Integer claimId, @RequestParam(required = false) String notes) {
        try {
            ClaimDto claim = claimService.closeClaim(claimId, notes);
            return ResponseEntity.ok(claim);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
