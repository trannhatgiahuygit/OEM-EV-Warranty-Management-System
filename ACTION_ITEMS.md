# ⚡ DANH SÁCH HÀNH ĐỘNG CẦN THỰC HIỆN
## Critical & High Priority Issues

**Ngày tạo:** 12/11/2025  
**Dựa trên:** DATABASE_AND_ARCHITECTURE_ASSESSMENT.md

---

## 🔴 CRITICAL PRIORITY (PHẢI LÀM TRƯỚC KHI PRODUCTION)

### ✅ 1. Remove Hardcoded Secrets (ĐÃ CẢI THIỆN PHẦN)

**Status:** 🟡 Partially Done

**Đã làm:**
- ✅ Tạo `application-sample.properties` với placeholders
- ✅ Update `.env.example` với tất cả biến môi trường
- ✅ Tạo `CONFIGURATION_GUIDE.md`

**Còn phải làm:**
```bash
# TODO 1: Backup application.properties hiện tại
cp src/main/resources/application.properties src/main/resources/application.properties.backup

# TODO 2: Xóa secrets khỏi application.properties
# Chỉnh sửa file để dùng environment variables thay vì hardcode

# TODO 3: Commit .gitignore update
git add .gitignore
git commit -m "chore: ensure application.properties with secrets is ignored"

# TODO 4: Document trong README.md
echo "## Configuration" >> README.md
echo "See CONFIGURATION_GUIDE.md for setup instructions" >> README.md
```

**File cần sửa:**
- `src/main/resources/application.properties` (remove hardcoded values)

---

### 🔴 2. Fix Duplicate Column Mapping

**Status:** ❌ Not Started

**Vấn đề:** 3 entities có duplicate mapping gây risk data inconsistency

#### A. Fix User Entity

**File:** `src/main/java/com/ev/warranty/model/entity/User.java`

**Hiện tại (SAI):**
```java
@Column(name = "service_center_id")
private Integer serviceCenterId; // ❌ Duplicate

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "service_center_id", insertable = false, updatable = false)
private ServiceCenter serviceCenter; // ❌ Read-only relation
```

**Sửa thành:**
```java
// ✅ Chỉ giữ relation
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "service_center_id")
private ServiceCenter serviceCenter;

// ✅ Helper method để get ID
public Integer getServiceCenterId() {
    return serviceCenter != null ? serviceCenter.getId() : null;
}

public void setServiceCenterId(Integer serviceCenterId) {
    if (serviceCenterId != null) {
        ServiceCenter sc = new ServiceCenter();
        sc.setId(serviceCenterId);
        this.serviceCenter = sc;
    } else {
        this.serviceCenter = null;
    }
}
```

**Impact Assessment:**
```bash
# Tìm tất cả nơi dùng user.getServiceCenterId()
grep -r "getServiceCenterId" src/

# Tìm tất cả nơi dùng user.setServiceCenterId()
grep -r "setServiceCenterId" src/
```

**Testing:**
```java
// Test case cần thêm
@Test
void testServiceCenterIdConsistency() {
    User user = new User();
    ServiceCenter sc = new ServiceCenter();
    sc.setId(1);
    
    user.setServiceCenter(sc);
    assertEquals(1, user.getServiceCenterId());
    
    user.setServiceCenterId(2);
    assertEquals(2, user.getServiceCenter().getId());
}
```

#### B. Fix Shipment Entity

**File:** `src/main/java/com/ev/warranty/model/entity/Shipment.java`

**Hiện tại (SAI):**
```java
@Column(name = "destination_center_id")
private Integer destinationCenterId; // ❌

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "destination_center_id", insertable = false, updatable = false)
private ServiceCenter destinationServiceCenter; // ❌
```

**Sửa tương tự User:**
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "destination_center_id")
private ServiceCenter destinationServiceCenter;

public Integer getDestinationCenterId() {
    return destinationServiceCenter != null ? destinationServiceCenter.getId() : null;
}
```

#### C. Fix ThirdPartyPart Entity

**File:** `src/main/java/com/ev/warranty/model/entity/ThirdPartyPart.java`

**Hiện tại (SAI):**
```java
@Column(name = "service_center_id")
private Integer serviceCenterId; // ❌ Nên là @ManyToOne
```

**Sửa thành:**
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "service_center_id")
private ServiceCenter serviceCenter;

public Integer getServiceCenterId() {
    return serviceCenter != null ? serviceCenter.getId() : null;
}
```

**Migration Plan:**
```sql
-- Không cần migration SQL vì column name không đổi
-- Chỉ cần update Java code và test kỹ
```

**Estimated Effort:** 4-6 hours
- Code changes: 2 hours
- Testing: 2 hours
- Code review: 1-2 hours

---

## 🟡 HIGH PRIORITY (NÊN LÀM TRƯỚC KHI PRODUCTION)

### 🟡 3. Add Composite Indexes

**Status:** ❌ Not Started

