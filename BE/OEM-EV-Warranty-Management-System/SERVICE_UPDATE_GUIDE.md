# HƯỚNG DẪN UPDATE SERVICE LAYER

## ✅ ĐÃ HOÀN THÀNH

1. ✅ Claim entity - Thêm helper methods
2. ✅ ClaimMapper - Update toResponseDto, updateEntityFromDiagnosticRequest, assignTechnician, approveClaim
3. ✅ ClaimServiceImpl - Update một số phần (createClaimIntake, updateDiagnostic)

## 📋 CẦN UPDATE CÁC PHẦN SAU

### ClaimServiceImpl - Các method cần update:

#### 1. **validateUserCanModifyClaim** (line ~599)
```java
// Thay đổi:
claim.getAssignedTechnician()
// Thành:
claim.getAssignment() != null ? claim.getAssignment().getAssignedTechnician() : null
```

#### 2. **validateForSubmission** (line ~948)
```java
// Thay đổi:
claim.getReportedFailure()
claim.getInitialDiagnosis()
// Thành:
claim.getDiagnostic() != null ? claim.getDiagnostic().getReportedFailure() : null
claim.getDiagnostic() != null ? claim.getDiagnostic().getInitialDiagnosis() : null
```

#### 3. **convertDraftToIntake** (line ~1195)
```java
// Thay đổi:
claim.setInitialDiagnosis(request.getClaimTitle());
claim.setReportedFailure(request.getReportedFailure());
// Thành:
ClaimDiagnostic diagnostic = claim.getOrCreateDiagnostic();
diagnostic.setInitialDiagnosis(request.getClaimTitle());
diagnostic.setReportedFailure(request.getReportedFailure());
claim.setDiagnostic(diagnostic);
```

#### 4. **handleProblemReport** (line ~1321)
```java
// Thay đổi:
claim.setProblemType(request.getProblemType());
claim.setProblemDescription(request.getProblemDescription());
// Thành:
ClaimDiagnostic diagnostic = claim.getOrCreateDiagnostic();
diagnostic.setProblemType(request.getProblemType());
diagnostic.setProblemDescription(request.getProblemDescription());
claim.setDiagnostic(diagnostic);
```

#### 5. **clearProblemReport** (line ~1418)
```java
// Thay đổi:
claim.setProblemDescription(null);
claim.setProblemType(null);
// Thành:
if (claim.getDiagnostic() != null) {
    claim.getDiagnostic().setProblemDescription(null);
    claim.getDiagnostic().setProblemType(null);
}
```

#### 6. **resubmitClaim** (line ~1439)
```java
// Thay đổi:
claim.getCanResubmit()
claim.getResubmitCount()
claim.setResubmitCount(...)
claim.setInitialDiagnosis(...)
claim.setRejectionReason(null)
claim.setRejectionNotes(null)
// Thành:
ClaimApproval approval = claim.getOrCreateApproval();
approval.getCanResubmit()
approval.getResubmitCount()
approval.setResubmitCount(...)
ClaimDiagnostic diagnostic = claim.getOrCreateDiagnostic();
diagnostic.setInitialDiagnosis(...)
approval.setRejectionReason(null)
approval.setRejectionNotes(null)
```

#### 7. **requestCancelClaim** (line ~1483)
```java
// Thay đổi:
claim.getCancelRequestCount()
claim.setCancelRequestCount(...)
claim.setCancelReason(...)
// Thành:
ClaimCancellation cancellation = claim.getOrCreateCancellation();
cancellation.getCancelRequestCount()
cancellation.setCancelRequestCount(...)
cancellation.setCancelReason(...)
```

#### 8. **handoverVehicle** (line ~443)
```java
// Thay đổi:
claim.getDiagnosticDetails()
claim.setDiagnosticDetails(...)
// Thành:
ClaimDiagnostic diagnostic = claim.getOrCreateDiagnostic();
diagnostic.getDiagnosticDetails()
diagnostic.setDiagnosticDetails(...)
```

#### 9. **saveClaimToServiceHistory** (line ~1725)
```java
// Thay đổi:
claim.getRepairType()
claim.getReportedFailure()
claim.getDiagnosticDetails()
// Thành:
claim.getRepairConfiguration() != null ? claim.getRepairConfiguration().getRepairType() : null
claim.getDiagnostic() != null ? claim.getDiagnostic().getReportedFailure() : null
claim.getDiagnostic() != null ? claim.getDiagnostic().getDiagnosticDetails() : null
```

#### 10. **handleCustomerPayment** (line ~1779)
```java
// Thay đổi:
claim.setCustomerPaymentStatus("PAID");
claim.setCustomerPaymentStatus(paymentStatus);
// Thành:
ClaimRepairConfiguration repairConfig = claim.getOrCreateRepairConfiguration();
repairConfig.setCustomerPaymentStatus("PAID");
// hoặc
repairConfig.setCustomerPaymentStatus(paymentStatus);
claim.setRepairConfiguration(repairConfig);
```

#### 11. **autoProgressToValidStatus** (line ~1127)
```java
// Thay đổi:
claim.getAssignedTechnician()
claim.getRepairType()
// Thành:
claim.getAssignment() != null ? claim.getAssignment().getAssignedTechnician() : null
claim.getRepairConfiguration() != null ? claim.getRepairConfiguration().getRepairType() : null
```

---

### EVMClaimServiceImpl - Cần update:

