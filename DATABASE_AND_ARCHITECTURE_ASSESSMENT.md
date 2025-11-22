# 📊 ĐÁNH GIÁ CƠ SỞ DỮ LIỆU & KIẾN TRÚC HỆ THỐNG
## OEM EV Warranty Management System

**Ngày đánh giá:** 12/11/2025  
**Phiên bản:** v1.0  
**Đánh giá bởi:** GitHub Copilot

---

## 📋 TỔNG QUAN

Project là một hệ thống monolithic sử dụng Spring Boot 3.5.6 với JPA/Hibernate để quản lý bảo hành xe điện. Hệ thống có 25+ entities và tuân thủ kiến trúc layered (Controller → Service → Repository).

---

## 🗄️ 1. ĐÁNH GIÁ CƠ SỞ DỮ LIỆU

### ✅ **ĐIỂM MẠNH**

#### 1.1 Chuẩn hóa Database (Normalization)
- **Đạt chuẩn 3NF:** Database được thiết kế tốt, không có dependency bắc cầu
- **Tách bảng tra cứu (Lookup Tables):**
  - `roles`: Quản lý vai trò người dùng
  - `claim_statuses`: Quản lý trạng thái claim
  - `vehicle_models`: Quản lý mẫu xe
  - `parts`: Master data linh kiện
  
- **Bảng nhiều-nhiều đúng chuẩn:**
  - `work_order_parts`: Liên kết work_order ↔ part
  - `shipment_items`: Liên kết shipment ↔ part
  - `campaign_vehicles`: Liên kết recall_campaign ↔ vehicle

#### 1.2 Quan hệ Khóa Ngoại (Foreign Keys)
✅ **ĐÚNG:** Tất cả các mối quan hệ đều có `@JoinColumn` với khóa ngoại hợp lệ

**Ví dụ quan hệ tốt:**
```java
// Vehicle → Customer (Many-to-One)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "customer_id", nullable = false)
private Customer customer;

// Claim → Vehicle (Many-to-One)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "vehicle_id", nullable = false)
private Vehicle vehicle;

// WorkOrder → Claim (Many-to-One)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "claim_id", nullable = false)
private Claim claim;
```

#### 1.3 Indexing Strategy
✅ **TỐT:** Sử dụng `unique=true` cho các cột cần index:
- `User.username` (unique)
- `Vehicle.vin` (unique)
- `Claim.claimNumber` (unique)
- `Part.partNumber` (unique)
- `ClaimStatus.code` (unique)

#### 1.4 Lazy Loading
✅ **XUẤT SẮC:** Tất cả mối quan hệ đều dùng `FetchType.LAZY` để tránh N+1 query
```java
@ManyToOne(fetch = FetchType.LAZY) // ✅ Đúng
@JoinColumn(name = "customer_id", nullable = false)
private Customer customer;
```

#### 1.5 Audit Trail (Truy vết thay đổi)
✅ **TỐT:** Có bảng `claim_status_history` để theo dõi lịch sử thay đổi trạng thái
```java
@Entity
@Table(name = "claim_status_history")
public class ClaimStatusHistory {
    @ManyToOne private Claim claim;
    @ManyToOne private ClaimStatus status;
    @ManyToOne private User changedBy;
    @CreationTimestamp private LocalDateTime changedAt;
    private String note;
}
```

#### 1.6 Timestamp Management
✅ **CHUẨN:** Sử dụng annotation Hibernate cho audit:
```java
@CreationTimestamp
@Column(name = "created_at")
private LocalDateTime createdAt;

@UpdateTimestamp
@Column(name = "updated_at")
private LocalDateTime updatedAt;
```

#### 1.7 Unicode Support
✅ **ĐẦY ĐỦ:** Hỗ trợ tiếng Việt bằng `NVARCHAR`:
```java
@Column(name = "name", columnDefinition = "NVARCHAR(200)")
private String name;
```

---

### ⚠️ **VẤN ĐỀ & KHUYẾN NGHỊ**

#### 1.8 User-ServiceCenter Relationship Issues
**VẤN ĐỀ NGHIÊM TRỌNG 🔴:** Duplicate mapping trong `User` entity

