# PHÂN TÍCH DATABASE - HỆ THỐNG QUẢN LÝ BẢO HÀNH XE ĐIỆN OEM

## TỔNG QUAN
Hệ thống quản lý bảo hành cho xe điện với **37 entity** chính, hỗ trợ quy trình từ đăng ký claim, chẩn đoán, sửa chữa, đến thanh toán và quản lý kho.

---

## 1. QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN

### 1.1. User (users)
- **Mục đích**: Quản lý tất cả người dùng trong hệ thống
- **Trường chính**:
  - `username`, `email`, `passwordHash`
  - `fullName`, `phone`
  - `role` (FK → Role)
  - `serviceCenterId` (cho SC_STAFF, SC_TECHNICIAN)
  - `active` (trạng thái hoạt động)
- **Quan hệ**:
  - Many-to-One với `Role`
  - Many-to-One với `ServiceCenter` (read-only)
  - Được tham chiếu bởi nhiều entity khác (createdBy, approvedBy, etc.)

### 1.2. Role (roles)
- **Mục đích**: Định nghĩa các vai trò trong hệ thống
- **Trường chính**: `roleName`, `description`

### 1.3. TechnicianProfile (technician_profiles)
- **Mục đích**: Thông tin chi tiết về kỹ thuật viên
- **Trường chính**:
  - `assignmentStatus` (AVAILABLE/BUSY)
  - `currentWorkload`, `maxWorkload`
  - `specialization`, `certificationLevel`
  - `totalCompletedWorkOrders`, `averageCompletionHours`
- **Quan hệ**: One-to-One với `User`
- **Đặc biệt**: Có business logic methods để quản lý workload

---

## 2. QUẢN LÝ KHÁCH HÀNG & XE

### 2.1. Customer (customers)
- **Mục đích**: Thông tin khách hàng
- **Trường chính**: `name`, `email`, `phone`, `address`
- **Quan hệ**:
  - Many-to-One với `User` (createdBy)
  - One-to-Many với `Vehicle`

### 2.2. Vehicle (vehicles)
- **Mục đích**: Thông tin xe điện
- **Trường chính**:
  - `vin` (unique), `licensePlate` (unique)
  - `model`, `year`
  - `registrationDate`, `warrantyStart`, `warrantyEnd`
  - `mileageKm` (số km hiện tại)
- **Quan hệ**:
  - Many-to-One với `Customer`
  - Many-to-One với `VehicleModel`
  - One-to-Many với `Claim`, `Appointment`, `ServiceHistory`

### 2.3. VehicleModel (vehicle_models)
- **Mục đích**: Định nghĩa các model xe
- **Trường chính**:
  - `code` (unique), `name`, `brand`
  - `warrantyMilageLimit` (km tối đa)
  - `warrantyPeriodMonths` (thời hạn bảo hành)
  - `active`
- **Quan hệ**: One-to-Many với `Vehicle`, `WarrantyCondition`

---

## 3. QUẢN LÝ BẢO HÀNH & CHÍNH SÁCH

### 3.1. WarrantyPolicy (warranty_policies)
- **Mục đích**: Chính sách bảo hành
- **Trường chính**:
  - `code` (unique), `name`, `description`
  - `applicableModel`, `applicableYearFrom/To`
  - `effectiveFrom/To`
  - `status` (draft/active/retired)
- **Quan hệ**:
  - Many-to-One với `User` (createdBy)
  - One-to-Many với `PolicyRule`

### 3.2. WarrantyCondition (warranty_conditions)
- **Mục đích**: Điều kiện bảo hành theo model
- **Trường chính**:
  - `coverageYears`, `coverageKm`
  - `conditionsText`
  - `effectiveFrom/To`, `active`
- **Quan hệ**: Many-to-One với `VehicleModel`
- **Sử dụng**: Hệ thống tự động check warranty eligibility

### 3.3. PolicyRule (policy_rules)
- **Mục đích**: Quy tắc chi tiết trong chính sách bảo hành
- **Trường chính**:
  - `componentCategory` (Battery/Motor/BMS/...)
  - `coverageType` (time_km/time_only/km_only)
  - `maxYears`, `maxKm`
  - `exclusions`, `conditionsJson`
  - `priority`
- **Quan hệ**: Many-to-One với `WarrantyPolicy`