**File:** Các entity files trong `src/main/java/com/ev/warranty/model/entity/`

**Indexes cần thêm:**

#### A. Inventory (warehouse + part lookup)
```java
@Entity
@Table(name = "inventory", indexes = {
    @Index(name = "idx_inventory_warehouse_part", 
           columnList = "warehouse_id, part_id", 
           unique = true)
})
public class Inventory { ... }
```

#### B. WorkOrder (claim + status filtering)
```java
@Entity
@Table(name = "work_orders", indexes = {
    @Index(name = "idx_workorder_claim_status", 
           columnList = "claim_id, status")
})
public class WorkOrder { ... }
```

#### C. ServiceHistory (vehicle + date range queries)
```java
@Entity
@Table(name = "service_history", indexes = {
    @Index(name = "idx_service_vehicle_date", 
           columnList = "vehicle_id, performed_at")
})
public class ServiceHistory { ... }
```

#### D. ClaimStatusHistory (claim + change tracking)
```java
@Entity
@Table(name = "claim_status_history", indexes = {
    @Index(name = "idx_status_history_claim_date", 
           columnList = "claim_id, changed_at")
})
public class ClaimStatusHistory { ... }
```

**Testing:**
```sql
-- Before: Kiểm tra query plan
EXPLAIN SELECT * FROM inventory WHERE warehouse_id = 1 AND part_id = 5;

-- After index: Verify index được sử dụng
-- Execution time nên giảm đáng kể với large dataset
```

**Estimated Effort:** 2-3 hours

---

### 🟡 4. Implement Soft Delete

**Status:** ❌ Not Started

**Entities cần soft delete:**
- Claim
- WorkOrder
- Vehicle
- Customer

**Example Implementation:**

**File:** `src/main/java/com/ev/warranty/model/entity/Claim.java`

```java
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "claims")
@SQLDelete(sql = "UPDATE claims SET deleted = true, deleted_at = GETDATE() WHERE id = ?")
@Where(clause = "deleted = false OR deleted IS NULL")
public class Claim {
    
    @Column(name = "deleted")
    @Builder.Default
    private Boolean deleted = false;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by")
    private User deletedBy;
    
    // Soft delete method
    public void softDelete(User deletedBy) {
        this.deleted = true;
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = deletedBy;
    }
}
```

**Service Layer:**
```java
@Transactional
public void deleteClaim(Integer claimId, Integer userId) {
    Claim claim = claimRepository.findById(claimId)
        .orElseThrow(() -> new ClaimNotFoundException(claimId));
    
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new UserNotFoundException(userId));
    
    claim.softDelete(user);
    claimRepository.save(claim); // Triggers @SQLDelete
}
```

**Migration SQL:**
```sql
-- Add soft delete columns
ALTER TABLE claims ADD deleted BIT DEFAULT 0;
ALTER TABLE claims ADD deleted_at DATETIME2;
ALTER TABLE claims ADD deleted_by INT;

ALTER TABLE work_orders ADD deleted BIT DEFAULT 0;
ALTER TABLE work_orders ADD deleted_at DATETIME2;
ALTER TABLE work_orders ADD deleted_by INT;

-- Add foreign key
ALTER TABLE claims 
ADD CONSTRAINT FK_claims_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES users(id);
```

**Estimated Effort:** 6-8 hours
- Code changes: 3-4 hours
- Migration: 1 hour
- Testing: 2-3 hours

---

## 🟢 MEDIUM PRIORITY (CẢI THIỆN CHẤT LƯỢNG)

### 🟢 5. Add Bean Validation

**Status:** ❌ Not Started

**File:** DTO classes trong `src/main/java/com/ev/warranty/model/dto/`

**Example:**

```java
import jakarta.validation.constraints.*;

public class CreateClaimRequest {
    
    @NotNull(message = "Vehicle ID is required")
    @Positive(message = "Vehicle ID must be positive")
    private Integer vehicleId;
    
    @NotNull(message = "Customer ID is required")
    @Positive(message = "Customer ID must be positive")
    private Integer customerId;
    
    @NotBlank(message = "Reported failure cannot be empty")
    @Size(min = 10, max = 5000, message = "Reported failure must be between 10-5000 characters")
    private String reportedFailure;
    
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Invalid phone number format")
    private String contactPhone;
    
    @Email(message = "Invalid email format")
    private String contactEmail;
}
```

**Controller:**
```java
@PostMapping
public ResponseEntity<ClaimDTO> createClaim(
    @Valid @RequestBody CreateClaimRequest request) { // ✅ @Valid
    // ...
}
```

