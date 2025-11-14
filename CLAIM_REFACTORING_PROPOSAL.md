# ĐỀ XUẤT REFACTOR TABLE CLAIM

## 🔴 VẤN ĐỀ HIỆN TẠI

Table `Claim` hiện tại có **198 dòng code** với **quá nhiều trách nhiệm**, vi phạm nguyên tắc **Single Responsibility Principle**:

### Phân tích các nhóm trường trong Claim:

1. **Thông tin cơ bản** (Core Claim Info)
   - `id`, `claimNumber`, `vehicle`, `customer`, `createdBy`, `createdAt`, `updatedAt`
   - `status`, `isActive`

2. **Thông tin chẩn đoán** (Diagnostic Info)
   - `reportedFailure`, `initialDiagnosis`, `diagnosticDetails`
   - `problemDescription`, `problemType`

3. **Thông tin phê duyệt** (Approval Info)
   - `approvedBy`, `approvedAt`
   - `rejectedBy`, `rejectedAt`
   - `rejectionReason`, `rejectionNotes`
   - `rejectionCount`, `resubmitCount`, `canResubmit`

4. **Thông tin hủy** (Cancellation Info)
   - `cancelRequestCount`
   - `cancelPreviousStatusCode`
   - `cancelRequestedBy`, `cancelRequestedAt`
   - `cancelHandledBy`, `cancelHandledAt`
   - `cancelReason`

5. **Thông tin Warranty Eligibility** (Warranty Assessment)
   - `warrantyEligibilityAssessment`
   - `isWarrantyEligible`
   - `warrantyEligibilityNotes`
   - `autoWarrantyEligible`
   - `autoWarrantyReasons`
   - `autoWarrantyCheckedAt`
   - `manualWarrantyOverride`
   - `manualOverrideConfirmed`
   - `manualOverrideConfirmedAt`
   - `manualOverrideConfirmedBy`
   - `autoWarrantyAppliedYears`
   - `autoWarrantyAppliedKm`

6. **Thông tin chi phí** (Cost Information)
   - `warrantyCost`
   - `companyPaidCost`
   - `totalServiceCost`
   - `totalThirdPartyPartsCost`
   - `totalEstimatedCost`

7. **Thông tin Repair Type & Service Catalog** (Repair Configuration)
   - `repairType` (EVM_REPAIR/SC_REPAIR)
   - `serviceCatalogItems` (JSON)
   - `customerPaymentStatus`

8. **Thông tin phân công** (Assignment)
   - `assignedTechnician`

---

## ✅ GIẢI PHÁP: TÁCH THÀNH NHIỀU TABLE

### Kiến trúc mới:

```
Claim (Core) 
  ├── ClaimDiagnostic (1:1)
  ├── ClaimApproval (1:1)
  ├── ClaimCancellation (1:1)
  ├── ClaimWarrantyEligibility (1:1)
  ├── ClaimCost (1:1)
  ├── ClaimRepairConfiguration (1:1)
  └── ClaimAssignment (1:1)
```

---

## 📋 CHI TIẾT CÁC TABLE MỚI

### 1. **Claim** (Table chính - giữ lại core info)

```sql
CREATE TABLE claims (
    id INT PRIMARY KEY IDENTITY(1,1),
    claim_number VARCHAR(100) NOT NULL UNIQUE,
    vehicle_id INT NOT NULL,
    customer_id INT NOT NULL,
    created_by INT NOT NULL,
    status_id INT NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (status_id) REFERENCES claim_statuses(id)
);
```

**Trách nhiệm**: Chỉ lưu thông tin cơ bản và quan hệ chính.

---

### 2. **ClaimDiagnostic** (1:1 với Claim)

```sql
CREATE TABLE claim_diagnostics (
    id INT PRIMARY KEY IDENTITY(1,1),
    claim_id INT NOT NULL UNIQUE,
    reported_failure NVARCHAR(MAX),
    initial_diagnosis NVARCHAR(MAX),
    diagnostic_details NVARCHAR(MAX),
    problem_description NVARCHAR(MAX),
    problem_type VARCHAR(50),
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);
```

