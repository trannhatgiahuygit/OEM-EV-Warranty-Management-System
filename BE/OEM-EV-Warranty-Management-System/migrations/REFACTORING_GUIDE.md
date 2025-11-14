# HƯỚNG DẪN REFACTOR CLAIM TABLE

## ✅ ĐÃ HOÀN THÀNH

### 1. Entities đã tạo:
- ✅ `ClaimDiagnostic.java` - Thông tin chẩn đoán
- ✅ `ClaimApproval.java` - Thông tin phê duyệt/từ chối
- ✅ `ClaimCancellation.java` - Thông tin hủy
- ✅ `ClaimWarrantyEligibility.java` - Đánh giá bảo hành
- ✅ `ClaimCost.java` - Thông tin chi phí
- ✅ `ClaimRepairConfiguration.java` - Cấu hình sửa chữa
- ✅ `ClaimAssignment.java` - Phân công kỹ thuật viên

### 2. Claim entity đã được refactor:
- ✅ Chỉ giữ lại core info (id, claimNumber, vehicle, customer, status, isActive, timestamps)
- ✅ Thêm 1:1 relationships với các entity mới
- ✅ Sử dụng `CascadeType.ALL` và `orphanRemoval = true` để tự động quản lý lifecycle

### 3. Migration script đã tạo:
- ✅ `001_refactor_claim_table.sql` - Script để tạo tables và migrate dữ liệu

---

## 📋 CÁC BƯỚC TIẾP THEO

### Bước 1: Build Project
```bash
# Build lại project để IDE nhận diện các entity mới
mvn clean compile
# hoặc
./gradlew clean build
```

### Bước 2: Chạy Migration Script
```sql
-- Chạy file: migrations/001_refactor_claim_table.sql
-- Script sẽ:
-- 1. Tạo các table mới
-- 2. Migrate dữ liệu từ claims sang các table mới
-- 3. Tạo indexes
```

**Lưu ý**: Script có check `IF NOT EXISTS` nên có thể chạy nhiều lần an toàn.

### Bước 3: Verify Migration
```sql
-- Uncomment phần verify trong migration script để kiểm tra
SELECT 'claims' AS table_name, COUNT(*) AS record_count FROM claims
UNION ALL
SELECT 'claim_diagnostics', COUNT(*) FROM claim_diagnostics
UNION ALL
SELECT 'claim_approvals', COUNT(*) FROM claim_approvals
-- ... etc
```

### Bước 4: Update Service Layer

Cần update các service để sử dụng các entity mới:

#### Ví dụ: ClaimService

**Trước:**
```java
claim.setReportedFailure(request.getReportedFailure());
claim.setInitialDiagnosis(request.getInitialDiagnosis());
```

**Sau:**
```java
ClaimDiagnostic diagnostic = ClaimDiagnostic.builder()
    .claim(claim)
    .reportedFailure(request.getReportedFailure())
    .initialDiagnosis(request.getInitialDiagnosis())
    .build();
claim.setDiagnostic(diagnostic);
```

#### Helper Methods (Optional)

Có thể thêm helper methods trong Claim entity:

```java
// Trong Claim.java
public ClaimDiagnostic getOrCreateDiagnostic() {
    if (this.diagnostic == null) {
        this.diagnostic = ClaimDiagnostic.builder()
            .claim(this)
            .build();
    }
    return this.diagnostic;
}

public ClaimApproval getOrCreateApproval() {
    if (this.approval == null) {
        this.approval = ClaimApproval.builder()
            .claim(this)
            .build();
    }
    return this.approval;
}
// ... tương tự cho các entity khác
```

### Bước 5: Update DTOs/Mappers

Cần update các DTO và Mapper để map từ nhiều entity:

```java
// ClaimResponseDto
public class ClaimResponseDto {
    // Core fields
    private Integer id;
    private String claimNumber;
    // ...
    
    // Nested DTOs
    private ClaimDiagnosticDto diagnostic;
    private ClaimApprovalDto approval;
    private ClaimCostDto cost;
    // ...
}

// ClaimMapper
public ClaimResponseDto toDto(Claim claim) {
    ClaimResponseDto dto = new ClaimResponseDto();
    // Map core fields
    dto.setId(claim.getId());
    dto.setClaimNumber(claim.getClaimNumber());
    
    // Map nested entities (lazy load)
    if (claim.getDiagnostic() != null) {
        dto.setDiagnostic(diagnosticMapper.toDto(claim.getDiagnostic()));
    }
    // ... tương tự
    return dto;
}
```

