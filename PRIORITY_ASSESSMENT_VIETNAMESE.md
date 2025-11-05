# 📊 ĐÁNH GIÁ MỨC ĐỘ ƯU TIÊN - YÊU CẦU TIẾNG VIỆT & LUỒNG BẢO HÀNH

## 🎯 TỔNG QUAN

Dựa trên phân tích cấu trúc dự án và yêu cầu, dưới đây là đánh giá chi tiết về mức độ ưu tiên các công việc:

---

## 📋 PHÂN TÍCH CÁC YÊU CẦU

### 1️⃣ **Tiếp tục thêm tiếng Việt**
- **Mức độ ưu tiên**: ⭐⭐ (THẤP - NÊN LÀM SAU)
- **Lý do**: 
  - Đây là việc UX/UI improvement
  - Không ảnh hưởng đến logic nghiệp vụ core
  - Nên làm sau khi hoàn thành logic nghiệp vụ
- **Khối lượng công việc**: Trung bình
- **Dependency**: Không phụ thuộc công việc khác

---

### 2️⃣ **CRUD mẫu xe cho EVM Staff, SC Technician, SC Staff**
- **Mức độ ưu tiên**: ⭐⭐⭐⭐⭐ (RẤT CAO - LÀM NGAY)
- **Lý do**:
  - ✅ Đã có entity `VehicleModel` trong database
  - ✅ Đã có controller `VehicleModelController`
  - ⚠️ Cần kiểm tra permissions cho từng role
  - 🔥 Là nền tảng cho việc quản lý điều kiện bảo hành
- **Khối lượng công việc**: Nhỏ (đã có sẵn 70%)
- **Dependency**: Không
- **Action items**:
  ```
  ✓ Entity VehicleModel đã có
  ✓ Controller đã có
  ⚠️ Cần kiểm tra Service layer
  ⚠️ Cần thêm role-based permissions
  ```

---

### 3️⃣ **Điều chỉnh trang tạo xe mới chỉ có thể dùng mẫu có sẵn**
- **Mức độ ưu tiên**: ⭐⭐⭐⭐ (CAO)
- **Lý do**:
  - Đảm bảo data integrity
  - Liên kết với điều kiện bảo hành của từng model
  - Tránh dữ liệu model tự do/không chuẩn
- **Khối lượng công việc**: Nhỏ
- **Dependency**: Cần hoàn thành #2 trước
- **Action items**:
  ```
  - Sửa VehicleController để validate model_id
  - Sửa DTO để nhận model_id thay vì model string
  - Update API documentation
  ```

---

### 4️⃣ **EVM Staff quản lý điều kiện bảo hành cho từng mẫu xe**
- **Mức độ ưu tiên**: ⭐⭐⭐⭐⭐ (RẤT CAO - CORE FEATURE)
- **Lý do**:
  - 🔥 Đây là yêu cầu nghiệp vụ QUAN TRỌNG nhất
  - Ảnh hưởng trực tiếp đến luồng claim processing
  - Cần thiết cho cả 2 trường hợp (warranty/non-warranty)
- **Khối lượng công việc**: Lớn
- **Dependency**: Cần #2 và #3
- **Hiện trạng**:
  ```
  ✓ Entity WarrantyPolicy đã có
  ✓ Controller WarrantyPolicyController đã có
  ⚠️ Chưa có trường warranty_conditions chi tiết
  ⚠️ Chưa liên kết WarrantyPolicy với VehicleModel
  ```

**🔧 CẦN BỔ SUNG**:

#### 4.1. Database Schema Changes
```sql
-- Thêm bảng warranty_conditions (chi tiết điều kiện)
CREATE TABLE warranty_conditions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_model_id INT NOT NULL,
    warranty_policy_id INT,
    
    -- Điều kiện cơ bản
    coverage_years INT NOT NULL,           -- Số năm bảo hành (vd: 3 năm)
    coverage_km INT NOT NULL,              -- Số km bảo hành (vd: 100000 km)
    
    -- Điều kiện chi tiết
    conditions_text TEXT NOT NULL,         -- Mô tả điều kiện đầy đủ (tiếng Việt + English)
    exclusions_text TEXT,                  -- Các điều kiện loại trừ
    
    -- Parts coverage
    battery_warranty_years INT,            -- Bảo hành pin riêng (vd: 8 năm)
    battery_warranty_km INT,
    motor_warranty_years INT,
    motor_warranty_km INT,
    
    -- Validation rules
    require_service_history BOOLEAN DEFAULT FALSE,  -- Yêu cầu lịch sử bảo dưỡng
    max_gap_between_services_months INT,           -- Tối đa mấy tháng giữa các lần bảo dưỡng
    
    -- Metadata
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INT,
    
    FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models(id),
    FOREIGN KEY (warranty_policy_id) REFERENCES warranty_policies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### 4.2. Entity & DTO cần tạo
```
✓ Entity: WarrantyCondition.java (MỚI)
✓ DTO: WarrantyConditionRequestDTO.java
✓ DTO: WarrantyConditionResponseDTO.java
✓ Service: WarrantyConditionService.java
✓ Controller: WarrantyConditionController.java (hoặc mở rộng WarrantyPolicyController)
```

---

### 5️⃣ **SC Staff và SC Technician được phép xem điều kiện bảo hành**
- **Mức độ ưu tiên**: ⭐⭐⭐⭐⭐ (RẤT CAO)
- **Lý do**:
  - Cần thiết cho Technician đánh giá claim
  - Liên quan trực tiếp đến quyết định chấp nhận/từ chối bảo hành
- **Khối lượng công việc**: Nhỏ
- **Dependency**: Cần #4
- **Action items**:
  ```
  - Thêm API GET /api/vehicles/{id}/warranty-conditions
  - Thêm API GET /api/vehicle-models/{id}/warranty-conditions
  - Phân quyền cho SC_STAFF và SC_TECHNICIAN xem (READ-ONLY)
  - EVM_STAFF có quyền CRUD đầy đủ
  ```

---

### 6️⃣ **Thêm trường "điều kiện bảo hành được chấp nhận" trong Diagnostic**
- **Mức độ ưu tiên**: ⭐⭐⭐⭐⭐ (RẤT CAO - CORE LOGIC)
- **Lý do**:
  - 🔥 Đây là điểm quyết định luồng claim
  - Quyết định claim đi theo warranty flow hay third-party flow
  - Cần tracking để audit
- **Khối lượng công việc**: Trung bình
- **Dependency**: Cần #4, #5

**🔧 CẦN BỔ SUNG**:

#### 6.1. Database Changes
```sql
-- Thêm vào bảng claims
ALTER TABLE claims ADD COLUMN warranty_acceptance_status VARCHAR(50);
  -- Giá trị: 'ELIGIBLE' / 'NOT_ELIGIBLE' / 'PENDING_EVALUATION'

ALTER TABLE claims ADD COLUMN warranty_eligibility_notes TEXT;
  -- Ghi chú của Technician về việc đánh giá điều kiện bảo hành

ALTER TABLE claims ADD COLUMN warranty_condition_checked_at TIMESTAMP;
  -- Thời điểm Technician check điều kiện

ALTER TABLE claims ADD COLUMN warranty_condition_checked_by INT;
  -- User ID của Technician check
  -- FOREIGN KEY (warranty_condition_checked_by) REFERENCES users(id)
```

#### 6.2. Entity Changes (Claim.java)
```java
@Column(name = "warranty_acceptance_status", length = 50)
private String warrantyAcceptanceStatus; // ELIGIBLE / NOT_ELIGIBLE / PENDING_EVALUATION

@Column(name = "warranty_eligibility_notes", columnDefinition = "TEXT")
private String warrantyEligibilityNotes;

@Column(name = "warranty_condition_checked_at")
private LocalDateTime warrantyConditionCheckedAt;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "warranty_condition_checked_by")
private User warrantyConditionCheckedBy;
```

#### 6.3. DTO Changes (ClaimDiagnosticRequest)
```java
// Thêm vào ClaimDiagnosticRequest.java
private String warrantyAcceptanceStatus;  // REQUIRED khi submit diagnostic
private String warrantyEligibilityNotes;   // Ghi chú chi tiết
```

#### 6.4. Logic Flow
```
Khi SC Technician cập nhật Diagnostic:
1. Xem warranty conditions của vehicle model
2. Đánh giá claim có đủ điều kiện không
3. Nhập warrantyAcceptanceStatus:
   - ELIGIBLE → flow tiếp: gửi tới EVM approval
   - NOT_ELIGIBLE → flow: liên hệ khách hàng về third-party parts
