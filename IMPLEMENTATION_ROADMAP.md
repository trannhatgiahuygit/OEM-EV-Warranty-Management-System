# 🗺️ ROADMAP TRIỂN KHAI - LUỒNG BẢO HÀNH 2 TRƯỜNG HỢP

## 📊 TÓM TẮT MỨC ĐỘ ƯU TIÊN

### 🔥 CRITICAL (Làm ngay - Sprint 1-2)
1. ✅ **VehicleModel CRUD** - 70% done, cần bổ sung phân quyền
2. ✅ **WarrantyConditions System** - Hoàn toàn mới, cốt lõi nghiệp vụ
3. ✅ **Warranty Acceptance trong Diagnostic** - Điểm phân luồng chính
4. ✅ **Logic 2 trường hợp** - Eligible vs Not Eligible flows

### 🟡 HIGH (Sprint 3)
5. ✅ **Third-Party Parts Management** - Hoàn toàn mới cho SC
6. ✅ **SC Parts Serial Handling** - Tracking linh kiện thứ 3

### 🟢 MEDIUM (Sprint 4)
7. ✅ **EVM Parts API Review** - Kiểm tra & bổ sung
8. ✅ **Integration Testing** - Test 2 luồng end-to-end

### ⚪ LOW (Sprint 5)
9. ⏸️ **Vietnamese i18n** - Làm sau cùng

---

## 🏗️ KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────┐
│                    VEHICLE MODEL                            │
│  ┌──────────────┐          ┌─────────────────────┐         │
│  │ VehicleModel │─────────>│ WarrantyCondition   │         │
│  │   (Exist)    │          │     (NEW)           │         │
│  └──────────────┘          └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │   Vehicle       │
                    │  (Updated)      │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    CLAIM PROCESSING                          │
│                                                              │
│  SC Technician inspects → Update Diagnostic                 │
│  ┌──────────────────────────────────────────────┐          │
│  │ ClaimDiagnosticRequest                       │          │
│  │ + warrantyAcceptanceStatus (NEW)             │          │
│  │ + warrantyEligibilityNotes (NEW)             │          │
│  └──────────────────────────────────────────────┘          │
│                      ↓                                       │
│              Decision Point                                  │
│         ┌────────────┴────────────┐                         │
│         ↓                         ↓                          │
│    ELIGIBLE                  NOT_ELIGIBLE                    │
└─────────────────────────────────────────────────────────────┘
         ↓                         ↓
┌────────────────┐        ┌──────────────────┐
│ WARRANTY FLOW  │        │ NON-WARRANTY     │
│                │        │ (Third-Party)    │
│ - EVM Approval │        │ - Customer       │
│ - EVM Parts    │        │   Confirmation   │
│ - Work Order   │        │ - SC Parts       │
└────────────────┘        └──────────────────┘
```

---

## 📅 CHI TIẾT TỪNG SPRINT

### SPRINT 1: Foundation Layer (3.5 ngày)
**Mục tiêu**: Tạo nền tảng quản lý VehicleModel & WarrantyConditions

#### Day 1: VehicleModel Enhancement
- [x] Review VehicleModelController (đã có)
- [x] Review VehicleModelService (đã có)
- [ ] **TODO**: Test API endpoints
- [ ] **TODO**: Verify permissions cho EVM/SC Staff/Technician

**Files to check**:
- ✓ `VehicleModelController.java` - Done
- ✓ `VehicleModelServiceImpl.java` - Done
- ✓ `VehicleModel.java` - Done

#### Day 2-3: WarrantyConditions System (NEW)

**Step 1**: Database Migration
```sql
-- File: V1.x__Add_Warranty_Conditions.sql
CREATE TABLE warranty_conditions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_model_id INT NOT NULL,
    
    coverage_years INT NOT NULL DEFAULT 3,
    coverage_km INT NOT NULL DEFAULT 100000,
    
    conditions_text TEXT NOT NULL,
    exclusions_text TEXT,
    
    battery_warranty_years INT DEFAULT 8,
    battery_warranty_km INT DEFAULT 160000,
    
    motor_warranty_years INT DEFAULT 5,
    motor_warranty_km INT DEFAULT 100000,
    
    require_service_history BOOLEAN DEFAULT FALSE,
    max_gap_between_services_months INT DEFAULT 12,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    
    FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Sample data
INSERT INTO warranty_conditions (vehicle_model_id, coverage_years, coverage_km, conditions_text, created_by)
VALUES 
(1, 3, 100000, 'Standard 3-year/100,000km warranty. Battery covered for 8 years/160,000km.', 2);
```

**Step 2**: Create Entity
```java
// File: WarrantyCondition.java
@Entity
@Table(name = "warranty_conditions")
public class WarrantyCondition {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne
    @JoinColumn(name = "vehicle_model_id")
    private VehicleModel vehicleModel;
    