```java
// ❌ KHÔNG AN TOÀN: serviceCenterId có 2 cách map
@Column(name = "service_center_id")
private Integer serviceCenterId; // Writable column

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "service_center_id", insertable = false, updatable = false)
private ServiceCenter serviceCenter; // Read-only relation
```

**HẬU QUẢ:**
- Có thể gây mất đồng bộ giữa `serviceCenterId` (số) và `serviceCenter` (object)
- Nếu update `serviceCenterId` trực tiếp → `serviceCenter` không sync
- Vi phạm Single Source of Truth principle

**GIẢI PHÁP ĐỀ XUẤT:**
```java
// ✅ ĐÚNG: Chỉ dùng 1 cách map
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "service_center_id")
private ServiceCenter serviceCenter;

// Accessor method nếu cần ID
public Integer getServiceCenterId() {
    return serviceCenter != null ? serviceCenter.getId() : null;
}
```

#### 1.9 Shipment có cùng vấn đề
```java
// ❌ Tương tự User
@Column(name = "destination_center_id")
private Integer destinationCenterId;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "destination_center_id", insertable = false, updatable = false)
private ServiceCenter destinationServiceCenter;
```

#### 1.10 ThirdPartyPart có duplicate serviceCenterId
```java
@Column(name = "service_center_id")
private Integer serviceCenterId; // ❌ Nên là @ManyToOne
```

**KHUYẾN NGHỊ:** Nên thay bằng:
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "service_center_id")
private ServiceCenter serviceCenter;
```

#### 1.11 Missing Composite Indexes
**THIẾU:** Các query thường xuyên thiếu composite index:
```sql
-- Query thường dùng nhưng chưa có index
WHERE warehouse_id = ? AND part_id = ? -- Inventory
WHERE claim_id = ? AND status = ?      -- WorkOrder
WHERE vehicle_id = ? AND created_at > ? -- ServiceHistory
```

**GIẢI PHÁP:**
```java
@Table(name = "inventory", indexes = {
    @Index(name = "idx_warehouse_part", columnList = "warehouse_id, part_id")
})
public class Inventory { ... }
```

#### 1.12 Soft Delete Missing
**THIẾU:** Không có cơ chế soft delete cho dữ liệu nhạy cảm
- Claims có thể bị xóa vĩnh viễn → mất audit trail
- WorkOrders bị xóa → mất lịch sử sửa chữa

**KHUYẾN NGHỊ:**
```java
@Entity
@SQLDelete(sql = "UPDATE claims SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class Claim {
    @Column(name = "deleted")
    private Boolean deleted = false;
}
```

---

## ⚙️ 2. ĐÁNH GIÁ CẤU HÌNH HỆ THỐNG

### ⚠️ **VẤN ĐỀ NGHIÊM TRỌNG: HARDCODED SECRETS**

#### 2.1 application.properties có hardcode secrets 🔴

**HIỆN TẠI (KHÔNG AN TOÀN):**
```properties
# ❌ Hardcoded database password
spring.datasource.password=12345

# ❌ Hardcoded JWT secret
spring.app.secret=HyyNeverGonnaGiveYouUp

# ❌ Hardcoded Gemini API key
ai.gemini.api-key=${GEMINI_API_KEY:AIzaSyDb0wbgzlGYjEMpjWxDoJMok_SDcOeYtE8}

