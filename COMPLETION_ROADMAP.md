# 🚀 Roadmap hoàn thiện OEM-EV-Warranty-Management-System

## 📊 Mức độ hoàn thiện hiện tại: **85-90%**

---

## 🔴 **PRIORITY 1: Cần bổ sung ngay (để đạt 95%)**

### 1. WorkOrder Controller & APIs
**Mục đích:** Quản lý quá trình sửa chữa, track labor hours và parts used

**Cần tạo:**
- `WorkOrderController.java`
- `WorkOrderService.java` và `WorkOrderServiceImpl.java`
- DTOs: `WorkOrderCreateRequestDTO`, `WorkOrderResponseDTO`, `WorkOrderUpdateRequestDTO`

**Endpoints cần có:**
```
POST   /api/work-orders/create           - Tạo work order từ claim
GET    /api/work-orders/{id}             - Xem chi tiết work order
PUT    /api/work-orders/{id}/update      - Cập nhật tiến độ
POST   /api/work-orders/{id}/add-part    - Thêm phụ tùng đã thay
PUT    /api/work-orders/{id}/complete    - Hoàn tất work order
GET    /api/work-orders/claim/{claimId}  - Lấy work orders của claim
GET    /api/work-orders/technician/{id}  - Lấy work orders của technician
```

---

### 2. EVM Claim Approval APIs
**Mục đích:** EVM Staff phê duyệt hoặc từ chối yêu cầu bảo hành

**Cần bổ sung vào `EVMClaimController.java`:**

**Endpoints cần có:**
```
POST   /api/evm/claims/{id}/approve      - Phê duyệt claim
POST   /api/evm/claims/{id}/reject       - Từ chối claim
GET    /api/evm/claims/{id}              - Xem chi tiết claim
PUT    /api/evm/claims/{id}/request-info - Yêu cầu thông tin bổ sung
```

**DTOs cần tạo:**
- `EVMApprovalRequestDTO` (approvalNotes, warrantyCost)
- `EVMRejectionRequestDTO` (rejectionReason, rejectionNotes)

---

### 3. Claim Completion Flow
**Mục đích:** Đóng đơn bảo hành, giao xe cho khách

**Cần bổ sung vào `ClaimController.java`:**

**Endpoints cần có:**
```
POST   /api/claims/{id}/complete         - Đánh dấu claim hoàn tất
PUT    /api/claims/{id}/status           - Cập nhật trạng thái claim
POST   /api/claims/{id}/cancel           - Hủy claim
GET    /api/claims/{id}/timeline         - Xem timeline của claim
```

**Logic cần có:**
- Kiểm tra work order đã hoàn tất
- Cập nhật ClaimStatus = COMPLETED
- Tạo ClaimStatusHistory
- Notify customer (nếu có)

---

## 🟡 **PRIORITY 2: Nên có (để đạt 98%)**

### 4. Diagnostic Report Entity
**Mục đích:** Lưu trữ chi tiết chẩn đoán thay vì chỉ dùng text field

**Cần tạo:**
- `DiagnosticReport.java` entity
- `DiagnosticReportRepository.java`
- `DiagnosticReportDTO.java`

**Fields cần có:**
```java
@Entity
public class DiagnosticReport {
    private Integer id;
    private Claim claim;
    private User technician;
    private LocalDateTime diagnosedAt;
    private String faultCodes;           // JSON hoặc text
    private String symptoms;
    private String rootCause;
    private String recommendedAction;
    private String testResults;          // JSON test data
    private List<String> photoUrls;
}
```

---

### 5. SC Internal Approval Flow
**Mục đích:** SC Manager phê duyệt nội bộ trước khi gửi hãng

**Cần bổ sung vào `ClaimController.java`:**

**Endpoints cần có:**
```
POST   /api/claims/{id}/internal-approve  - SC Manager duyệt nội bộ
POST   /api/claims/{id}/internal-reject   - SC Manager từ chối nội bộ
```