---

## 4. QUẢN LÝ CLAIM (YÊU CẦU BẢO HÀNH)

### 4.1. Claim (claims) ⭐ **ENTITY TRUNG TÂM**
- **Mục đích**: Yêu cầu bảo hành
- **Trường chính**:
  - `claimNumber` (unique)
  - `reportedFailure`, `initialDiagnosis`, `diagnosticDetails`
  - `problemDescription`, `problemType`
  - `warrantyCost`, `companyPaidCost`
  - `isActive`
- **Quan hệ**:
  - Many-to-One: `Vehicle`, `Customer`, `User` (createdBy, assignedTechnician, approvedBy, rejectedBy)
  - Many-to-One: `ClaimStatus`
  - One-to-Many: `ClaimItem`, `WorkOrder`, `ClaimAttachment`, `ClaimStatusHistory`, `ApprovalTask`, `BillingDocument`, `Appointment`
- **Tính năng đặc biệt**:
  - **Auto warranty eligibility**: `autoWarrantyEligible`, `autoWarrantyReasons`, `autoWarrantyCheckedAt`
  - **Manual override**: `manualWarrantyOverride`, `manualOverrideConfirmed`
  - **Repair type**: `repairType` (EVM_REPAIR/SC_REPAIR)
  - **Service catalog**: `serviceCatalogItems` (JSON), `totalServiceCost`, `totalThirdPartyPartsCost`
  - **Rejection tracking**: `rejectionCount`, `rejectionReason`, `rejectionNotes`, `canResubmit`
  - **Cancel request**: `cancelRequestCount`, `cancelRequestedBy`, `cancelHandledBy`, `cancelReason`
  - **Resubmit tracking**: `resubmitCount`

### 4.2. ClaimStatus (claim_statuses)
- **Mục đích**: Trạng thái của claim
- **Trường chính**: `code` (unique), `label`

### 4.3. ClaimStatusHistory (claim_status_history)
- **Mục đích**: Lịch sử thay đổi trạng thái claim
- **Trường chính**: `changedAt`, `note`
- **Quan hệ**: Many-to-One với `Claim`, `ClaimStatus`, `User` (changedBy)

### 4.4. ClaimItem (claim_items)
- **Mục đích**: Các item (phụ tùng/dịch vụ) trong claim
- **Trường chính**:
  - `itemType` (PART/SERVICE)
  - `quantity`, `unitPrice`, `laborHours`
  - `costType` (WARRANTY/SERVICE)
  - `status` (PROPOSED/APPROVED/REJECTED/REVISED)
- **Quan hệ**:
  - Many-to-One với `Claim`
  - Many-to-One với `Part`, `PartSerial`, `ServiceItem` (nullable)
  - Many-to-One với `PolicyRule` (policyRuleApplied)

### 4.5. ClaimAttachment (claim_attachments)
- **Mục đích**: File đính kèm của claim
- **Trường chính**:
  - `fileName`, `originalFileName`, `filePath`
  - `fileSize`, `fileType`, `contentType`
  - `attachmentType` (DIAGNOSTIC_FILE/PHOTO/VIDEO/DOCUMENT/RECEIPT/OTHER)
- **Quan hệ**: Foreign key `claimId` (không dùng JPA relationship)

---

## 5. QUẢN LÝ CÔNG VIỆC SỬA CHỮA

### 5.1. WorkOrder (work_orders)
- **Mục đích**: Phiếu công việc sửa chữa
- **Trường chính**:
  - `startTime`, `endTime`
  - `result`, `testResults`, `repairNotes`
  - `laborHours`
  - `workOrderType` (EVM/SC)
  - `status` (OPEN/DONE)
  - `statusDescription`
- **Quan hệ**:
  - Many-to-One với `Claim`, `User` (technician)
  - One-to-Many với `WorkOrderPart`

### 5.2. WorkOrderPart (work_order_parts)
- **Mục đích**: Phụ tùng sử dụng trong work order
- **Trường chính**:
  - `quantity`
  - `partSource` (EVM_WAREHOUSE/THIRD_PARTY)
  - `thirdPartySerialNumber`
- **Quan hệ**:
  - Many-to-One với `WorkOrder`
  - Many-to-One với `Part`, `PartSerial` (nullable)
  - Many-to-One với `ThirdPartyPart` (nullable)