**Trách nhiệm**: Tất cả thông tin liên quan đến chẩn đoán.

---

### 3. **ClaimApproval** (1:1 với Claim)

```sql
CREATE TABLE claim_approvals (
    id INT PRIMARY KEY IDENTITY(1,1),
    claim_id INT NOT NULL UNIQUE,
    approved_by INT,
    approved_at DATETIME2,
    rejected_by INT,
    rejected_at DATETIME2,
    rejection_reason VARCHAR(50),
    rejection_notes NVARCHAR(MAX),
    rejection_count INT NOT NULL DEFAULT 0,
    resubmit_count INT NOT NULL DEFAULT 0,
    can_resubmit BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (rejected_by) REFERENCES users(id)
);
```

**Trách nhiệm**: Quản lý quy trình phê duyệt và từ chối.

---

### 4. **ClaimCancellation** (1:1 với Claim)

```sql
CREATE TABLE claim_cancellations (
    id INT PRIMARY KEY IDENTITY(1,1),
    claim_id INT NOT NULL UNIQUE,
    cancel_request_count INT NOT NULL DEFAULT 0,
    cancel_previous_status_code VARCHAR(50),
    cancel_requested_by INT,
    cancel_requested_at DATETIME2,
    cancel_handled_by INT,
    cancel_handled_at DATETIME2,
    cancel_reason NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    FOREIGN KEY (cancel_requested_by) REFERENCES users(id),
    FOREIGN KEY (cancel_handled_by) REFERENCES users(id)
);
```

**Trách nhiệm**: Quản lý yêu cầu hủy claim.

---

### 5. **ClaimWarrantyEligibility** (1:1 với Claim)

```sql
CREATE TABLE claim_warranty_eligibility (
    id INT PRIMARY KEY IDENTITY(1,1),
    claim_id INT NOT NULL UNIQUE,
    
    -- Auto check results
    auto_warranty_eligible BIT,
    auto_warranty_reasons NVARCHAR(MAX),
    auto_warranty_checked_at DATETIME2,
    auto_warranty_applied_years INT,
    auto_warranty_applied_km INT,
    
    -- Manual assessment
    warranty_eligibility_assessment NVARCHAR(MAX),
    is_warranty_eligible BIT,
    warranty_eligibility_notes NVARCHAR(MAX),
    
    -- Manual override
    manual_warranty_override BIT,
    manual_override_confirmed BIT,
    manual_override_confirmed_at DATETIME2,
    manual_override_confirmed_by INT,
    
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    FOREIGN KEY (manual_override_confirmed_by) REFERENCES users(id)
);
```

**Trách nhiệm**: Quản lý đánh giá và quyết định bảo hành.

---

### 6. **ClaimCost** (1:1 với Claim)

```sql
CREATE TABLE claim_costs (
    id INT PRIMARY KEY IDENTITY(1,1),
    claim_id INT NOT NULL UNIQUE,
    warranty_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    company_paid_cost DECIMAL(12,2),
    total_service_cost DECIMAL(12,2),
    total_third_party_parts_cost DECIMAL(12,2),
    total_estimated_cost DECIMAL(12,2),
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);
```

**Trách nhiệm**: Quản lý tất cả thông tin chi phí.

---

### 7. **ClaimRepairConfiguration** (1:1 với Claim)

```sql
CREATE TABLE claim_repair_configurations (
    id INT PRIMARY KEY IDENTITY(1,1),
    claim_id INT NOT NULL UNIQUE,
    repair_type VARCHAR(50), -- EVM_REPAIR or SC_REPAIR
    service_catalog_items NVARCHAR(MAX), -- JSON string
    customer_payment_status VARCHAR(50), -- PENDING, PAID for SC Repair
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);
```

**Trách nhiệm**: Cấu hình loại sửa chữa và service catalog.

---

### 8. **ClaimAssignment** (1:1 với Claim)