    private Integer coverageYears;
    private Integer coverageKm;
    private String conditionsText;
    private String exclusionsText;
    
    private Integer batteryWarrantyYears;
    private Integer batteryWarrantyKm;
    private Integer motorWarrantyYears;
    private Integer motorWarrantyKm;
    
    private Boolean requireServiceHistory;
    private Integer maxGapBetweenServicesMonths;
    
    private Boolean active;
    // ...getters/setters
}
```

**Step 3**: DTOs
```java
// WarrantyConditionRequestDTO.java
@Data
public class WarrantyConditionRequestDTO {
    @NotNull private Integer vehicleModelId;
    @NotNull private Integer coverageYears;
    @NotNull private Integer coverageKm;
    @NotNull private String conditionsText;
    private String exclusionsText;
    // ... other fields
}

// WarrantyConditionResponseDTO.java
@Data
public class WarrantyConditionResponseDTO {
    private Integer id;
    private VehicleModelDTO vehicleModel;
    private Integer coverageYears;
    // ... all fields
}
```

**Step 4**: Service & Controller
```java
// WarrantyConditionService.java (interface)
public interface WarrantyConditionService {
    WarrantyConditionResponseDTO create(WarrantyConditionRequestDTO dto, String username);
    WarrantyConditionResponseDTO update(Integer id, WarrantyConditionRequestDTO dto);
    WarrantyConditionResponseDTO getById(Integer id);
    WarrantyConditionResponseDTO getByVehicleModelId(Integer modelId);
    List<WarrantyConditionResponseDTO> getAll();
    void delete(Integer id);
}

// WarrantyConditionController.java
@RestController
@RequestMapping("/api/warranty-conditions")
public class WarrantyConditionController {
    
    @GetMapping("/vehicle-model/{modelId}")
    @PreAuthorize("hasAnyAuthority('SC_STAFF','SC_TECHNICIAN','EVM_STAFF')")
    public ResponseEntity<WarrantyConditionResponseDTO> getByVehicleModel(@PathVariable Integer modelId) {
        // ...
    }
    
    @PostMapping
    @PreAuthorize("hasAuthority('EVM_STAFF')")
    public ResponseEntity<WarrantyConditionResponseDTO> create(@Valid @RequestBody WarrantyConditionRequestDTO dto) {
        // ...
    }
    // ... other CRUD endpoints
}
```

**Step 5**: Update VehicleController
```java
// Modify VehicleRegisterRequestDTO.java
@Data
public class VehicleRegisterRequestDTO {
    private String vin;
    private String licensePlate;
    
    @NotNull
    private Integer vehicleModelId;  // CHANGE: from String model to Integer vehicleModelId
    
    private Integer year;
    // ...
}

// Update VehicleServiceImpl.java
public VehicleResponseDTO registerVehicle(VehicleRegisterRequestDTO dto) {
    // Validate vehicleModelId exists
    VehicleModel model = vehicleModelRepository.findById(dto.getVehicleModelId())
        .orElseThrow(() -> new NotFoundException("Vehicle model not found"));
    
    Vehicle vehicle = new Vehicle();
    vehicle.setVehicleModel(model);
    vehicle.setModel(model.getName());  // Store name for quick access
    // ...
}
```

---

### SPRINT 2: Core Warranty Logic (4 ngày)

#### Day 1: Database Schema for Warranty Acceptance

```sql
-- File: V1.x__Add_Warranty_Acceptance_Fields.sql
ALTER TABLE claims ADD COLUMN warranty_acceptance_status VARCHAR(50);
ALTER TABLE claims ADD COLUMN warranty_eligibility_notes TEXT;
ALTER TABLE claims ADD COLUMN warranty_condition_checked_at TIMESTAMP;
ALTER TABLE claims ADD COLUMN warranty_condition_checked_by INT;
ALTER TABLE claims ADD CONSTRAINT fk_warranty_checked_by 
    FOREIGN KEY (warranty_condition_checked_by) REFERENCES users(id);

-- Add index
CREATE INDEX idx_claims_warranty_status ON claims(warranty_acceptance_status);
```

#### Day 2: Entity & DTO Updates

**Update Claim.java**:
```java
@Entity
@Table(name = "claims")
public class Claim {
    // ...existing fields...
    
    @Column(name = "warranty_acceptance_status", length = 50)
    private String warrantyAcceptanceStatus; 
    // Values: PENDING_EVALUATION / ELIGIBLE / NOT_ELIGIBLE
    