---

## 6. QUẢN LÝ PHỤ TÙNG & KHO

### 6.1. Part (parts)
- **Mục đích**: Danh mục phụ tùng
- **Trường chính**:
  - `partNumber` (unique), `name`
  - `category`, `description`
  - `unitCost`
- **Quan hệ**: One-to-Many với `PartSerial`, `Inventory`, `ClaimItem`, `WorkOrderPart`, `ShipmentItem`

### 6.2. PartSerial (part_serials)
- **Mục đích**: Serial number của từng phụ tùng
- **Trường chính**:
  - `serialNumber` (unique)
  - `manufactureDate`
  - `status` (in_stock/allocated/installed/returned)
  - `installedAt`
- **Quan hệ**:
  - Many-to-One với `Part`, `Vehicle` (installedOnVehicle)
  - One-to-Many với `PartSerialHistory`

### 6.3. PartSerialHistory (part_serial_history)
- **Mục đích**: Lịch sử thay đổi của part serial
- **Trường chính**: `action`, `oldStatus`, `newStatus`, `reason`, `notes`
- **Quan hệ**: Many-to-One với `PartSerial`, `Vehicle`, `User`, `WorkOrder`

### 6.4. Warehouse (warehouses)
- **Mục đích**: Kho chứa phụ tùng
- **Trường chính**:
  - `name`, `location`
  - `warehouseType` (main/regional/service_center)
  - `active`
- **Quan hệ**: One-to-Many với `Inventory`, `Shipment`, `StockReservation`

### 6.5. Inventory (inventory)
- **Mục đích**: Tồn kho phụ tùng theo kho
- **Trường chính**:
  - `currentStock`, `reservedStock`
  - `minimumStock`, `maximumStock`
  - `unitCost`
- **Quan hệ**: Many-to-One với `Warehouse`, `Part`, `User` (lastUpdatedBy)

### 6.6. StockReservation (stock_reservations)
- **Mục đích**: Đặt chỗ phụ tùng từ kho
- **Trường chính**:
  - `quantity`
  - `status` (CREATED/COMMITTED/RELEASED/CANCELLED)
- **Quan hệ**:
  - Many-to-One với `Claim`, `WorkOrder` (nullable)
  - Many-to-One với `Warehouse`, `Part`, `PartSerial` (nullable)
  - Many-to-One với `User` (createdBy)

### 6.7. Shipment (shipments)
- **Mục đích**: Vận chuyển phụ tùng từ kho đến service center
- **Trường chính**:
  - `shippedAt`, `deliveredAt`
  - `status` (pending/in_transit/delivered/cancelled)
  - `trackingNumber`, `carrier`
- **Quan hệ**:
  - Many-to-One với `Warehouse`, `ServiceCenter` (destinationServiceCenter)
  - Many-to-One với `Claim`, `WorkOrder` (nullable)
  - Many-to-One với `User` (createdBy)
  - One-to-Many với `ShipmentItem`

### 6.8. ShipmentItem (shipment_items)
- **Mục đích**: Chi tiết phụ tùng trong shipment
- **Trường chính**: `quantity`, `notes`
- **Quan hệ**: Many-to-One với `Shipment`, `Part`

---

## 7. PHỤ TÙNG BÊN THỨ BA (THIRD-PARTY PARTS)

### 7.1. ThirdPartyPart (third_party_parts)
- **Mục đích**: Phụ tùng từ nhà cung cấp bên thứ ba
- **Trường chính**:
  - `partNumber` (unique), `name`, `category`
  - `supplier`
  - `unitCost`, `quantity`
  - `serviceCenterId`
- **Quan hệ**: One-to-Many với `ThirdPartyPartSerial`

### 7.2. ThirdPartyPartSerial (third_party_part_serials)
- **Mục đích**: Serial number của phụ tùng bên thứ ba
- **Trường chính**:
  - `serialNumber` (unique)
  - `status` (AVAILABLE/RESERVED/USED/DEACTIVATED)
  - `installedAt`, `installedBy`
- **Quan hệ**:
  - Many-to-One với `ThirdPartyPart`
  - Many-to-One với `WorkOrder`, `Vehicle` (installedOnVehicle)
  - Many-to-One với `Claim` (reservedForClaim)

---

## 8. DỊCH VỤ & CATALOG