# ❌ Hardcoded VNPay credentials
vnpay.tmnCode=3LM60U0F
vnpay.hashSecret=32H3JYZG8L19NTXTPOHCWC3BW94SSMU4
```

**RỦI RO:**
- ✗ Secrets bị commit vào Git → có thể leak
- ✗ Không thể dùng secrets khác nhau cho dev/test/prod
- ✗ Vi phạm security best practices (OWASP A02:2021)
- ✗ Nếu secrets bị rò rỉ → phải thay đổi code và redeploy

**ĐÃ CÓ .env CHO DOCKER NHƯNG KHÔNG DÙNG CHO LOCAL DEV**

#### 2.2 Giải pháp đề xuất đã thực hiện ✅

**ĐÃ TẠO:** `application-sample.properties` với placeholders
```properties
# ✅ Dùng environment variables
spring.datasource.password=${DB_PASSWORD:password_here}
spring.app.secret=${APP_JWT_SECRET}
ai.gemini.api-key=${GEMINI_API_KEY}
vnpay.tmnCode=${VNPAY_TMN_CODE}
vnpay.hashSecret=${VNPAY_HASH_SECRET}
```

**HƯỚNG DẪN SỬ DỤNG:**
1. Copy `application-sample.properties` → `application.properties`
2. Set environment variables hoặc dùng defaults cho dev
3. **QUAN TRỌNG:** Không commit `application.properties` có secrets thật

---

### ✅ **ĐIỂM MẠNH CẤU HÌNH**

#### 2.3 @ConfigurationProperties Pattern
✅ **TỐT:** Sử dụng type-safe configuration
```java
@ConfigurationProperties(prefix = "vnpay")
public class VNPayProperties {
    private String tmnCode;
    private String hashSecret;
    private String payUrl;
    private String returnUrl;
}
```

#### 2.4 Externalized Configuration
✅ **TỐT:** Docker Compose sử dụng environment variables
```yaml
environment:
  SPRING_DATASOURCE_PASSWORD: ${MSSQL_SA_PASSWORD}
  GEMINI_API_KEY: ${GEMINI_API_KEY}
```

#### 2.5 Profile Support
✅ **CÓ:** Có `application-test.properties` cho testing
```properties
# Test profile sử dụng H2 in-memory
spring.datasource.url=jdbc:h2:mem:testdb
```

---

## 🏗️ 3. ĐÁNH GIÁ KIẾN TRÚC HỆ THỐNG

### ✅ **ĐIỂM MẠNH KIẾN TRÚC**

#### 3.1 Layered Architecture
✅ **XUẤT SẮC:** Phân tách rõ ràng các layer:
```
Controller (REST API)
    ↓
Service Interface (Business Logic Contract)
    ↓
Service Implementation (Business Logic)
    ↓
Repository (Data Access)
    ↓
Entity (Domain Model)
```

**Package Structure:**
```
com.ev.warranty/
├── controller/          # 20 REST controllers
├── service/
│   ├── inter/          # 25 service interfaces
│   └── impl/           # 30 service implementations
├── repository/         # 30+ JPA repositories
├── model/
│   ├── entity/         # 25+ entities
│   └── dto/            # DTOs for API
├── config/             # Configuration classes
├── security/           # JWT, filters
├── exception/          # Exception handling
└── util/               # Utilities
```

#### 3.2 Dependency Injection
✅ **CHUẨN:** Sử dụng constructor injection với Lombok
```java
@Service
@RequiredArgsConstructor // ✅ Constructor DI
public class ClaimServiceImpl implements ClaimService {
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;
}
```

#### 3.3 Interface-based Design
✅ **TỐT:** Mọi service đều có interface
```java
public interface ClaimService { ... }