    @Column(name = "warranty_eligibility_notes", columnDefinition = "TEXT")
    private String warrantyEligibilityNotes;
    
    @Column(name = "warranty_condition_checked_at")
    private LocalDateTime warrantyConditionCheckedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warranty_condition_checked_by")
    private User warrantyConditionCheckedBy;
    
    // ...
}
```

**Update ClaimDiagnosticRequest.java**:
```java
@Data
public class ClaimDiagnosticRequest {
    // ...existing fields...
    
    @NotNull(message = "Warranty acceptance status is required")
    private String warrantyAcceptanceStatus; // ELIGIBLE / NOT_ELIGIBLE
    
    private String warrantyEligibilityNotes; // Required if NOT_ELIGIBLE
    
    // ...
}
```

**Update ClaimResponseDto.java**:
```java
@Data
public class ClaimResponseDto {
    // ...existing fields...
    
    private String warrantyAcceptanceStatus;
    private String warrantyEligibilityNotes;
    private LocalDateTime warrantyConditionCheckedAt;
    private UserInfoDto warrantyConditionCheckedBy;
    
    // Add warranty condition info for display
    private WarrantyConditionResponseDTO applicableWarrantyCondition;
}
```

#### Day 3: Update ClaimServiceImpl Logic

```java
@Override
@Transactional
public ClaimResponseDto updateDiagnostic(ClaimDiagnosticRequest request) {
    Claim claim = claimRepository.findById(request.getClaimId())
        .orElseThrow(() -> new NotFoundException("Claim not found"));
    
    // Validate status
    if (!claim.getStatus().getCode().equals("IN_PROGRESS")) {
        throw new BadRequestException("Can only update diagnostic for IN_PROGRESS claims");
    }
    
    // Update diagnostic fields
    claimMapper.updateEntityFromDiagnosticRequest(claim, request);
    
    // 🆕 HANDLE WARRANTY ACCEPTANCE
    String warrantyStatus = request.getWarrantyAcceptanceStatus();
    
    if ("ELIGIBLE".equals(warrantyStatus)) {
        // ✅ Case A: Warranty eligible → Send to EVM
        handleEligibleClaim(claim, request);
        
    } else if ("NOT_ELIGIBLE".equals(warrantyStatus)) {
        // ⚠️ Case B: Not eligible → Wait for customer decision
        handleNotEligibleClaim(claim, request);
        
    } else {
        throw new BadRequestException("Invalid warranty acceptance status");
    }
    
    claim = claimRepository.save(claim);
    
    // Create status history
    createStatusHistory(claim, "Diagnostic updated with warranty evaluation");
    
    return claimMapper.toResponseDto(claim);
}

private void handleEligibleClaim(Claim claim, ClaimDiagnosticRequest request) {
    // Update warranty fields
    claim.setWarrantyAcceptanceStatus("ELIGIBLE");
    claim.setWarrantyEligibilityNotes(request.getWarrantyEligibilityNotes());
    claim.setWarrantyConditionCheckedAt(LocalDateTime.now());
    claim.setWarrantyConditionCheckedBy(getCurrentUser());
    
    // Change status to PENDING_EVM_APPROVAL
    ClaimStatus pendingEvmStatus = claimStatusRepository.findByCode("PENDING_EVM_APPROVAL")
        .orElseThrow(() -> new NotFoundException("Status not found"));
    claim.setStatus(pendingEvmStatus);
    
    // 🔔 Send notification to EVM Staff
    notificationService.notifyEvmStaff(claim, "New claim awaiting EVM approval");
    
    log.info("Claim {} marked as WARRANTY ELIGIBLE, sent to EVM approval", claim.getClaimNumber());
}

private void handleNotEligibleClaim(Claim claim, ClaimDiagnosticRequest request) {
    // Validate eligibility notes required
    if (request.getWarrantyEligibilityNotes() == null || request.getWarrantyEligibilityNotes().isBlank()) {
        throw new BadRequestException("Eligibility notes required when marking claim as not eligible");
    }
    
    // Update warranty fields
    claim.setWarrantyAcceptanceStatus("NOT_ELIGIBLE");
    claim.setWarrantyEligibilityNotes(request.getWarrantyEligibilityNotes());
    claim.setWarrantyConditionCheckedAt(LocalDateTime.now());
    claim.setWarrantyConditionCheckedBy(getCurrentUser());
    
    // Change status to WAITING_FOR_CUSTOMER
    ClaimStatus waitingStatus = claimStatusRepository.findByCode("WAITING_FOR_CUSTOMER")
        .orElseThrow(() -> new NotFoundException("Status not found"));
    claim.setStatus(waitingStatus);
    
    // 🔔 Notify SC Staff to contact customer
    notificationService.notifyScStaff(claim, "Customer contact needed - non-warranty claim");
    
    log.info("Claim {} marked as NOT ELIGIBLE, waiting for customer decision", claim.getClaimNumber());
}
```

#### Day 4: Add Customer Decision Endpoint

```java
// ClaimController.java - Add new endpoint
@PostMapping("/{id}/customer-decision")
@PreAuthorize("hasAuthority('SC_STAFF')")
public ResponseEntity<ClaimResponseDto> recordCustomerDecision(
        @PathVariable Integer id,
        @RequestBody CustomerDecisionRequest request) {
    
    return ResponseEntity.ok(claimService.recordCustomerDecision(id, request));
}