**Logic:**
- Chỉ SC_MANAGER mới có quyền
- Tạo ClaimStatus mới: PENDING_INTERNAL_APPROVAL, INTERNAL_APPROVED, INTERNAL_REJECTED
- Sau khi internal approved → có thể submitToEvm

---

### 6. Notification Service
**Mục đích:** Thông báo cho khách hàng và nhân viên

**Cần tạo:**
- `NotificationService.java`
- `NotificationServiceImpl.java`
- `EmailService.java` (sử dụng Spring Mail)
- `SMSService.java` (tùy chọn)

**Sự kiện cần notify:**
- Claim được tạo → notify customer
- Claim được approve → notify SC Staff + customer
- Work order hoàn tất → notify customer
- Appointment reminder → notify customer (trước 1 ngày)

---

### 7. Dashboard & Analytics APIs
**Mục đích:** Hiển thị thống kê và báo cáo cho các role

**Cần tạo:**
- `DashboardController.java`
- `AnalyticsService.java`

**Endpoints cần có:**
```
GET /api/dashboard/sc-staff           - Dashboard cho SC Staff
GET /api/dashboard/technician         - Dashboard cho technician
GET /api/dashboard/evm-staff          - Dashboard cho EVM Staff
GET /api/analytics/claims-summary     - Tổng hợp claims theo status
GET /api/analytics/warranty-cost      - Chi phí bảo hành theo tháng
GET /api/analytics/technician-performance - Hiệu suất technician
```

---

## 🟢 **PRIORITY 3: Nice to have (để đạt 100%)**

### 8. Claim Comments/Notes System
**Mục đích:** Ghi chú và trao đổi nội bộ về claim

**Cần tạo:**
- `ClaimComment.java` entity
- `ClaimCommentController.java`
- APIs: POST /api/claims/{id}/comments, GET /api/claims/{id}/comments

---

### 9. Warranty Validation Service
**Mục đích:** Tự động kiểm tra điều kiện bảo hành

**Logic cần có:**
- Check warranty_start, warranty_end
- Check mileage (nếu có)
- Check lỗi có thuộc coverage không
- Check vehicle history (có accident không)

---

### 10. Part Inventory Management
**Mục đích:** Quản lý tồn kho phụ tùng

**Đã có entities:** Warehouse, Inventory, Shipment, ShipmentItem

**Cần bổ sung:**
- `InventoryController.java`
- APIs để check stock, request parts, track shipments

---

## 📋 **Checklist triển khai**

### Phase 1 (1-2 tuần) - Priority 1
- [ ] Tạo WorkOrderController với đầy đủ CRUD
- [ ] Bổ sung EVM approval/reject endpoints
- [ ] Bổ sung claim completion flow
- [ ] Test toàn bộ quy trình end-to-end

### Phase 2 (1 tuần) - Priority 2
- [ ] Tạo DiagnosticReport entity và APIs
- [ ] Thêm SC internal approval flow
- [ ] Implement notification service cơ bản
- [ ] Tạo dashboard APIs cơ bản

### Phase 3 (tùy chọn) - Priority 3
- [ ] Comments system
- [ ] Warranty validation service
- [ ] Inventory management UI
- [ ] Advanced analytics

---

## 🎯 **Kết luận**

**Hiện tại:** Project đã hoàn thiện **85-90%** quy trình bảo hành chuẩn.

**Sau Priority 1:** Sẽ đạt **95%** - Đủ để vận hành production.

**Sau Priority 2:** Sẽ đạt **98%** - Professional level.

**Sau Priority 3:** Sẽ đạt **100%** - Enterprise level với đầy đủ tính năng.

---

## 📞 **Ghi chú quan trọng**

1. **Database schema đã đầy đủ** - Không cần thay đổi nhiều
2. **Security đã có** - JWT, role-based access control
3. **Audit logging đã có** - Track changes
4. **File upload đã có** - Đính kèm ảnh, pdf
5. **Postman tests đã có** - Claims và Part Serial

**→ Chỉ cần bổ sung logic business và APIs còn thiếu!**

