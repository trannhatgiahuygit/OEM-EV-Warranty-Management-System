package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.claim.EVMClaimSummaryDTO;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.model.entity.Customer;
import com.ev.warranty.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class EVMClaimMapper {

    private final ClaimRepository claimRepository;

    // ✅ FIXED: Use real-time date instead of hardcoded
    private LocalDate getCurrentDate() {
        return LocalDate.now(); // Real-time current date
    }

    public EVMClaimSummaryDTO toEVMSummaryDTO(Claim claim) {
        if (claim == null) {
            return null;
        }

        return EVMClaimSummaryDTO.builder()
                .id(claim.getId())
                .claimNumber(claim.getClaimNumber())
                .status(claim.getStatus().getCode())
                .statusLabel(claim.getStatus().getLabel())
                .createdAt(claim.getCreatedAt())
                .approvedAt(claim.getApproval() != null ? claim.getApproval().getApprovedAt() : null)
                .warrantyCost(claim.getCost() != null ? claim.getCost().getWarrantyCost() : null)
                .companyPaidCost(claim.getCost() != null ? claim.getCost().getCompanyPaidCost() : null) // ánh xạ chi phí hãng chi trả
                .vehicle(mapVehicleSummary(claim.getVehicle()))
                .customer(mapCustomerSummary(claim.getCustomer()))
                .serviceCenter(mapServiceCenterSummary(claim))
                .priority(calculatePriority(claim))
                .riskLevel(calculateRiskLevel(claim))
                .requiresApproval(determineRequiresApproval(claim))
                .daysInProgress(calculateDaysInProgress(claim))
                .daysToApproval(calculateDaysToApproval(claim))
                .build();
    }

    public List<EVMClaimSummaryDTO> toEVMSummaryDTOList(List<Claim> claims) {
        return claims.stream()
                .map(this::toEVMSummaryDTO)
                .collect(Collectors.toList());
    }

    private EVMClaimSummaryDTO.VehicleSummaryDTO mapVehicleSummary(Vehicle vehicle) {
        if (vehicle == null) {
            return null;
        }

        return EVMClaimSummaryDTO.VehicleSummaryDTO.builder()
                .id(vehicle.getId())
                .vin(vehicle.getVin())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .warrantyStatus(calculateWarrantyStatus(vehicle))
                .warrantyMonthsRemaining(calculateWarrantyMonthsRemaining(vehicle))
                .build();
    }

    private EVMClaimSummaryDTO.CustomerSummaryDTO mapCustomerSummary(Customer customer) {
        if (customer == null) {
            return null;
        }

        // Get total claims count for this customer
        long totalClaims = claimRepository.countByCustomerId(customer.getId());

        return EVMClaimSummaryDTO.CustomerSummaryDTO.builder()
                .id(customer.getId())
                .name(customer.getName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .totalClaims((int) totalClaims)
                .isRepeatCustomer(totalClaims > 1)
                .build();
    }

    private EVMClaimSummaryDTO.ServiceCenterSummaryDTO mapServiceCenterSummary(Claim claim) {
        com.ev.warranty.model.entity.ClaimAssignment assignment = claim.getAssignment();
        return EVMClaimSummaryDTO.ServiceCenterSummaryDTO.builder()
                .createdByUsername(claim.getCreatedBy() != null ? claim.getCreatedBy().getUsername() : null)
                .createdByFullName(claim.getCreatedBy() != null ? claim.getCreatedBy().getFullName() : null)
                .assignedTechnicianName(assignment != null && assignment.getAssignedTechnician() != null ?
                        assignment.getAssignedTechnician().getFullName() : "Unassigned")
                .region(determineRegion(claim))
                .build();
    }

    private String calculatePriority(Claim claim) {
        com.ev.warranty.model.entity.ClaimCost cost = claim.getCost();
        com.ev.warranty.model.entity.ClaimDiagnostic diagnostic = claim.getDiagnostic();
        java.math.BigDecimal warrantyCost = cost != null ? cost.getWarrantyCost() : null;
        
        // High priority criteria for EVM
        if (warrantyCost != null && warrantyCost.compareTo(java.math.BigDecimal.valueOf(2000)) >= 0) {
            return "HIGH"; // Expensive claims
        }

        String reportedFailure = diagnostic != null ? diagnostic.getReportedFailure() : null;
        if (isSafetyCritical(reportedFailure)) {
            return "HIGH"; // Safety issues
        }

        if (isOverdue(claim)) {
            return "HIGH"; // Overdue processing
        }

        if (warrantyCost != null && warrantyCost.compareTo(java.math.BigDecimal.valueOf(500)) >= 0) {
            return "MEDIUM"; // Medium cost
        }

        return "LOW";
    }

    private String calculateRiskLevel(Claim claim) {
        int riskScore = 0;
        LocalDate currentDate = getCurrentDate(); // ✅ Use real-time date

        com.ev.warranty.model.entity.ClaimCost cost = claim.getCost();
        com.ev.warranty.model.entity.ClaimDiagnostic diagnostic = claim.getDiagnostic();
        java.math.BigDecimal warrantyCost = cost != null ? cost.getWarrantyCost() : null;

        // Cost factor (0-3 points)
        if (warrantyCost != null) {
            if (warrantyCost.compareTo(java.math.BigDecimal.valueOf(5000)) >= 0) {
                riskScore += 3;
            } else if (warrantyCost.compareTo(java.math.BigDecimal.valueOf(2000)) >= 0) {
                riskScore += 2;
            } else if (warrantyCost.compareTo(java.math.BigDecimal.valueOf(500)) >= 0) {
                riskScore += 1;
            }
        }

        // Safety factor (0-3 points)
        String reportedFailure = diagnostic != null ? diagnostic.getReportedFailure() : null;
        if (isSafetyCritical(reportedFailure)) {
            riskScore += 3;
        }

        // Repeat customer factor (0-2 points)
        long customerClaims = claimRepository.countByCustomerId(claim.getCustomer().getId());
        if (customerClaims >= 3) {
            riskScore += 2;
        }

        // ✅ Vehicle age factor using real-time date
        int vehicleAge = currentDate.getYear() - claim.getVehicle().getYear(); // Real-time year - vehicle year
        if (vehicleAge >= 3) {
            riskScore += 1;
        }

        // Return risk level based on score
        if (riskScore >= 6) return "CRITICAL";
        if (riskScore >= 4) return "HIGH";
        if (riskScore >= 2) return "MEDIUM";
        return "LOW";
    }

    private Boolean determineRequiresApproval(Claim claim) {
        String status = claim.getStatus().getCode();

        // Already processed
        if (List.of("APPROVED", "REJECTED", "COMPLETED").contains(status)) {
            return false;
        }

        com.ev.warranty.model.entity.ClaimCost cost = claim.getCost();
        com.ev.warranty.model.entity.ClaimDiagnostic diagnostic = claim.getDiagnostic();
        java.math.BigDecimal warrantyCost = cost != null ? cost.getWarrantyCost() : null;

        // High cost claims require approval
        if (warrantyCost != null && warrantyCost.compareTo(java.math.BigDecimal.valueOf(1000)) >= 0) {
            return true;
        }

        // Safety critical issues require approval
        String reportedFailure = diagnostic != null ? diagnostic.getReportedFailure() : null;
        if (isSafetyCritical(reportedFailure)) {
            return true;
        }

        // Repeat customer claims require approval
        long customerClaims = claimRepository.countByCustomerId(claim.getCustomer().getId());
        if (customerClaims >= 3) {
            return true;
        }

        return false;
    }

    // ✅ FIXED: Calculate days from creation to real-time current date
    private Long calculateDaysInProgress(Claim claim) {
        if (claim.getCreatedAt() == null) {
            return 0L;
        }

        LocalDate currentDate = getCurrentDate(); // ✅ Real-time date
        return ChronoUnit.DAYS.between(claim.getCreatedAt().toLocalDate(), currentDate);
    }

    // ✅ Calculate days from creation to approval (null if not approved)
    private Long calculateDaysToApproval(Claim claim) {
        com.ev.warranty.model.entity.ClaimApproval approval = claim.getApproval();
        if (claim.getCreatedAt() == null || approval == null || approval.getApprovedAt() == null) {
            return null; // Not approved yet
        }

        return ChronoUnit.DAYS.between(
                claim.getCreatedAt().toLocalDate(),
                approval.getApprovedAt().toLocalDate()
        );
    }

    private String calculateWarrantyStatus(Vehicle vehicle) {
        if (vehicle.getWarrantyEnd() == null) {
            return "UNKNOWN";
        }

        LocalDate currentDate = getCurrentDate(); // ✅ Real-time date
        LocalDate warrantyEnd = vehicle.getWarrantyEnd();

        if (warrantyEnd.isBefore(currentDate)) {
            return "EXPIRED";
        } else if (warrantyEnd.isBefore(currentDate.plusMonths(6))) {
            return "EXPIRING_SOON";
        } else {
            return "ACTIVE";
        }
    }

    private Integer calculateWarrantyMonthsRemaining(Vehicle vehicle) {
        LocalDate currentDate = getCurrentDate(); // ✅ Real-time date

        if (vehicle.getWarrantyEnd() == null || vehicle.getWarrantyEnd().isBefore(currentDate)) {
            return 0;
        }

        return (int) ChronoUnit.MONTHS.between(currentDate, vehicle.getWarrantyEnd());
    }

    private String determineRegion(Claim claim) {
        if (claim.getCreatedBy() == null) {
            return "UNKNOWN";
        }

        String username = claim.getCreatedBy().getUsername();

        // Map users to regions based on username pattern
        if (username.contains("1") || username.equals("sc_staff1")) {
            return "NORTH";
        } else if (username.contains("2") || username.equals("sc_staff2")) {
            return "SOUTH";
        } else {
            return "CENTRAL";
        }
    }

    private boolean isSafetyCritical(String reportedFailure) {
        if (reportedFailure == null) {
            return false;
        }

        String lowerCase = reportedFailure.toLowerCase();
        String[] safetyCriticalKeywords = {
                "battery", "brake", "steering", "fire", "smoke", "explosion",
                "shutdown", "emergency", "airbag", "seatbelt", "collision"
        };

        for (String keyword : safetyCriticalKeywords) {
            if (lowerCase.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    private boolean isOverdue(Claim claim) {
        if (claim.getCreatedAt() == null) {
            return false;
        }

        LocalDate currentDate = getCurrentDate(); // ✅ Real-time date
        String status = claim.getStatus().getCode();
        long daysInProgress = ChronoUnit.DAYS.between(claim.getCreatedAt().toLocalDate(), currentDate);

        // Define overdue thresholds based on status
        return switch (status) {
            case "OPEN" -> daysInProgress > 3; // Should be assigned within 3 days
            case "IN_PROGRESS" -> daysInProgress > 7; // Should be diagnosed within 7 days
            case "PENDING_APPROVAL" -> daysInProgress > 14; // Should be approved within 14 days
            default -> false;
        };
    }
}