// CustomerDecisionRequest.java (NEW DTO)
@Data
public class CustomerDecisionRequest {
    @NotNull
    private Boolean acceptsThirdPartyRepair;  // true/false
    
    private String notes;  // SC Staff notes about conversation
}

// ClaimServiceImpl.java - Add method
@Transactional
public ClaimResponseDto recordCustomerDecision(Integer claimId, CustomerDecisionRequest request) {
    Claim claim = claimRepository.findById(claimId)
        .orElseThrow(() -> new NotFoundException("Claim not found"));
    
    if (!"WAITING_FOR_CUSTOMER".equals(claim.getStatus().getCode())) {
        throw new BadRequestException("Claim is not waiting for customer decision");
    }
    
    if (request.getAcceptsThirdPartyRepair()) {
        // Customer agrees → READY_FOR_REPAIR with third-party parts
        ClaimStatus readyStatus = claimStatusRepository.findByCode("READY_FOR_REPAIR")
            .orElseThrow(() -> new NotFoundException("Status not found"));
        claim.setStatus(readyStatus);
        
        createStatusHistory(claim, "Customer accepted third-party repair: " + request.getNotes());
        
        log.info("Claim {} - Customer accepted third-party repair", claim.getClaimNumber());
        
    } else {
        // Customer declines → CANCELLED
        ClaimStatus cancelledStatus = claimStatusRepository.findByCode("CANCELLED")
            .orElseThrow(() -> new NotFoundException("Status not found"));
        claim.setStatus(cancelledStatus);
        
        createStatusHistory(claim, "Customer declined repair: " + request.getNotes());
        
        log.info("Claim {} - Customer declined, claim cancelled", claim.getClaimNumber());
    }
    
    claim = claimRepository.save(claim);
    return claimMapper.toResponseDto(claim);
}
```

---

### SPRINT 3: Third-Party Parts (4.5 ngày)

#### Day 1: Database Schema

```sql
-- File: V1.x__Add_Third_Party_Parts.sql

CREATE TABLE sc_third_party_parts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    part_name VARCHAR(200) NOT NULL,
    part_number VARCHAR(100),
    category VARCHAR(100),
    description TEXT,
    
    supplier_name VARCHAR(200),
    supplier_contact VARCHAR(200),
    
    unit_cost DECIMAL(12,2),
    
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE sc_third_party_part_serials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    third_party_part_id INT NOT NULL,
    serial_number VARCHAR(150) UNIQUE NOT NULL,
    
    purchase_date DATE,
    unit_cost DECIMAL(12,2),
    
    status VARCHAR(50) DEFAULT 'in_stock',
    
    installed_on_vehicle_id INT,
    installed_at TIMESTAMP,
    installed_by INT,
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (third_party_part_id) REFERENCES sc_third_party_parts(id),
    FOREIGN KEY (installed_on_vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (installed_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_sc_tp_parts_active ON sc_third_party_parts(active);
CREATE INDEX idx_sc_tp_serials_status ON sc_third_party_part_serials(status);
```

#### Day 2: Entities

```java
// SCThirdPartyPart.java
@Entity
@Table(name = "sc_third_party_parts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SCThirdPartyPart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "part_name", nullable = false)
    private String partName;
    
    @Column(name = "part_number")
    private String partNumber;
    
    private String category;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "supplier_name")
    private String supplierName;
    
    @Column(name = "supplier_contact")
    private String supplierContact;
    
    @Column(name = "unit_cost")
    private BigDecimal unitCost;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    private Boolean active;
}

// SCThirdPartyPartSerial.java
@Entity
@Table(name = "sc_third_party_part_serials")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SCThirdPartyPartSerial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "third_party_part_id")
    private SCThirdPartyPart thirdPartyPart;
    
    @Column(name = "serial_number", unique = true, nullable = false)
    private String serialNumber;
    
    @Column(name = "purchase_date")
    private LocalDate purchaseDate;
    
    @Column(name = "unit_cost")
    private BigDecimal unitCost;
    
    private String status; // in_stock / allocated / installed
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "installed_on_vehicle_id")
    private Vehicle installedOnVehicle;
    
    @Column(name = "installed_at")
    private LocalDateTime installedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "installed_by")
    private User installedBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