@Service
public class ClaimServiceImpl implements ClaimService { ... }
```

#### 3.4 DTO Pattern
✅ **TỐT:** Không expose entities trực tiếp qua API
```java
public class ClaimResponseDTO {
    private Integer id;
    private String claimNumber;
    private String status;
    // Không expose toàn bộ nested entities
}
```

#### 3.5 Exception Handling
✅ **TỐT:** Có centralized exception handling
```
exception/
├── ClaimNotFoundException.java
├── InvalidClaimStatusException.java
└── GlobalExceptionHandler.java (@RestControllerAdvice)
```

#### 3.6 Security
✅ **TỐT:** JWT-based authentication với Spring Security
```java
@Configuration
public class SecurityConfig {
    // JWT filter, role-based access control
}
```

---

### ⚠️ **VẤN ĐỀ KIẾN TRÚC & KHUYẾN NGHỊ**

#### 3.7 Không phải Microservices
**HIỆN TẠI:** Monolithic architecture
- ✅ **PHÒNG HỢP:** Cho dự án vừa/nhỏ, monolith là lựa chọn đúng
- ✅ Đơn giản để deploy và maintain
- ✅ Không cần distributed transaction
- ⚠️ **CHÚ Ý:** Nếu scale lớn sau này cần refactor thành microservices

**NẾU CẦN MICROSERVICES SAU NÀY:**
Có thể tách thành:
1. **Claim Service** (claims, work_orders, appointments)
2. **Inventory Service** (parts, warehouses, shipments)
3. **Vehicle Service** (vehicles, customers, service_history)
4. **User/Auth Service** (users, roles, authentication)

#### 3.8 Service Layer Complexity
**VẤN ĐỀ:** Một số service có quá nhiều dependencies (5-10 repositories)
```java
@Service
public class ClaimServiceImpl {
    private final ClaimRepository claimRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final StatusRepository statusRepository;
    private final PartRepository partRepository;
    private final InventoryRepository inventoryRepository;
    // ... nhiều dependency
}
```

**KHUYẾN NGHỊ:** Áp dụng Domain-Driven Design (DDD):
- Tạo các Aggregate Root (Claim là root)
- Sử dụng Domain Events thay vì direct calls
- Tách business logic phức tạp thành Domain Services

#### 3.9 Transaction Management
✅ **TỐT:** Sử dụng `@Transactional` đúng cách
```java
@Transactional
public ClaimDTO createClaim(CreateClaimRequest request) {
    // Atomic operation
}
```

⚠️ **CHÚ Ý:** Cần kiểm tra isolation level cho concurrent updates:
```java
@Transactional(isolation = Isolation.REPEATABLE_READ)
public void allocatePartSerial(Integer partSerialId, Integer claimId) {
    // Prevent race condition when multiple claims try to allocate same part
}
```

#### 3.10 Missing Domain Events
**THIẾU:** Không có event-driven communication giữa các module
```java
// ❌ Hiện tại: Direct coupling
claimService.approveClaim(claimId);
inventoryService.reserveParts(claimId); // Direct call

// ✅ Nên dùng: Event-driven
eventPublisher.publish(new ClaimApprovedEvent(claimId));
// Listener tự động reserve parts
```

#### 3.11 Missing Validation Layer
⚠️ **THIẾU:** Validation logic nằm rải rác trong service
```java
// ❌ Validation trong service
if (claim.getVehicle() == null) {
    throw new IllegalArgumentException("Vehicle is required");
}
```

**KHUYẾN NGHỊ:** Sử dụng Bean Validation
```java
public class CreateClaimRequest {
    @NotNull(message = "Vehicle ID is required")
    private Integer vehicleId;
    
    @NotBlank(message = "Reported failure is required")
    @Size(max = 1000)
    private String reportedFailure;
}
```

---

## 📊 4. CODE QUALITY & CLEAN CODE

### ✅ **ĐIỂM MẠNH**

#### 4.1 Lombok Usage
✅ **TỐT:** Giảm boilerplate code
```java
@Data // Generates getters, setters, toString, equals, hashCode
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Claim { ... }
```

#### 4.2 Naming Conventions
✅ **CHUẨN:** Tuân thủ Java naming conventions
- Classes: PascalCase (`ClaimServiceImpl`)
- Methods: camelCase (`createClaim`)
- Constants: UPPER_SNAKE_CASE (nếu có)

#### 4.3 Comments (Tiếng Việt & English)
✅ **TỐT:** Có comments cho business logic phức tạp
```java
// 🆕 Problem handling statuses
@Column(name = "problem_description", columnDefinition = "NVARCHAR(MAX)")
private String problemDescription;
```

### ⚠️ **CẦN CẢI THIỆN**

#### 4.4 Missing Documentation
⚠️ **THIẾU:** Không có JavaDoc cho public APIs
```java
// ❌ Không có doc
public ClaimDTO createClaim(CreateClaimRequest request) { ... }

// ✅ Nên có
/**
 * Creates a new warranty claim for a vehicle
 * @param request The claim details
 * @return The created claim DTO
 * @throws VehicleNotFoundException if vehicle not found
 * @throws InvalidWarrantyException if warranty expired
 */
public ClaimDTO createClaim(CreateClaimRequest request) { ... }
```

#### 4.5 Magic Numbers/Strings
⚠️ **CÓ:** Status strings được hardcode
```java
// ❌ Magic string
if ("OPEN".equals(claim.getStatus())) { ... }

