# PHÂN TÍCH CÁC VẤN ĐỀ DATABASE - LOGIC & THIẾT KẾ

## 🔴 CÁC VẤN ĐỀ NGHIÊM TRỌNG

### 1. **VEHICLE OWNERSHIP - Thiếu lịch sử đổi chủ**

**Vấn đề:**
- `Vehicle.customer_id` là `NOT NULL` và chỉ lưu 1 customer hiện tại
- **Trong thực tế**: Xe có thể đổi chủ nhiều lần, cần track lịch sử ownership
- **Hệ quả**: 
  - Không thể biết ai là chủ cũ
  - Không thể audit lịch sử chuyển nhượng
  - Warranty có thể bị sai nếu đổi chủ

**Giải pháp:**
```sql
-- Tạo table VehicleOwnershipHistory
CREATE TABLE vehicle_ownership_history (
    id INT PRIMARY KEY IDENTITY(1,1),
    vehicle_id INT NOT NULL,
    customer_id INT NOT NULL,
    ownership_start_date DATE NOT NULL,
    ownership_end_date DATE NULL, -- NULL = current owner
    transfer_type VARCHAR(50), -- SALE, TRANSFER, etc.
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Vehicle.customer_id vẫn giữ để query nhanh, nhưng có thể NULL
ALTER TABLE vehicles ALTER COLUMN customer_id INT NULL;
```

---

### 2. **INVENTORY vs STOCK_RESERVATION - Logic trùng lặp và không nhất quán**

**Vấn đề:**
- `Inventory` có `reservedStock` (tổng số đã reserve)
- `StockReservation` table cũng track reservations
- **Không có cơ chế đảm bảo sync** giữa 2 nơi
- Code hiện tại update `Inventory.reservedStock` trực tiếp, không tạo `StockReservation` record

**Ví dụ từ code:**
```java
// InventoryServiceImpl.java line 141
inventory.setReservedStock(inventory.getReservedStock() + item.getQuantity());
// Nhưng không tạo StockReservation record!
```

**Hệ quả:**
- Data inconsistency
- Không thể audit ai reserve, khi nào
- Không thể track reservation status (CREATED/COMMITTED/RELEASED)

**Giải pháp:**
- **Option 1**: Bỏ `Inventory.reservedStock`, chỉ dùng `StockReservation`
  ```sql
  -- Tính reservedStock từ StockReservation
  SELECT SUM(quantity) FROM stock_reservations 
  WHERE part_id = ? AND warehouse_id = ? AND status IN ('CREATED', 'COMMITTED')
  ```

- **Option 2**: Giữ cả 2 nhưng đảm bảo sync qua transaction/trigger
  ```sql
  -- Trigger để sync
  CREATE TRIGGER sync_reserved_stock
  ON stock_reservations
  AFTER INSERT, UPDATE, DELETE
  AS
  BEGIN
    -- Update Inventory.reservedStock từ StockReservation
  END
  ```

---

### 3. **PARTSERIAL không link với WAREHOUSE/INVENTORY**

**Vấn đề:**
- `PartSerial` không có `warehouse_id` hoặc `inventory_id`
- Không biết serial nào đang ở kho nào
- `PartSerial.status = "in_stock"` nhưng không biết ở đâu

**Hệ quả:**
- Không thể query "serial X ở kho nào?"
- Không thể track movement của serial giữa các kho
- Shipment không biết lấy serial nào từ kho nào

**Giải pháp:**
```sql
ALTER TABLE part_serials ADD COLUMN warehouse_id INT;
ALTER TABLE part_serials ADD COLUMN inventory_id INT;

-- Hoặc tạo table PartSerialLocation
CREATE TABLE part_serial_locations (
    id INT PRIMARY KEY IDENTITY(1,1),
    part_serial_id INT NOT NULL UNIQUE,
    warehouse_id INT NOT NULL,
    location_type VARCHAR(50), -- WAREHOUSE, SERVICE_CENTER, VEHICLE, IN_TRANSIT
    location_id INT, -- warehouse_id, service_center_id, vehicle_id, shipment_id
    status VARCHAR(50),
    moved_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (part_serial_id) REFERENCES part_serials(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);
```

---

### 4. **WARRANTYPOLICY và WARRANTYCONDITION - Relationship không rõ ràng**

**Vấn đề:**
- `WarrantyPolicy` có `applicableModel` (STRING)
- `WarrantyCondition` link với `VehicleModel` (FK)
- `PolicyRule` link với `WarrantyPolicy`
- **Không có relationship giữa Policy và Condition**