### 8.1. ServiceItem (service_items)
- **Mục đích**: Danh mục dịch vụ sửa chữa
- **Trường chính**:
  - `serviceCode` (unique), `name`, `description`
  - `standardLaborHours`
  - `category`, `active`
- **Quan hệ**: Được tham chiếu bởi `ClaimItem`, `CampaignItem`

### 8.2. CatalogPrice (catalog_prices)
- **Mục đích**: Bảng giá theo khu vực/service center
- **Trường chính**:
  - `itemType` (PART/SERVICE)
  - `itemId` (FK to Part.id or ServiceItem.id)
  - `price`, `currency`
  - `region`, `serviceCenterId`
  - `effectiveFrom/To`
- **Đặc biệt**: Unique constraint trên (itemType, itemId, region, serviceCenterId, effectiveFrom)

---

## 9. SERVICE CENTER

### 9.1. ServiceCenter (service_centers)
- **Mục đích**: Trung tâm dịch vụ
- **Trường chính**:
  - `code` (unique), `name`, `location`, `address`
  - `phone`, `email`, `managerName`
  - `region` (NORTH/SOUTH/CENTRAL/...)
  - `isMainBranch`, `capacity`
  - `active`
- **Quan hệ**:
  - Self-referencing: `parentServiceCenter` (quan hệ chi nhánh)
  - One-to-Many với `User` (serviceCenterId)

---

## 10. QUẢN LÝ PHÊ DUYỆT

### 10.1. ApprovalTask (approval_tasks)
- **Mục đích**: Nhiệm vụ phê duyệt
- **Trường chính**:
  - `type` (EVM/CUSTOMER)
  - `status` (PENDING/APPROVED/REJECTED/NEED_MORE_INFO)
  - `quotedAmount` (cho CUSTOMER type)
  - `note`, `attachmentsJson`
  - `requestedAt`, `decisionAt`
- **Quan hệ**:
  - Many-to-One với `Claim`, `ClaimItem` (nullable)
  - Many-to-One với `User` (requestedBy, approver)

---

## 11. THANH TOÁN & HÓA ĐƠN

### 11.1. BillingDocument (billing_documents)
- **Mục đích**: Tài liệu thanh toán/hóa đơn
- **Trường chính**:
  - `type` (WARRANTY_SETTLEMENT/INVOICE)
  - `amountDue`, `amountPaid`
  - `status` (DRAFT/ISSUED/APPROVED/PAID/VOID/REJECTED)
  - `issuedAt`, `approvedAt`, `paidAt`
  - `remark`
- **Quan hệ**: Many-to-One với `Claim`

---

## 12. LỊCH HẸN & LỊCH SỬ

### 12.1. Appointment (appointments)
- **Mục đích**: Lịch hẹn khách hàng
- **Trường chính**:
  - `scheduledAt`
  - `status` (scheduled/...)
  - `notifiedCustomer`
- **Quan hệ**: Many-to-One với `Vehicle`, `Claim` (nullable), `User` (createdBy)

### 12.2. ServiceHistory (service_history)
- **Mục đích**: Lịch sử dịch vụ đã thực hiện
- **Trường chính**:
  - `serviceType` (maintenance/warranty_repair/recall)
  - `description`, `performedAt`
  - `mileageKm`
- **Quan hệ**: Many-to-One với `Vehicle`, `Customer`, `User` (performedBy)

---

## 13. RECALL CAMPAIGN

### 13.1. RecallCampaign (recall_campaigns)
- **Mục đích**: Chiến dịch thu hồi xe
- **Trường chính**:
  - `code` (unique), `title`, `description`
  - `releasedAt`
  - `status` (draft/...)
- **Quan hệ**:
  - Many-to-One với `User` (createdBy)
  - One-to-Many với `CampaignItem`, `CampaignVehicle`

### 13.2. CampaignItem (campaign_items)
- **Mục đích**: Item (phụ tùng/dịch vụ) trong recall campaign
- **Trường chính**:
  - `itemType` (PART/SERVICE/SOFTWARE)
  - `quantity`
  - `defaultCostType` (WARRANTY)
- **Quan hệ**: Many-to-One với `RecallCampaign`, `Part`, `ServiceItem` (nullable)