4. Nhập warrantyEligibilityNotes giải thích lý do
```

---

### 7️⃣ **Luồng xử lý sau khi cập nhật Diagnostic**
- **Mức độ ưu tiên**: ⭐⭐⭐⭐⭐ (RẤT CAO - CORE BUSINESS LOGIC)
- **Lý do**:
  - Đây là TRÁI TIM của business logic
  - Quyết định 2 luồng chính: warranty vs non-warranty
- **Khối lượng công việc**: Lớn
- **Dependency**: Cần #6

**🔧 LUỒNG CHI TIẾT**:

#### Case A: warrantyAcceptanceStatus = "ELIGIBLE"
```
SC Technician updates Diagnostic
  ↓
System validates warrantyAcceptanceStatus = ELIGIBLE
  ↓
Claim status → PENDING_EVM_APPROVAL
  ↓
Notify EVM Staff
  ↓
EVM Staff reviews & approves/rejects
  ↓
IF APPROVED:
  - Status → EVM_APPROVED
  - Claim ready for parts ordering
  - Create Work Order (if needed)
  ↓
IF REJECTED:
  - Status → EVM_REJECTED
  - SC can resubmit (1 time only)
  - Or cancel claim
```

#### Case B: warrantyAcceptanceStatus = "NOT_ELIGIBLE"
```
SC Technician updates Diagnostic
  ↓
System validates warrantyAcceptanceStatus = NOT_ELIGIBLE
  ↓
Claim status → WAITING_FOR_CUSTOMER
  ↓
SC Staff contacts customer:
  "Vehicle không đủ điều kiện bảo hành.
   Chúng tôi có thể sửa chữa bằng linh kiện bên thứ 3.
   Quý khách có đồng ý không?"
  ↓
IF CUSTOMER AGREES:
  - Status → READY_FOR_REPAIR
  - Use third-party parts (managed by SC)
  - Create Work Order with third_party parts
  ↓
IF CUSTOMER DECLINES:
  - Status → CANCELLED
  - Claim closed
```

---

### 8️⃣ **Kiểm tra và bổ sung API quản lý linh kiện kho EVM**
- **Mức độ ưu tiên**: ⭐⭐⭐⭐ (CAO)
- **Lý do**:
  - Cần cho warranty claims
  - Đã có sẵn PartSerialController, InventoryController
- **Khối lượng công việc**: Nhỏ (cần kiểm tra)
- **Dependency**: Không

**🔍 HIỆN TRẠNG**:
```
✓ Entity: Part, PartSerial, Inventory
✓ Controller: PartSerialController, InventoryController
⚠️ Cần kiểm tra API đầy đủ cho:
  - EVM manage parts (CRUD)
  - Reserve parts for claim
  - Allocate parts to Work Order
```

**Action items**:
```
1. Review PartSerialController
2. Review InventoryController  
3. Ensure APIs for:
   - GET /api/parts (list all parts)
   - POST /api/parts (create new part - EVM only)
   - PUT /api/parts/{id} (update part - EVM only)
   - GET /api/inventory/{warehouseId} (check stock)
   - POST /api/inventory/reserve (reserve for claim)