```

#### Day 3-4: Service & Controller

```java
// SCThirdPartyPartController.java
@RestController
@RequestMapping("/api/sc/third-party-parts")
@RequiredArgsConstructor
public class SCThirdPartyPartController {
    
    private final SCThirdPartyPartService service;
    
    @GetMapping
    @PreAuthorize("hasAnyAuthority('SC_STAFF','SC_TECHNICIAN')")
    public ResponseEntity<List<SCThirdPartyPartResponseDTO>> getAllParts() {
        return ResponseEntity.ok(service.getAllActiveParts());
    }
    
    @PostMapping
    @PreAuthorize("hasAuthority('SC_STAFF')")
    public ResponseEntity<SCThirdPartyPartResponseDTO> createPart(
            @Valid @RequestBody SCThirdPartyPartRequestDTO dto,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.createPart(dto, auth.getName()));
    }
    
    @PostMapping("/{partId}/serials")
    @PreAuthorize("hasAuthority('SC_STAFF')")
    public ResponseEntity<SCThirdPartyPartSerialResponseDTO> addSerial(
            @PathVariable Integer partId,
            @Valid @RequestBody SCThirdPartyPartSerialRequestDTO dto,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.addSerial(partId, dto, auth.getName()));
    }
    
    @PutMapping("/serials/{serialId}/install")
    @PreAuthorize("hasAnyAuthority('SC_STAFF','SC_TECHNICIAN')")
    public ResponseEntity<SCThirdPartyPartSerialResponseDTO> installSerial(
            @PathVariable Integer serialId,
            @RequestBody InstallSerialRequest request,
            Authentication auth) {
        return ResponseEntity.ok(service.installSerial(serialId, request, auth.getName()));
    }
    
    // ... other endpoints
}
```

---

### SPRINT 4: Testing & Integration (5 ngày)

#### Day 1: Review EVM Parts APIs
- Check PartSerialController
- Check InventoryController
- Ensure complete CRUD operations

#### Day 2-3: WorkOrder Integration
- Update WorkOrder to support both EVM parts and third-party parts
- Add field `part_source` (EVM / THIRD_PARTY)
- Update WorkOrderPart to link with SCThirdPartyPartSerial

#### Day 4-5: End-to-End Testing
- Test Case 1: Warranty-eligible flow
- Test Case 2: Non-warranty flow with customer acceptance
- Test Case 3: Non-warranty flow with customer rejection
- Update Postman collections

---

### SPRINT 5: Vietnamese i18n (2 ngày)
- Add messages_vi.properties
- Localize error messages
- Localize response messages

---

## 📊 TIẾN ĐỘ THEO DÕI

| Sprint | Tasks | Status | Progress |
|--------|-------|--------|----------|
| Sprint 1 | Foundation | 🟡 In Progress | 30% |
| Sprint 2 | Core Logic | ⚪ Pending | 0% |
| Sprint 3 | Third-Party | ⚪ Pending | 0% |
| Sprint 4 | Testing | ⚪ Pending | 0% |
| Sprint 5 | i18n | ⚪ Pending | 0% |

**Tổng tiến độ**: 6% (1.2/19 ngày)

---

## ✅ CHECKLIST

### Sprint 1
- [ ] VehicleModel API tested
- [ ] WarrantyCondition entity created
- [ ] WarrantyCondition CRUD APIs
- [ ] Vehicle registration uses vehicleModelId
- [ ] Permissions verified

### Sprint 2
- [ ] Claim entity updated
- [ ] ClaimDiagnosticRequest updated
- [ ] handleEligibleClaim() implemented
- [ ] handleNotEligibleClaim() implemented
- [ ] CustomerDecision endpoint created

### Sprint 3
- [ ] Third-party parts schema created
- [ ] Entities & repositories created
- [ ] CRUD APIs implemented
- [ ] Serial installation logic

### Sprint 4
- [ ] EVM parts API reviewed
- [ ] WorkOrder updated
- [ ] End-to-end test case 1
- [ ] End-to-end test case 2
- [ ] Postman updated

### Sprint 5
- [ ] Vietnamese messages added
- [ ] All errors localized

---

**Next Action**: Start Sprint 1 Day 1 - Test VehicleModel APIs