**Hệ quả:**
- Không biết Policy nào áp dụng Condition nào
- Logic check warranty phức tạp và không nhất quán
- Khó maintain và extend

**Giải pháp:**
```sql
-- Option 1: Link WarrantyCondition với WarrantyPolicy
ALTER TABLE warranty_conditions ADD COLUMN policy_id INT;
ALTER TABLE warranty_conditions ADD FOREIGN KEY (policy_id) REFERENCES warranty_policies(id);

-- Option 2: Tạo junction table
CREATE TABLE policy_conditions (
    id INT PRIMARY KEY IDENTITY(1,1),
    policy_id INT NOT NULL,
    condition_id INT NOT NULL,
    priority INT DEFAULT 0,
    effective_from DATE,
    effective_to DATE,
    
    FOREIGN KEY (policy_id) REFERENCES warranty_policies(id),
    FOREIGN KEY (condition_id) REFERENCES warranty_conditions(id),
    UNIQUE(policy_id, condition_id, effective_from)
);
```

---

### 5. **CLAIM có cả vehicle_id và customer_id - Redundant và có thể inconsistent**

**Vấn đề:**
- `Claim` có cả `vehicle_id` và `customer_id` (cả 2 NOT NULL)
- `Vehicle` đã có `customer_id`
- **Có thể xảy ra**: Claim.vehicle.customer != Claim.customer

**Ví dụ:**
```
Vehicle V1 -> Customer C1
Claim được tạo với vehicle_id=V1, customer_id=C2 (sai!)
```

**Hệ quả:**
- Data inconsistency
- Khó validate
- Logic phức tạp

**Giải pháp:**
- **Option 1**: Bỏ `Claim.customer_id`, lấy từ `Vehicle.customer`
  ```sql
  ALTER TABLE claims DROP COLUMN customer_id;
  -- Query: SELECT c.*, v.customer_id FROM claims c JOIN vehicles v ON c.vehicle_id = v.id
  ```

- **Option 2**: Giữ nhưng thêm constraint
  ```sql
  ALTER TABLE claims ADD CONSTRAINT check_customer_match 
  CHECK (
    customer_id = (SELECT customer_id FROM vehicles WHERE id = vehicle_id)
  );
  ```

- **Option 3**: Cho phép khác nhau nếu có lý do (như đại lý, người đại diện)
  - Nhưng cần document rõ ràng

---

### 6. **PART.unitCost vs INVENTORY.unitCost - Trùng lặp và không track lịch sử giá**

**Vấn đề:**
- `Part` có `unitCost` (giá cơ bản)
- `Inventory` cũng có `unitCost` (giá tại kho)
- **Không có lịch sử thay đổi giá**
- Không biết giá tại thời điểm claim/work order

**Hệ quả:**
- Không thể tính lại cost cho claim cũ
- Không thể audit giá
- Khó báo cáo tài chính

**Giải pháp:**
```sql
-- Tạo PartPriceHistory
CREATE TABLE part_price_history (
    id INT PRIMARY KEY IDENTITY(1,1),
    part_id INT NOT NULL,
    warehouse_id INT NULL, -- NULL = base price
    price DECIMAL(12,2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    created_by INT,
    created_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (part_id) REFERENCES parts(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- Part.unitCost = current base price
-- Inventory.unitCost = current warehouse price
-- ClaimItem.unitPrice = snapshot tại thời điểm claim
```

---

### 7. **SHIPMENT.destination_center_id - Inconsistent design**

**Vấn đề:**
- `Shipment` có `destination_center_id` (INTEGER) và `destinationServiceCenter` (FK, read-only)
- `insertable = false, updatable = false` - không thể insert qua JPA
- Phải set `destination_center_id` thủ công

**Giải pháp:**
```java
// Option 1: Dùng 1 field duy nhất
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "destination_center_id", nullable = false)
private ServiceCenter destinationServiceCenter;

// Option 2: Nếu cần linh hoạt (có thể ship đến địa chỉ khác)
@Column(name = "destination_type", length = 50) // SERVICE_CENTER, ADDRESS
private String destinationType;

@Column(name = "destination_center_id")
private Integer destinationCenterId; // nullable

@Column(name = "destination_address", columnDefinition = "NVARCHAR(MAX)")
private String destinationAddress; // nullable
```

---

### 8. **CLAIMITEM vs WORKORDERPART - Trùng lặp và không rõ ràng**