**Global Exception Handler:**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        
        Map<String, String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage
            ));
        
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("Validation failed", errors));
    }
}
```

**Estimated Effort:** 4-5 hours

---

### 🟢 6. Add Transaction Isolation

**Status:** ❌ Not Started

**Vấn đề:** Race condition khi multiple users allocate cùng 1 part serial

**File:** `src/main/java/com/ev/warranty/service/impl/PartSerialServiceImpl.java`

```java
@Transactional(isolation = Isolation.REPEATABLE_READ)
public PartSerialDTO allocatePartSerial(Integer partSerialId, Integer claimId) {
    // Đọc và update trong cùng transaction
    PartSerial partSerial = partSerialRepository.findById(partSerialId)
        .orElseThrow(() -> new PartSerialNotFoundException(partSerialId));
    
    if (!"in_stock".equals(partSerial.getStatus())) {
        throw new PartSerialAlreadyAllocatedException(partSerialId);
    }
    
    partSerial.setStatus("allocated");
    // Save...
}
```

**Testing Concurrency:**
```java
@Test
void testConcurrentPartAllocation() throws Exception {
    Integer partSerialId = 1;
    
    // Simulate 2 threads trying to allocate same part
    ExecutorService executor = Executors.newFixedThreadPool(2);
    
    Callable<Boolean> task = () -> {
        try {
            partSerialService.allocatePartSerial(partSerialId, 123);
            return true;
        } catch (PartSerialAlreadyAllocatedException e) {
            return false;
        }
    };
    
    Future<Boolean> future1 = executor.submit(task);
    Future<Boolean> future2 = executor.submit(task);
    
    // Only 1 should succeed
    assertTrue(future1.get() ^ future2.get());
}
```

**Estimated Effort:** 3-4 hours

---

## 🟣 LOW PRIORITY (NICE TO HAVE)

### 🟣 7. Add Domain Events

**Status:** ❌ Not Started

**Pattern:** Event-driven architecture để decouple services

**Example:**

```java
// Event
public class ClaimApprovedEvent {
    private Integer claimId;
    private Integer approvedBy;
    private LocalDateTime approvedAt;
}

// Publisher
@Service
public class ClaimServiceImpl {
    private final ApplicationEventPublisher eventPublisher;
    
    @Transactional
    public void approveClaim(Integer claimId) {
        // ... approve logic
        eventPublisher.publishEvent(new ClaimApprovedEvent(claimId, userId, now));
    }
}

// Listener
@Component
public class InventoryEventListener {
    
    @EventListener
    @Transactional
    public void onClaimApproved(ClaimApprovedEvent event) {
        // Automatically reserve parts
        inventoryService.reservePartsForClaim(event.getClaimId());
    }
}
```

**Estimated Effort:** 8-10 hours

---

### 🟣 8. Add JavaDoc

**Status:** ❌ Not Started

**Target:** All public service methods

**Example:**
```java
/**
 * Creates a new warranty claim for a vehicle.
 * 
 * <p>This method validates the vehicle warranty status and creates
 * a claim with initial status "OPEN".</p>
 * 
 * @param request The claim creation request containing vehicle ID, 
 *                customer ID, and reported failure details
 * @return The created claim DTO with generated claim number
 * @throws VehicleNotFoundException if the specified vehicle does not exist
 * @throws WarrantyExpiredException if the vehicle warranty has expired
 * @throws InvalidClaimException if the request validation fails
 * 
 * @see ClaimDTO
 * @see CreateClaimRequest
 */
@Transactional
public ClaimDTO createClaim(CreateClaimRequest request) { ... }
```

**Estimated Effort:** 10-12 hours (for all services)

---

## 📊 EFFORT SUMMARY

| Priority | Tasks | Estimated Hours | Status |
|----------|-------|-----------------|--------|
| 🔴 Critical | 2 | 4-10 hours | 1 partial done |
| 🟡 High | 3 | 11-16 hours | 0 done |
| 🟢 Medium | 2 | 7-9 hours | 0 done |
| 🟣 Low | 2 | 18-22 hours | 0 done |
| **TOTAL** | **9** | **40-57 hours** | **11% done** |

---

## 📋 SPRINT PLANNING RECOMMENDATION

### Sprint 1 (1 week): Critical Issues
- [ ] Task 1: Remove hardcoded secrets (finish remaining work)
- [ ] Task 2: Fix duplicate column mapping (3 entities)

### Sprint 2 (1 week): High Priority
- [ ] Task 3: Add composite indexes
- [ ] Task 4: Implement soft delete

### Sprint 3 (1 week): Medium Priority
- [ ] Task 5: Add bean validation
- [ ] Task 6: Add transaction isolation

### Sprint 4+ (Optional): Low Priority
- [ ] Task 7: Domain events
- [ ] Task 8: JavaDoc

---

## 🔍 VERIFICATION CHECKLIST

Sau khi hoàn thành mỗi task, verify:

- [ ] Code compiled successfully
- [ ] All tests pass
- [ ] Manual testing done
- [ ] Code reviewed by peer
- [ ] Documentation updated
- [ ] No new security vulnerabilities
- [ ] Performance impact assessed
- [ ] Backward compatibility maintained

---

**Tạo bởi:** GitHub Copilot  
**Cập nhật:** 12/11/2025  
**Version:** 1.0