// ✅ Nên dùng constants hoặc enum
public enum ClaimStatusCode {
    OPEN, IN_PROGRESS, COMPLETED, REJECTED;
}

if (ClaimStatusCode.OPEN.name().equals(claim.getStatus())) { ... }
```

---

## 🎯 5. KHUYẾN NGHỊ HÀNH ĐỘNG

### 🔴 **ƯU TIÊN CAO (CRITICAL)**

1. **Fix Duplicate Mapping Issues**
   - Sửa `User.serviceCenterId` duplicate mapping
   - Sửa `Shipment.destinationCenterId` duplicate mapping
   - Sửa `ThirdPartyPart.serviceCenterId` → thành `@ManyToOne`

2. **Remove Hardcoded Secrets**
   - ✅ **ĐÃ TẠO:** `application-sample.properties`
   - 🔄 **CẦN LÀM:** Update `.env.example` với tất cả required secrets
   - 🔄 **CẦN LÀM:** Document environment variables trong README

3. **Add Composite Indexes**
   ```java
   @Table(indexes = {
       @Index(name = "idx_warehouse_part", columnList = "warehouse_id, part_id"),
       @Index(name = "idx_claim_status", columnList = "claim_id, status")
   })
   ```

### 🟡 **ƯU TIÊN TRUNG BÌNH**

4. **Implement Soft Delete**
   - Thêm `deleted` flag cho Claim, WorkOrder, Vehicle
   - Sử dụng `@SQLDelete` và `@Where`

5. **Add Bean Validation**
   - Thêm `@Valid` và constraints vào DTOs
   - Centralize validation error handling

6. **Add Transaction Isolation**
   ```java
   @Transactional(isolation = Isolation.REPEATABLE_READ)
   public void reservePartSerial(Integer id) { ... }
   ```

### 🟢 **ƯU TIÊN THẤP (NICE TO HAVE)**

7. **Add Domain Events**
   - Implement event-driven communication
   - Decouple services

8. **Add JavaDoc**
   - Document all public APIs
   - Generate API documentation

9. **Create ERD Documentation**
   - Generate database diagram từ entities
   - Document relationships và constraints

---

## 📈 6. KẾT LUẬN

### 📊 **ĐIỂM TỔNG QUAN**

| Tiêu chí | Điểm | Nhận xét |
|----------|------|----------|
| **Database Normalization** | 9/10 | Xuất sắc, chuẩn 3NF |
| **Foreign Key Relationships** | 7/10 | Có vài duplicate mapping |
| **Configuration Management** | 5/10 | ⚠️ Hardcoded secrets |
| **Architecture Layering** | 9/10 | Clean layered architecture |
| **Code Quality** | 8/10 | Tốt, có thể cải thiện docs |
| **Security** | 6/10 | ⚠️ Secrets exposure risk |

**TỔNG ĐIỂM:** **7.3/10** - **KHÁ TỐT, CẦN CẢI THIỆN BẢO MẬT**

### ✅ **ĐIỂM MẠNH CHÍNH**
1. Database được chuẩn hóa tốt, relationships đúng
2. Kiến trúc layered rõ ràng, dễ maintain
3. Sử dụng Spring Boot best practices
4. Lazy loading và audit trail đầy đủ

### ⚠️ **RỦI RO CHÍNH**
1. **CRITICAL:** Hardcoded secrets trong `application.properties`
2. **HIGH:** Duplicate column mapping có thể gây data inconsistency
3. **MEDIUM:** Thiếu composite indexes cho performance

### 🎯 **KHUYẾN NGHỊ CHUNG**
- ✅ **CHO MÔI TRƯỜNG PRODUCTION:** Phải fix critical issues trước khi deploy
- ✅ **CHO TEAM:** Project structure tốt, phù hợp với team 3-5 người
- ✅ **CHO SCALE:** Monolithic phù hợp với quy mô hiện tại, có thể refactor sau

---

**Người đánh giá:** GitHub Copilot  
**Cập nhật lần cuối:** 12/11/2025  
**Phiên bản tài liệu:** 1.0