```sql
CREATE TABLE claim_assignments (
    id INT PRIMARY KEY IDENTITY(1,1),
    claim_id INT NOT NULL UNIQUE,
    assigned_technician_id INT,
    assigned_at DATETIME2,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_technician_id) REFERENCES users(id)
);
```

**Trách nhiệm**: Quản lý phân công kỹ thuật viên.

---

## 🎯 LỢI ÍCH CỦA CẤU TRÚC MỚI

### 1. **Single Responsibility**
- Mỗi table chỉ có một trách nhiệm rõ ràng
- Dễ hiểu và maintain

### 2. **Performance**
- Query chỉ load dữ liệu cần thiết
- Index hiệu quả hơn
- Giảm kích thước row trong table chính

### 3. **Scalability**
- Dễ thêm tính năng mới (tạo table mới thay vì thêm column)
- Không ảnh hưởng đến table chính

### 4. **Data Integrity**
- Có thể enforce constraints riêng cho từng module
- Dễ validate dữ liệu

### 5. **Flexibility**
- Có thể lazy load các phần không cần thiết
- Dễ tối ưu query

---

## 🔄 MIGRATION STRATEGY

### Bước 1: Tạo các table mới
```sql
-- Tạo các table mới với cấu trúc như trên
```

### Bước 2: Migrate dữ liệu
```sql
-- Migrate dữ liệu từ claims sang các table mới
INSERT INTO claim_diagnostics (claim_id, reported_failure, ...)
SELECT id, reported_failure, ... FROM claims;

-- Tương tự cho các table khác
```

### Bước 3: Update Application Code
- Tạo các entity mới
- Update service layer để query từ nhiều table
- Sử dụng DTO để aggregate dữ liệu

### Bước 4: Drop columns cũ (sau khi verify)
```sql
ALTER TABLE claims DROP COLUMN reported_failure;
-- ... drop các column khác
```

---

## 📝 ENTITY MAPPING (JPA)

### Claim.java (Simplified)
```java
@Entity
@Table(name = "claims")
public class Claim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "claim_number", unique = true, nullable = false)
    private String claimNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private ClaimStatus status;
    
    // 1:1 Relationships
    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ClaimDiagnostic diagnostic;
    
    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ClaimApproval approval;
    
    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ClaimCancellation cancellation;
    
    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ClaimWarrantyEligibility warrantyEligibility;
    
    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ClaimCost cost;
    
    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ClaimRepairConfiguration repairConfiguration;
    
    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ClaimAssignment assignment;
    
    // ... getters, setters
}
```

### ClaimDiagnostic.java
```java
@Entity
@Table(name = "claim_diagnostics")
public class ClaimDiagnostic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false, unique = true)
    private Claim claim;
    
    @Column(name = "reported_failure", columnDefinition = "NVARCHAR(MAX)")
    private String reportedFailure;
    
    @Column(name = "initial_diagnosis", columnDefinition = "NVARCHAR(MAX)")
    private String initialDiagnosis;
    
    @Column(name = "diagnostic_details", columnDefinition = "NVARCHAR(MAX)")
    private String diagnosticDetails;
    
    @Column(name = "problem_description", columnDefinition = "NVARCHAR(MAX)")
    private String problemDescription;
    
    @Column(name = "problem_type", length = 50)
    private String problemType;
    
    // ... timestamps, getters, setters
}
```

---

## ⚠️ LƯU Ý KHI IMPLEMENT

1. **Lazy Loading**: Sử dụng `FetchType.LAZY` để tránh N+1 query
2. **DTO Pattern**: Tạo DTO để aggregate dữ liệu từ nhiều table
3. **Transaction Management**: Đảm bảo consistency khi update nhiều table
4. **Backward Compatibility**: Có thể giữ lại các column cũ trong giai đoạn transition
5. **Indexing**: Thêm index cho các foreign key và trường thường query

---

## 🚀 NEXT STEPS

1. Review và approve design
2. Tạo migration script
3. Implement các entity mới
4. Update service layer
5. Test thoroughly
6. Deploy và monitor

---

*Đề xuất này giúp hệ thống dễ maintain, scale và perform tốt hơn trong tương lai.*