### 13.3. CampaignVehicle (campaign_vehicles)
- **Mục đích**: Xe thuộc recall campaign
- **Trường chính**: `notified`, `processed`, `processedAt`
- **Quan hệ**: Many-to-One với `RecallCampaign`, `Vehicle`

---

## 14. AUDIT & LOGGING

### 14.1. AuditLog (audit_logs)
- **Mục đích**: Ghi log các hành động trong hệ thống
- **Trường chính**:
  - `action`, `objectType`, `objectId`
  - `details`
- **Quan hệ**: Many-to-One với `User`

---

## SƠ ĐỒ QUAN HỆ CHÍNH

```
Customer (1) ──< (N) Vehicle (1) ──< (N) Claim
                                              │
                                              ├──< (N) ClaimItem
                                              ├──< (N) WorkOrder ──< (N) WorkOrderPart
                                              ├──< (N) ClaimAttachment
                                              ├──< (N) ClaimStatusHistory
                                              ├──< (N) ApprovalTask
                                              ├──< (N) BillingDocument
                                              └──< (N) Appointment

VehicleModel (1) ──< (N) Vehicle
              │
              └──< (N) WarrantyCondition

WarrantyPolicy (1) ──< (N) PolicyRule

Part (1) ──< (N) PartSerial ──< (N) PartSerialHistory
    │
    ├──< (N) Inventory
    ├──< (N) ClaimItem
    ├──< (N) WorkOrderPart
    └──< (N) ShipmentItem

Warehouse (1) ──< (N) Inventory
          │
          ├──< (N) Shipment ──< (N) ShipmentItem
          └──< (N) StockReservation

ServiceCenter (1) ──< (N) User
                    │
                    └──< (N) ThirdPartyPart ──< (N) ThirdPartyPartSerial

User (1) ──< (1) TechnicianProfile

RecallCampaign (1) ──< (N) CampaignItem
                │
                └──< (N) CampaignVehicle
```

---

## ĐIỂM NỔI BẬT CỦA HỆ THỐNG

### 1. **Hỗ trợ 2 loại sửa chữa**:
   - **EVM Repair**: Sử dụng phụ tùng từ kho EVM
   - **SC Repair**: Sử dụng phụ tùng bên thứ ba, khách hàng thanh toán

### 2. **Auto Warranty Eligibility**:
   - Hệ thống tự động kiểm tra điều kiện bảo hành dựa trên `WarrantyCondition`
   - Lưu kết quả: `autoWarrantyEligible`, `autoWarrantyReasons`
   - Cho phép technician override thủ công với xác nhận

### 3. **Quản lý kho phức tạp**:
   - Hỗ trợ nhiều kho (main/regional/service_center)
   - Quản lý serial number cho từng phụ tùng
   - Đặt chỗ (reservation) và vận chuyển (shipment)

### 4. **Workflow phê duyệt**:
   - ApprovalTask hỗ trợ 2 loại: EVM và CUSTOMER
   - Tracking rejection/resubmit/cancel request

### 5. **Service Catalog & Pricing**:
   - CatalogPrice hỗ trợ giá theo khu vực/service center
   - ServiceItem với standard labor hours

### 6. **Recall Campaign Management**:
   - Quản lý chiến dịch thu hồi xe
   - Tracking notification và processing status

### 7. **Audit Trail**:
   - ClaimStatusHistory: lịch sử thay đổi trạng thái
   - PartSerialHistory: lịch sử phụ tùng
   - AuditLog: log tổng quát

---

## GỢI Ý CẢI THIỆN

1. **Indexing**: Nên thêm index cho các trường thường query:
   - `claims.claim_number`
   - `vehicles.vin`
   - `vehicles.license_plate`
   - `part_serials.serial_number`

2. **Soft Delete**: Một số entity có `isActive`, nhưng không nhất quán. Có thể cân nhắc soft delete pattern.

3. **Enum Types**: Một số trường dùng String cho status (như `claim_statuses.code`), có thể cân nhắc dùng Enum.

4. **JSON Fields**: Một số trường dùng JSON string (`serviceCatalogItems`, `conditionsJson`), có thể cân nhắc dùng JSON type của database.

5. **Cascade Operations**: Cần review cascade settings cho các relationship để đảm bảo data integrity.

---

*Phân tích được tạo tự động dựa trên các entity JPA trong dự án.*