**Vấn đề:**
- `ClaimItem`: Parts/services được đề xuất trong claim
- `WorkOrderPart`: Parts thực tế được sử dụng trong work order
- **Không có relationship** giữa 2 table
- Khó biết item nào được approve và sử dụng

**Hệ quả:**
- Không thể track từ proposal → approval → usage
- Khó so sánh estimated vs actual
- Khó audit

**Giải pháp:**
```sql
-- Option 1: Link WorkOrderPart với ClaimItem
ALTER TABLE work_order_parts ADD COLUMN claim_item_id INT;
ALTER TABLE work_order_parts ADD FOREIGN KEY (claim_item_id) REFERENCES claim_items(id);

-- Option 2: Tạo mapping table
CREATE TABLE claim_item_usage (
    id INT PRIMARY KEY IDENTITY(1,1),
    claim_item_id INT NOT NULL,
    work_order_part_id INT NOT NULL,
    quantity_used INT NOT NULL,
    created_at DATETIME2 NOT NULL,
    
    FOREIGN KEY (claim_item_id) REFERENCES claim_items(id),
    FOREIGN KEY (work_order_part_id) REFERENCES work_order_parts(id)
);
```

---

### 9. **WORKORDER - Một claim có thể có nhiều work orders?**

**Vấn đề:**
- `WorkOrder.claim_id` là `NOT NULL` nhưng không có UNIQUE constraint
- **Không rõ**: 1 claim có thể có nhiều work orders không?
- Nếu có, logic phân chia như thế nào?

**Thực tế có thể:**
- 1 claim = 1 work order (đơn giản)
- 1 claim = nhiều work orders (nếu sửa nhiều lần, nhiều kỹ thuật viên)

**Giải pháp:**
- **Nếu 1:1**: Thêm UNIQUE constraint
  ```sql
  ALTER TABLE work_orders ADD CONSTRAINT unique_claim_workorder 
  UNIQUE(claim_id);
  ```

- **Nếu 1:N**: Cần làm rõ logic
  - Work order sequence number?
  - Work order type (INITIAL_REPAIR, RE_REPAIR, FOLLOW_UP)?
  - Parent work order?

---

### 10. **VEHICLE có cả model (string) và vehicleModel (FK) - Redundant**

**Vấn đề:**
- `Vehicle.model` (STRING) - có thể không nhất quán
- `Vehicle.vehicleModel` (FK) - link đến VehicleModel
- **Có thể khác nhau**: model = "EV-X-2024" nhưng vehicleModel.name = "EV-X Pro 2024"

**Giải pháp:**
```sql
-- Option 1: Bỏ Vehicle.model, chỉ dùng vehicleModel
ALTER TABLE vehicles DROP COLUMN model;

-- Option 2: Computed column hoặc trigger để sync
ALTER TABLE vehicles ADD CONSTRAINT check_model_match
CHECK (model = (SELECT name FROM vehicle_models WHERE id = vehicle_model_id));
```

---

### 11. **INVENTORY - Thiếu unique constraint**

**Vấn đề:**
- `Inventory` có `warehouse_id` và `part_id`
- **Không có UNIQUE constraint** trên (warehouse_id, part_id)
- Có thể tạo duplicate records

**Giải pháp:**
```sql
ALTER TABLE inventory 
ADD CONSTRAINT unique_warehouse_part 
UNIQUE(warehouse_id, part_id);
```

---

### 12. **PARTSERIAL - Thiếu warehouse tracking khi status = "in_stock"**

**Vấn đề:**
- `PartSerial.status = "in_stock"` nhưng không biết ở kho nào
- Khi allocate, không biết lấy từ kho nào
- Shipment không biết serial nào ở đâu

**Đã đề cập ở #3, nhưng cần nhấn mạnh lại**

---

### 13. **CLAIM có customer_id nhưng không có service_center_id**

**Vấn đề:**
- Claim được tạo ở service center nào?
- Không thể filter claims theo service center
- Không thể báo cáo theo service center

**Giải pháp:**
```sql
ALTER TABLE claims ADD COLUMN service_center_id INT;
ALTER TABLE claims ADD FOREIGN KEY (service_center_id) REFERENCES service_centers(id);

-- Hoặc lấy từ created_by user
-- Nhưng user có thể chuyển service center
```

---

### 14. **BILLINGDOCUMENT - Thiếu link với WorkOrder/ClaimItem**