#### 1. **approveClaim** (line ~78)
```java
// Thay đổi:
claim.setApprovedBy(evmStaff);
claim.setWarrantyCost(request.getWarrantyCost());
claim.setCompanyPaidCost(request.getCompanyPaidCost());
// Thành:
ClaimApproval approval = claim.getOrCreateApproval();
approval.setApprovedBy(evmStaff);
approval.setApprovedAt(LocalDateTime.now());
claim.setApproval(approval);

ClaimCost cost = claim.getOrCreateCost();
cost.setWarrantyCost(request.getWarrantyCost());
cost.setCompanyPaidCost(request.getCompanyPaidCost());
claim.setCost(cost);
```

#### 2. **rejectClaim** (line ~200)
```java
// Thay đổi:
claim.setRejectedBy(evmStaff);
claim.setRejectionReason(request.getRejectionReason());
claim.setRejectionNotes(request.getRejectionNotes());
claim.setRejectionCount(...)
claim.setCanResubmit(false);
// Thành:
ClaimApproval approval = claim.getOrCreateApproval();
approval.setRejectedBy(evmStaff);
approval.setRejectedAt(LocalDateTime.now());
approval.setRejectionReason(request.getRejectionReason());
approval.setRejectionNotes(request.getRejectionNotes());
approval.setRejectionCount(...)
approval.setCanResubmit(false);
claim.setApproval(approval);
```

---

### WarrantyEligibilityServiceImpl - Cần update:

#### **checkByClaimId** (line ~73)
```java
// Thay đổi:
c.setAutoWarrantyEligible(result.eligible());
c.setAutoWarrantyCheckedAt(...);
c.setAutoWarrantyReasons(...);
c.setAutoWarrantyAppliedYears(...);
c.setAutoWarrantyAppliedKm(...);
// Thành:
ClaimWarrantyEligibility eligibility = c.getOrCreateWarrantyEligibility();
eligibility.setAutoWarrantyEligible(result.eligible());
eligibility.setAutoWarrantyCheckedAt(...);
eligibility.setAutoWarrantyReasons(...);
eligibility.setAutoWarrantyAppliedYears(...);
eligibility.setAutoWarrantyAppliedKm(...);
c.setWarrantyEligibility(eligibility);
```

---

### WorkOrderServiceImpl - Cần update:

#### Các chỗ sử dụng:
```java
// Thay đổi:
claim.getRepairType()
// Thành:
claim.getRepairConfiguration() != null ? claim.getRepairConfiguration().getRepairType() : null
```

---

### EVMClaimMapper - Cần update:

#### **toEVMSummaryDTO** (line ~38)
```java
// Thay đổi:
.approvedAt(claim.getApprovedAt())
.warrantyCost(claim.getWarrantyCost())
.companyPaidCost(claim.getCompanyPaidCost())
// Thành:
.approvedAt(claim.getApproval() != null ? claim.getApproval().getApprovedAt() : null)
.warrantyCost(claim.getCost() != null ? claim.getCost().getWarrantyCost() : null)
.companyPaidCost(claim.getCost() != null ? claim.getCost().getCompanyPaidCost() : null)
```

---

### RecallCampaignServiceImpl - Cần update:

#### Các chỗ sử dụng:
```java
// Thay đổi:
claim.getReportedFailure()
claim.getInitialDiagnosis()
// Thành:
claim.getDiagnostic() != null ? claim.getDiagnostic().getReportedFailure() : null
claim.getDiagnostic() != null ? claim.getDiagnostic().getInitialDiagnosis() : null
```

---

## 🔧 PATTERN CHUNG

### Thay đổi từ:
```java
claim.getFieldName()
claim.setFieldName(value)
```

### Thành:
```java
// Diagnostic fields
claim.getDiagnostic() != null ? claim.getDiagnostic().getFieldName() : null
ClaimDiagnostic diagnostic = claim.getOrCreateDiagnostic();
diagnostic.setFieldName(value);
claim.setDiagnostic(diagnostic);

// Approval fields
claim.getApproval() != null ? claim.getApproval().getFieldName() : null
ClaimApproval approval = claim.getOrCreateApproval();
approval.setFieldName(value);
claim.setApproval(approval);

// Cost fields
claim.getCost() != null ? claim.getCost().getFieldName() : null
ClaimCost cost = claim.getOrCreateCost();
cost.setFieldName(value);
claim.setCost(cost);

// Assignment fields
claim.getAssignment() != null ? claim.getAssignment().getAssignedTechnician() : null
ClaimAssignment assignment = claim.getOrCreateAssignment();
assignment.setAssignedTechnician(technician);
claim.setAssignment(assignment);

// Repair configuration fields
claim.getRepairConfiguration() != null ? claim.getRepairConfiguration().getFieldName() : null
ClaimRepairConfiguration repairConfig = claim.getOrCreateRepairConfiguration();
repairConfig.setFieldName(value);
claim.setRepairConfiguration(repairConfig);

// Cancellation fields
claim.getCancellation() != null ? claim.getCancellation().getFieldName() : null
ClaimCancellation cancellation = claim.getOrCreateCancellation();
cancellation.setFieldName(value);
claim.setCancellation(cancellation);

// Warranty eligibility fields
claim.getWarrantyEligibility() != null ? claim.getWarrantyEligibility().getFieldName() : null
ClaimWarrantyEligibility eligibility = claim.getOrCreateWarrantyEligibility();
eligibility.setFieldName(value);
claim.setWarrantyEligibility(eligibility);
```

---

*File này sẽ được cập nhật khi hoàn thành các thay đổi.*