```

---

### 9️⃣ **API quản lý linh kiện bên thứ 3 của Service Center**
- **Mức độ ưu tiên**: ⭐⭐⭐⭐⭐ (RẤT CAO - CHƯA CÓ)
- **Lý do**:
  - 🚨 CHƯA CÓ trong hệ thống hiện tại
  - Cần thiết cho luồng non-warranty claims
  - SC cần tự quản lý inventory của họ
- **Khối lượng công việc**: Lớn
- **Dependency**: Không

**🔧 CẦN TẠO MỚI**:

#### 9.1. Database Schema
```sql
-- Bảng quản lý linh kiện bên thứ 3 của Service Center
CREATE TABLE sc_third_party_parts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    part_name VARCHAR(200) NOT NULL,
    part_number VARCHAR(100),
    category VARCHAR(100),
    description TEXT,
    
    supplier_name VARCHAR(200),
    supplier_contact VARCHAR(200),
    
    unit_cost DECIMAL(12,2),
    
    -- Metadata
    created_by INT NOT NULL,  -- SC Staff who added this part
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Bảng serial number của linh kiện thứ 3
CREATE TABLE sc_third_party_part_serials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    third_party_part_id INT NOT NULL,
    serial_number VARCHAR(150) UNIQUE,
    
    purchase_date DATE,
    unit_cost DECIMAL(12,2),
    
    status VARCHAR(50) DEFAULT 'in_stock',  -- in_stock / allocated / installed
    
    installed_on_vehicle_id INT,
    installed_at TIMESTAMP,
    installed_by INT,  -- Technician
    
    created_by INT,
    created_at TIMESTAMP,
    
    FOREIGN KEY (third_party_part_id) REFERENCES sc_third_party_parts(id),
    FOREIGN KEY (installed_on_vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (installed_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### 9.2. Entities cần tạo
```
✓ SCThirdPartyPart.java
✓ SCThirdPartyPartSerial.java
```

#### 9.3. DTOs cần tạo
```
✓ SCThirdPartyPartRequestDTO.java
✓ SCThirdPartyPartResponseDTO.java
✓ SCThirdPartyPartSerialRequestDTO.java
✓ SCThirdPartyPartSerialResponseDTO.java
```

#### 9.4. Service & Controller
```
✓ SCThirdPartyPartService.java
✓ SCThirdPartyPartServiceImpl.java
✓ SCThirdPartyPartController.java
```

#### 9.5. API Endpoints
```
POST   /api/sc/third-party-parts           - SC_STAFF tạo part mới
GET    /api/sc/third-party-parts           - List all parts
GET    /api/sc/third-party-parts/{id}      - Get detail
PUT    /api/sc/third-party-parts/{id}      - Update part
DELETE /api/sc/third-party-parts/{id}      - Soft delete

POST   /api/sc/third-party-parts/{id}/serials  - Add serial
GET    /api/sc/third-party-parts/{id}/serials  - List serials
PUT    /api/sc/third-party-parts/serials/{id}  - Update serial status
```

---

### 🔟 **Serial của linh kiện thứ 3 do SC Staff và SC Technician xử lý**
- **Mức độ ưu tiên**: ⭐⭐⭐⭐ (CAO)
- **Lý do**:
  - Liên quan trực tiếp đến #9
  - Cần tracking cho audit trail
- **Khối lượng công việc**: Trung bình
- **Dependency**: Cần #9

**Logic**:
```
SC Staff: 
  - Quản lý danh sách parts
  - Thêm serial numbers khi mua hàng
  
SC Technician:
  - Xem available serials
  - Chọn serial để install lên xe
  - Cập nhật status serial → 'installed'
  - Link serial với vehicle
```

---

### 1️⃣1️⃣ **Hoàn thành khép kín cả hai trường hợp**
- **Mức độ ưu tiên**: ⭐⭐⭐⭐⭐ (RẤT CAO - MỤC TIÊU CUỐI)
- **Lý do**:
  - Đây là mục tiêu tổng thể
  - Cần integration testing
- **Khối lượng công việc**: Lớn
- **Dependency**: Tất cả các items trên

---

## 🎯 BẢNG ƯU TIÊN TỔNG HỢP

| STT | Công việc | Ưu tiên | Khối lượng | Dependencies | Hiện trạng |
|-----|-----------|---------|------------|--------------|------------|
| 2 | CRUD mẫu xe | ⭐⭐⭐⭐⭐ | Nhỏ | - | 70% done |
| 3 | Trang tạo xe dùng mẫu có sẵn | ⭐⭐⭐⭐ | Nhỏ | #2 | Chưa |
| 4 | EVM quản lý điều kiện bảo hành | ⭐⭐⭐⭐⭐ | Lớn | #2, #3 | 40% done |
| 5 | SC xem điều kiện bảo hành | ⭐⭐⭐⭐⭐ | Nhỏ | #4 | Chưa |
| 6 | Trường "điều kiện bảo hành" trong Diagnostic | ⭐⭐⭐⭐⭐ | Trung bình | #4, #5 | Chưa |
| 7 | Luồng xử lý sau Diagnostic | ⭐⭐⭐⭐⭐ | Lớn | #6 | Chưa |
| 8 | Kiểm tra API linh kiện EVM | ⭐⭐⭐⭐ | Nhỏ | - | 90% done |
| 9 | API linh kiện thứ 3 SC | ⭐⭐⭐⭐⭐ | Lớn | - | 0% (MỚI) |
| 10 | Serial linh kiện thứ 3 | ⭐⭐⭐⭐ | Trung bình | #9 | Chưa |
| 11 | Hoàn thành khép kín | ⭐⭐⭐⭐⭐ | Lớn | Tất cả | Chưa |
| 1 | Thêm tiếng Việt | ⭐⭐ | Trung bình | - | Sau cùng |

---

## 📋 THỨ TỰ THỰC HIỆN ĐỀ XUẤT

### SPRINT 1: Foundation (Nền tảng)
**Mục tiêu**: Hoàn thành hệ thống quản lý mẫu xe và điều kiện bảo hành

1. ✅ **Kiểm tra & hoàn thiện CRUD VehicleModel** (#2)
   - Review VehicleModelController, Service
   - Đảm bảo phân quyền đúng cho EVM/SC
   - Estimate: 0.5 ngày

2. ✅ **Tạo hệ thống WarrantyConditions** (#4)
   - Tạo entity, DTO, Service, Controller
   - Link với VehicleModel
   - API CRUD cho EVM Staff
   - Estimate: 2 ngày

3. ✅ **Sửa VehicleController để dùng model có sẵn** (#3)
   - Validate vehicle_model_id
   - Update DTOs
   - Estimate: 0.5 ngày

4. ✅ **API xem warranty conditions cho SC** (#5)
   - GET endpoints
   - Phân quyền READ-ONLY
   - Estimate: 0.5 ngày

**Tổng Sprint 1**: 3.5 ngày

---

### SPRINT 2: Core Warranty Logic (Logic bảo hành chính)
**Mục tiêu**: Implement logic đánh giá điều kiện bảo hành trong Diagnostic

5. ✅ **Thêm fields warranty acceptance vào Claim** (#6)
   - Migrate database
   - Update Claim entity
   - Update DTOs
   - Estimate: 1 ngày

6. ✅ **Cập nhật ClaimDiagnosticRequest & Service** (#6)
   - Thêm warrantyAcceptanceStatus vào DTO
   - Validate logic trong Service
   - Update ClaimMapper
   - Estimate: 1 ngày

7. ✅ **Implement luồng ELIGIBLE** (#7)
   - Logic chuyển status PENDING_EVM_APPROVAL
   - Notification cho EVM
   - Estimate: 1 ngày

8. ✅ **Implement luồng NOT_ELIGIBLE** (#7)
   - Logic chuyển status WAITING_FOR_CUSTOMER
   - SC Staff contact customer flow
   - Estimate: 1 ngày

**Tổng Sprint 2**: 4 ngày

---

### SPRINT 3: Third-Party Parts Management (Quản lý linh kiện thứ 3)
**Mục tiêu**: Hoàn thiện hệ thống linh kiện bên thứ 3 cho SC

9. ✅ **Tạo database schema cho third-party parts** (#9)
   - Migration scripts
   - Estimate: 0.5 ngày

10. ✅ **Tạo Entity & Repository** (#9)
    - SCThirdPartyPart.java
    - SCThirdPartyPartSerial.java
    - Repositories
    - Estimate: 0.5 ngày

11. ✅ **Tạo Service & Controller** (#9)
    - Service layer
    - API endpoints
    - DTOs
    - Estimate: 2 ngày

12. ✅ **Logic xử lý serial của third-party parts** (#10)
    - Add/update serial
    - Install serial lên vehicle
    - Tracking
    - Estimate: 1.5 ngày

**Tổng Sprint 3**: 4.5 ngày

---

### SPRINT 4: Integration & Testing (Tích hợp & Kiểm thử)

13. ✅ **Kiểm tra API linh kiện EVM** (#8)
    - Review PartSerialController
    - Review InventoryController
    - Bổ sung API nếu thiếu
    - Estimate: 1 ngày

14. ✅ **Tích hợp WorkOrder với third-party parts**
    - Update WorkOrder để support cả EVM parts và third-party parts
    - Estimate: 1.5 ngày

15. ✅ **Integration Testing - Warranty Flow**
    - Test case: Eligible claim → EVM approval → Repair
    - Estimate: 1 ngày

16. ✅ **Integration Testing - Non-Warranty Flow**
    - Test case: Not eligible → Customer agrees → Third-party repair
    - Estimate: 1 ngày

17. ✅ **Postman collection cập nhật**
    - Add test cases cho tất cả flows mới
    - Estimate: 0.5 ngày

**Tổng Sprint 4**: 5 ngày

---

### SPRINT 5: UI/UX & Vietnamese (Cuối cùng)

18. ✅ **Thêm tiếng Việt** (#1)
    - i18n cho tất cả messages
    - Error messages Vietnamese
    - Estimate: 2 ngày

**Tổng Sprint 5**: 2 ngày

---

## ⏱️ TỔNG THỜI GIAN ƯỚC TÍNH

| Sprint | Nội dung | Thời gian |
|--------|----------|-----------|
| Sprint 1 | Foundation | 3.5 ngày |
| Sprint 2 | Core Warranty Logic | 4 ngày |
| Sprint 3 | Third-Party Parts | 4.5 ngày |
| Sprint 4 | Integration & Testing | 5 ngày |
| Sprint 5 | Vietnamese i18n | 2 ngày |
| **TỔNG** | | **19 ngày** |

---

## 🚀 KHUYẾN NGHỊ

### Làm ngay (High Priority):
1. **Sprint 1**: Hoàn thiện VehicleModel & WarrantyConditions
2. **Sprint 2**: Implement warranty logic trong Diagnostic
3. **Sprint 3**: Third-party parts management

### Làm sau (Medium Priority):
4. **Sprint 4**: Testing & integration

### Làm cuối (Low Priority):
5. **Sprint 5**: Vietnamese localization

---

## 📝 GHI CHÚ

- Mỗi sprint nên có demo/review với stakeholders
- Nên có unit tests cho từng module
- Database migration cần backup trước khi chạy
- API documentation cần update đồng bộ
- Postman collection cần test coverage đầy đủ

---

## 🔄 WORKFLOW TỔNG QUAN

### Trường hợp 1: Warranty Claim
```
Customer report issue
  ↓
SC Staff creates Claim
  ↓
SC Technician inspects & updates Diagnostic
  ↓
Technician checks warranty conditions (from VehicleModel)
  ↓
warrantyAcceptanceStatus = "ELIGIBLE"
  ↓
Status → PENDING_EVM_APPROVAL
  ↓
EVM Staff reviews & approves
  ↓
Status → EVM_APPROVED
  ↓
Order EVM parts (from central warehouse)
  ↓
Create Work Order with EVM parts
  ↓
Repair → Complete → Handover
```

### Trường hợp 2: Non-Warranty Claim (Third-Party Parts)
```
Customer report issue
  ↓
SC Staff creates Claim
  ↓
SC Technician inspects & updates Diagnostic
  ↓
Technician checks warranty conditions
  ↓
warrantyAcceptanceStatus = "NOT_ELIGIBLE"
  ↓
Status → WAITING_FOR_CUSTOMER
  ↓
SC Staff contacts customer about third-party repair option
  ↓
Customer AGREES
  ↓
Status → READY_FOR_REPAIR
  ↓
SC uses third-party parts (from SC inventory)
  ↓
Create Work Order with third-party parts
  ↓
Repair → Complete → Handover (customer pays)
```

---

**Tài liệu này được tạo tự động bởi GitHub Copilot**
**Ngày tạo**: 2024-11-05