### Bước 6: Update Repositories

Có thể cần tạo repositories cho các entity mới nếu cần query riêng:

```java
public interface ClaimDiagnosticRepository extends JpaRepository<ClaimDiagnostic, Integer> {
    Optional<ClaimDiagnostic> findByClaimId(Integer claimId);
}

// Tương tự cho các entity khác
```

### Bước 7: Update Queries

Các query cũ cần được update:

**Trước:**
```java
@Query("SELECT c FROM Claim c WHERE c.reportedFailure LIKE %:keyword%")
```

**Sau:**
```java
@Query("SELECT c FROM Claim c JOIN c.diagnostic d WHERE d.reportedFailure LIKE %:keyword%")
```

### Bước 8: Test Thoroughly

1. **Unit Tests**: Test các entity mới
2. **Integration Tests**: Test các service với entities mới
3. **API Tests**: Test các endpoints
4. **Data Verification**: Verify dữ liệu đã migrate đúng

### Bước 9: Drop Old Columns (Sau khi verify)

**⚠️ CHỈ CHẠY SAU KHI ĐÃ VERIFY VÀ TEST THÀNH CÔNG!**

Uncomment phần STEP 4 trong migration script để drop các column cũ:

```sql
-- Uncomment trong 001_refactor_claim_table.sql
ALTER TABLE claims DROP COLUMN reported_failure;
ALTER TABLE claims DROP COLUMN initial_diagnosis;
-- ... etc
```

---

## 🔍 CÁC THAY ĐỔI QUAN TRỌNG

### 1. Lazy Loading
- Tất cả relationships đều dùng `FetchType.LAZY`
- Cần explicit fetch khi cần dữ liệu:
  ```java
  // Fetch diagnostic
  Hibernate.initialize(claim.getDiagnostic());
  // hoặc
  claim.getDiagnostic().getReportedFailure(); // trigger lazy load
  ```

### 2. Cascade Operations
- `CascadeType.ALL` + `orphanRemoval = true`
- Khi save/update/delete Claim, các entity con sẽ tự động được xử lý
- **Lưu ý**: Cần set relationship 2 chiều:
  ```java
  claim.setDiagnostic(diagnostic);
  diagnostic.setClaim(claim); // Quan trọng!
  ```

### 3. Null Safety
- Các entity con có thể null (không phải tất cả claim đều có diagnostic/approval/etc)
- Luôn check null trước khi access:
  ```java
  if (claim.getDiagnostic() != null) {
      String failure = claim.getDiagnostic().getReportedFailure();
  }
  ```

---

## 📝 CHECKLIST

- [ ] Build project thành công
- [ ] Chạy migration script
- [ ] Verify dữ liệu đã migrate đúng
- [ ] Update ClaimService
- [ ] Update ClaimMapper/DTOs
- [ ] Update các service khác sử dụng Claim
- [ ] Update repositories/queries
- [ ] Write/update unit tests
- [ ] Write/update integration tests
- [ ] Test API endpoints
- [ ] Code review
- [ ] Deploy to staging
- [ ] Test trên staging
- [ ] Deploy to production
- [ ] Monitor sau deploy
- [ ] Drop old columns (sau khi confirm mọi thứ OK)

---

## ⚠️ LƯU Ý

1. **Backward Compatibility**: Các column cũ vẫn còn trong database cho đến khi drop. Có thể giữ lại một thời gian để rollback nếu cần.

2. **Performance**: 
   - Lazy loading giúp giảm query không cần thiết
   - Nhưng cần cẩn thận với N+1 query problem
   - Sử dụng `@EntityGraph` hoặc `JOIN FETCH` khi cần

3. **Transaction**: Đảm bảo các operations trên nhiều entity được wrap trong transaction:
   ```java
   @Transactional
   public void updateClaim(Claim claim) {
       // Update claim và các entity con
   }
   ```

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Entity not found"
- Build lại project
- Clean và rebuild

### Lỗi: "LazyInitializationException"
- Sử dụng `@Transactional` trên service method
- Hoặc fetch explicit trước khi return

### Lỗi: "Data not migrated"
- Check migration script đã chạy chưa
- Check điều kiện WHERE trong INSERT statements
- Verify dữ liệu trong database

---

*Chúc bạn refactor thành công! 🚀*