**Vấn đề:**
- `BillingDocument` chỉ link với `Claim`
- Không biết chi tiết nào được bill
- Khó reconcile với ClaimItem/WorkOrderPart

**Giải pháp:**
```sql
-- Tạo BillingDocumentItem
CREATE TABLE billing_document_items (
    id INT PRIMARY KEY IDENTITY(1,1),
    billing_document_id INT NOT NULL,
    claim_item_id INT NULL,
    work_order_part_id INT NULL,
    item_type VARCHAR(50), -- PART, SERVICE, LABOR
    description NVARCHAR(MAX),
    quantity INT,
    unit_price DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    
    FOREIGN KEY (billing_document_id) REFERENCES billing_documents(id),
    FOREIGN KEY (claim_item_id) REFERENCES claim_items(id),
    FOREIGN KEY (work_order_part_id) REFERENCES work_order_parts(id)
);
```

---

### 15. **SERVICEHISTORY có cả vehicle_id và customer_id - Redundant**

**Vấn đề:**
- Tương tự Claim, ServiceHistory có cả 2
- Có thể inconsistent

**Giải pháp:**
- Tương tự #5

---

## ⚠️ CÁC VẤN ĐỀ VỀ DATA INTEGRITY

### 16. **Thiếu CHECK constraints**

**Ví dụ:**
```sql
-- Inventory
ALTER TABLE inventory ADD CONSTRAINT check_stock_positive
CHECK (current_stock >= 0 AND reserved_stock >= 0);

ALTER TABLE inventory ADD CONSTRAINT check_reserved_not_exceed_current
CHECK (reserved_stock <= current_stock);

-- WorkOrder
ALTER TABLE work_orders ADD CONSTRAINT check_end_after_start
CHECK (end_time IS NULL OR end_time >= start_time);

-- Vehicle
ALTER TABLE vehicles ADD CONSTRAINT check_warranty_dates
CHECK (warranty_end IS NULL OR warranty_end >= warranty_start);

-- PartSerial
ALTER TABLE part_serials ADD CONSTRAINT check_installed_has_vehicle
CHECK (
    (status = 'installed' AND installed_on_vehicle_id IS NOT NULL) OR
    (status != 'installed')
);
```

---

### 17. **Thiếu Indexes**

**Cần index cho:**
```sql
-- Claims
CREATE INDEX idx_claims_vehicle_id ON claims(vehicle_id);
CREATE INDEX idx_claims_customer_id ON claims(customer_id);
CREATE INDEX idx_claims_status_id ON claims(status_id);
CREATE INDEX idx_claims_created_at ON claims(created_at);

-- WorkOrders
CREATE INDEX idx_work_orders_claim_id ON work_orders(claim_id);
CREATE INDEX idx_work_orders_technician_id ON work_orders(technician_id);

-- Inventory
CREATE INDEX idx_inventory_warehouse_part ON inventory(warehouse_id, part_id);

-- PartSerials
CREATE INDEX idx_part_serials_part_id ON part_serials(part_id);
CREATE INDEX idx_part_serials_status ON part_serials(status);
CREATE INDEX idx_part_serials_vehicle ON part_serials(installed_on_vehicle_id);
```

---

## 📊 TÓM TẮT ĐỘ ƯU TIÊN

### 🔴 **CRITICAL** (Cần fix ngay):
1. Vehicle Ownership History (#1)
2. Inventory vs StockReservation sync (#2)
3. PartSerial warehouse tracking (#3)
4. Inventory unique constraint (#11)

### 🟡 **HIGH** (Nên fix sớm):
5. WarrantyPolicy-Condition relationship (#4)
6. Claim customer_id redundancy (#5)
7. Part price history (#6)
8. ClaimItem vs WorkOrderPart link (#8)

### 🟢 **MEDIUM** (Có thể fix sau):
9. WorkOrder 1:1 vs 1:N (#9)
10. Vehicle model redundancy (#10)
11. Shipment destination (#7)
12. BillingDocument items (#14)
13. ServiceHistory redundancy (#15)

### ⚪ **LOW** (Nice to have):
14. Check constraints (#16)
15. Indexes (#17)
16. Claim service_center_id (#13)

---

## 🎯 KHUYẾN NGHỊ

1. **Ưu tiên fix các vấn đề CRITICAL** trước
2. **Tạo migration script** cho từng fix
3. **Test thoroughly** sau mỗi thay đổi
4. **Document** rõ ràng business logic
5. **Thêm unit tests** cho data integrity

---

*Phân tích dựa trên code và entity structure hiện tại.*

