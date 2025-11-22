# GIẢI THÍCH CHI TIẾT FLOW BẢO HÀNH CHÍNH

## 📋 TỔNG QUAN

Hệ thống quản lý bảo hành xe điện OEM hỗ trợ quy trình xử lý claim bảo hành từ khi khách hàng yêu cầu đến khi hoàn tất và đóng claim. Flow chính được chia thành **2 nhánh chính**:

1. **EVM_REPAIR** (Sửa chữa bảo hành - dùng phụ tùng từ kho EVM)
2. **SC_REPAIR** (Sửa chữa dịch vụ - dùng phụ tùng bên thứ 3, khách hàng thanh toán)

---

## 🔄 FLOW BẢO HÀNH CHÍNH - EVM_REPAIR

### **BƯỚC 1: TẠO CLAIM (Intake)**

**Endpoint:** `POST /api/claims/intake`  
**Quyền:** SC_STAFF, ADMIN

**Mô tả:**
- SC Staff tiếp nhận yêu cầu bảo hành từ khách hàng
- Thu thập thông tin:
  - Thông tin khách hàng (tên, SĐT, email, địa chỉ)
  - Thông tin xe (VIN - 17 ký tự, số km hiện tại)
  - Mô tả lỗi ban đầu (`reportedFailure`)
  - Tiêu đề claim (`claimTitle`)
- Hệ thống tự động:
  - Tìm hoặc tạo Customer trong DB
  - Tìm Vehicle theo VIN (phải tồn tại)
  - Cập nhật số km cho vehicle
  - Tạo Claim Number tự động (format: `CLM-YYYY-XXXXXX`)
  - Set trạng thái ban đầu: **OPEN** (nếu flow=INTAKE) hoặc **DRAFT** (nếu flow=DRAFT)
  - Nếu có gán technician ngay → tạo Work Order ban đầu

**Trạng thái sau bước này:** `OPEN` hoặc `DRAFT`

---

### **BƯỚC 2: CHẨN ĐOÁN (Diagnostic)**

**Endpoint:** `PUT /api/claims/{id}/diagnostic`  
**Quyền:** SC_STAFF, SC_TECHNICIAN, ADMIN

**Mô tả:**
- Technician hoặc SC Staff thực hiện chẩn đoán chi tiết
- Cập nhật thông tin:
  - `initialDiagnosis`: Chẩn đoán ban đầu
  - `diagnosticDetails`: Chi tiết chẩn đoán
  - `problemDescription`: Mô tả vấn đề
  - `problemType`: Loại vấn đề
  - `isWarrantyEligible`: Xác định có đủ điều kiện bảo hành không
  - `repairType`: Chọn loại sửa chữa (EVM_REPAIR hoặc SC_REPAIR)
  - `manualWarrantyOverride`: Ghi đè thủ công nếu cần (cần xác nhận)

**Hệ thống tự động kiểm tra warranty eligibility:**
- Kiểm tra thời hạn bảo hành (warrantyEnd date)
- Kiểm tra số km so với giới hạn bảo hành (WarrantyCondition)
- Lưu kết quả: `autoWarrantyEligible`, `autoWarrantyReasons`

**Logic phân nhánh sau chẩn đoán:**

#### **Nhánh A: Chọn SC_REPAIR**
- Nếu `repairType = SC_REPAIR`:
  - Chuyển trạng thái → **CUSTOMER_PAYMENT_PENDING**
  - Chờ khách hàng thanh toán
  - (Xem flow SC_REPAIR bên dưới)

#### **Nhánh B: Đủ điều kiện bảo hành (isWarrantyEligible = true)**
- Chuyển trạng thái → **PENDING_APPROVAL**
- Technician chuẩn bị gửi lên EVM để phê duyệt

#### **Nhánh C: Không đủ điều kiện bảo hành (isWarrantyEligible = false)**
- Chuyển trạng thái → **PENDING_CUSTOMER_APPROVAL**
- Gửi thông báo cho khách hàng về việc không đủ điều kiện bảo hành
- Chờ khách hàng xác nhận có muốn sửa bằng phụ tùng bên thứ 3 không

**Trạng thái sau bước này:** `PENDING_APPROVAL`, `CUSTOMER_PAYMENT_PENDING`, hoặc `PENDING_CUSTOMER_APPROVAL`

---

### **BƯỚC 3: GỬI LÊN EVM (Submit to EVM)**

**Endpoint:** `POST /api/claims/submit`  
**Quyền:** SC_STAFF, SC_TECHNICIAN, ADMIN

**Mô tả:**
- Technician/Staff xác nhận claim đã sẵn sàng gửi lên EVM
- Hệ thống validate:
  - VIN phải hợp lệ
  - Customer phải có phone hoặc email
  - Phải có mô tả lỗi chi tiết (≥10 ký tự)
  - Phải có thông tin chẩn đoán hoặc file đính kèm
- Tự động phân loại cost types cho các ClaimItem (WARRANTY/SERVICE)
- Chuyển trạng thái → **PENDING_EVM_APPROVAL**

**Trạng thái sau bước này:** `PENDING_EVM_APPROVAL`

---

### **BƯỚC 4: EVM PHÊ DUYỆT (EVM Approval/Rejection)**

**Endpoint:** 
- `POST /api/evm/claims/{claimId}/approve` (Phê duyệt)
- `POST /api/evm/claims/{claimId}/reject` (Từ chối)

**Quyền:** EVM_STAFF, ADMIN

#### **4A. PHÊ DUYỆT (Approve)**

**Mô tả:**
- EVM Staff xem xét claim và phê duyệt
- Cập nhật thông tin:
  - `warrantyCost`: Chi phí bảo hành được phê duyệt
  - `companyPaidCost`: Chi phí hãng thanh toán
- Hệ thống kiểm tra tồn kho phụ tùng:
  - Lấy danh sách phụ tùng cần thay thế (ClaimItem loại WARRANTY)
  - Kiểm tra tồn kho (currentStock - reservedStock)
  - Nếu đủ phụ tùng → chuyển trạng thái → **EVM_APPROVED**
  - Nếu thiếu phụ tùng → chuyển trạng thái → **WAITING_FOR_PARTS** hoặc **PENDING_PARTS**
- Lưu thông tin phê duyệt: `approvedBy`, `approvedAt`

**Trạng thái sau bước này:** `EVM_APPROVED` hoặc `WAITING_FOR_PARTS`

#### **4B. TỪ CHỐI (Reject)**

**Mô tả:**
- EVM Staff từ chối claim với lý do
- Cập nhật thông tin:
  - `rejectionReason`: Lý do từ chối
  - `rejectionNotes`: Ghi chú chi tiết
  - `rejectionCount`: Tăng số lần từ chối
  - `canResubmit`: Có cho phép nộp lại không (nếu final rejection = false)
- Chuyển trạng thái → **EVM_REJECTED**

**Trạng thái sau bước này:** `EVM_REJECTED`

**Xử lý sau khi bị từ chối:**
- Nếu `canResubmit = true` → Technician có thể resubmit (tối đa 1 lần)
- Endpoint resubmit: `POST /api/claims/{id}/resubmit`
- Khi resubmit: tăng `resubmitCount`, append thông tin chẩn đoán mới, chuyển về `PENDING_EVM_APPROVAL`

---

### **BƯỚC 5: SẴN SÀNG SỬA CHỮA (Ready for Repair)**

**Trạng thái:** `EVM_APPROVED` hoặc `READY_FOR_REPAIR`

**Mô tả:**
- Sau khi EVM phê duyệt và đủ phụ tùng, claim sẵn sàng để sửa chữa
- Technician được gán (nếu chưa có) → tạo Work Order
- Work Order chứa:
  - Thông tin technician
  - Danh sách phụ tùng cần thay thế
  - Loại work order: EVM hoặc SC

**Trạng thái sau bước này:** `READY_FOR_REPAIR` hoặc `IN_PROGRESS`

---

### **BƯỚC 6: SỬA CHỮA (Repair In Progress)**

**Endpoint:** `PUT /api/work-orders/{id}/update` (cập nhật work order)  
**Quyền:** SC_TECHNICIAN, SC_STAFF, ADMIN

**Mô tả:**
- Technician bắt đầu sửa chữa
- Cập nhật Work Order:
  - `startTime`: Thời gian bắt đầu
  - `repairNotes`: Ghi chú quá trình sửa
  - Quét và ghi nhận S/N phụ tùng thay thế (WorkOrderPart)
- Chuyển trạng thái → **REPAIR_IN_PROGRESS** hoặc **IN_PROGRESS**

**Lưu ý quan trọng:**
- Nếu claim có phụ tùng WARRANTY → **BẮT BUỘC** phải scan và ghi nhận S/N phụ tùng
- Hệ thống sẽ kiểm tra khi hoàn tất sửa chữa

**Trạng thái sau bước này:** `REPAIR_IN_PROGRESS` hoặc `IN_PROGRESS`

---

### **BƯỚC 7: HOÀN TẤT SỬA CHỮA (Complete Repair)**

**Endpoint:** `PUT /api/claims/{id}/complete-repair`  
**Quyền:** SC_TECHNICIAN, SC_STAFF, ADMIN

**Mô tả:**
- Technician hoàn tất công việc sửa chữa
- Hệ thống kiểm tra:
  - Nếu có phụ tùng WARRANTY → phải có ít nhất 1 WorkOrderPart đã ghi nhận S/N
  - Nếu thiếu → báo lỗi: "Vui lòng scan và ghi nhận S/N phụ tùng thay thế"
- Cập nhật Work Order:
  - `endTime`: Thời gian kết thúc
  - `result`: Kết quả sửa chữa
  - `testResults`: Kết quả kiểm tra
- Chuyển trạng thái → **FINAL_INSPECTION**

**Trạng thái sau bước này:** `FINAL_INSPECTION`

---

### **BƯỚC 8: KIỂM TRA CUỐI (Final Inspection)**

**Endpoint:** `POST /api/claims/{id}/final-inspection`  
**Quyền:** SC_STAFF, SC_TECHNICIAN, ADMIN

**Mô tả:**
- SC Staff hoặc Technician thực hiện kiểm tra cuối cùng
- Nhập kết quả:
  - `inspectionPassed`: true/false
  - `inspectionNotes`: Ghi chú kiểm tra
- Logic:
  - Nếu **pass** → chuyển trạng thái → **READY_FOR_HANDOVER**
  - Nếu **fail** → chuyển trạng thái → **IN_PROGRESS** (quay lại sửa)

**Trạng thái sau bước này:** `READY_FOR_HANDOVER` hoặc `IN_PROGRESS`

---

### **BƯỚC 9: BÀN GIAO XE (Vehicle Handover)**

**Endpoint:** `POST /api/claims/{id}/handover`  
**Quyền:** SC_STAFF, ADMIN

**Mô tả:**
- SC Staff bàn giao xe cho khách hàng
- Nhập thông tin:
  - `customerSatisfied`: Khách hàng có hài lòng không
  - `handoverNotes`: Ghi chú bàn giao
- Logic:
  - Nếu **khách hàng hài lòng** → chuyển trạng thái → **CLAIM_DONE**
  - Nếu **khách hàng không hài lòng** → chuyển trạng thái → **OPEN** (mở lại claim với chẩn đoán mới)

**Trạng thái sau bước này:** `CLAIM_DONE` hoặc `OPEN`

---

### **BƯỚC 10: ĐÓNG CLAIM (Close Claim)**

**Endpoint:** `POST /api/claims/{id}/close`  
**Quyền:** SC_STAFF, ADMIN

**Mô tả:**
- SC Staff đóng claim sau khi đã bàn giao
- Hệ thống tự động:
  - Điều chỉnh tồn kho: trừ `reservedStock` và `currentStock` theo số lượng phụ tùng đã dùng
  - Lưu vào Service History (lịch sử dịch vụ)
  - Chuyển trạng thái → **CLOSED**

**Trạng thái sau bước này:** `CLOSED` (Kết thúc flow)

---

## 🔄 FLOW SC_REPAIR (Sửa chữa dịch vụ - Khách hàng thanh toán)

### **Điểm khác biệt so với EVM_REPAIR:**

1. **Bước 2 (Chẩn đoán):**
   - Nếu chọn `repairType = SC_REPAIR` → chuyển trạng thái → **CUSTOMER_PAYMENT_PENDING**

2. **Bước 3: Chờ thanh toán (Payment Pending)**
   - **Endpoint:** `PUT /api/claims/{id}/payment-status?paymentStatus=PAID`
   - SC Staff cập nhật trạng thái thanh toán khi khách hàng đã thanh toán
   - Chuyển trạng thái → **CUSTOMER_PAID**

3. **Bước 4: Sửa chữa (tương tự EVM_REPAIR)**
   - Sử dụng phụ tùng bên thứ 3 (ThirdPartyPart)
   - Quét S/N phụ tùng bên thứ 3
   - Các bước sau tương tự EVM_REPAIR

---

## 🔄 FLOW XỬ LÝ NGOẠI LỆ

### **1. Problem Handling (Xử lý vấn đề phát sinh)**

**Khi nào:** Technician gặp vấn đề sau khi EVM đã approve (ví dụ: thiếu phụ tùng, lỗi kỹ thuật)

**Endpoint:** `POST /api/claims/{id}/report-problem`  
**Quyền:** SC_TECHNICIAN, SC_STAFF

**Mô tả:**
- Technician báo cáo vấn đề:
  - `problemType`: Loại vấn đề
  - `problemDescription`: Mô tả chi tiết
- Hệ thống:
  - Giới hạn số lần report (tối đa 5 lần)
  - Chuyển trạng thái → **PROBLEM_CONFLICT**
  - Gửi thông báo cho EVM team

**Xử lý:**
- EVM Staff xử lý: `POST /api/claims/{id}/resolve-problem`
- Chuyển trạng thái → **PROBLEM_SOLVED**
- Technician xác nhận: `POST /api/claims/{id}/confirm-resolution`
- Chuyển trạng thái → **READY_FOR_REPAIR**

---

### **2. Cancel Request (Yêu cầu hủy)**

**Khi nào:** Technician/Staff muốn hủy claim (ví dụ: khách hàng không muốn sửa nữa)

**Endpoint:** `POST /api/claims/{id}/request-cancel`  
**Quyền:** SC_TECHNICIAN, SC_STAFF, ADMIN

**Mô tả:**
- Yêu cầu hủy với lý do
- Chuyển trạng thái → **CANCEL_PENDING**
- SC Staff xử lý:
  - **Accept:** `POST /api/claims/{id}/cancel/accept` → **CANCELED_READY_TO_HANDOVER**
  - **Reject:** `POST /api/claims/{id}/cancel/reject` → quay về trạng thái trước đó
- Xác nhận bàn giao: `POST /api/claims/{id}/cancel/confirm-handover`
  - Giải phóng S/N phụ tùng
  - Hủy Work Order
  - Chuyển trạng thái → **CANCELED_DONE**

---

### **3. Customer Approval (Xác nhận khách hàng - không đủ điều kiện bảo hành)**

**Khi nào:** Claim không đủ điều kiện bảo hành, cần xác nhận khách hàng

**Endpoint:** `POST /api/claims/{id}/customer-approval?approved=true&notes=...`  
**Quyền:** SC_STAFF, ADMIN

**Mô tả:**
- Khách hàng xác nhận có muốn sửa bằng phụ tùng bên thứ 3 không
- Logic:
  - Nếu **approved = true** → **CUSTOMER_APPROVED_THIRD_PARTY** → **READY_FOR_REPAIR**
  - Nếu **approved = false** → **CANCELLED**

---

## 📊 SƠ ĐỒ TRẠNG THÁI (State Diagram)

```
DRAFT
  ↓ (convert to intake)
OPEN
  ↓ (diagnostic)
  ├─→ PENDING_APPROVAL (warranty eligible)
  │     ↓ (submit to EVM)
  │   PENDING_EVM_APPROVAL
  │     ├─→ EVM_APPROVED → READY_FOR_REPAIR → REPAIR_IN_PROGRESS
  │     └─→ EVM_REJECTED → (resubmit) → PENDING_EVM_APPROVAL
  │
  ├─→ CUSTOMER_PAYMENT_PENDING (SC_REPAIR)
  │     ↓ (payment)
  │   CUSTOMER_PAID → READY_FOR_REPAIR → REPAIR_IN_PROGRESS
  │
  └─→ PENDING_CUSTOMER_APPROVAL (not warranty eligible)
        ↓ (customer approval)
        ├─→ CUSTOMER_APPROVED_THIRD_PARTY → READY_FOR_REPAIR
        └─→ CANCELLED

REPAIR_IN_PROGRESS
  ↓ (complete repair)
FINAL_INSPECTION
  ↓ (inspection)
  ├─→ READY_FOR_HANDOVER (pass)
  └─→ IN_PROGRESS (fail - quay lại sửa)

READY_FOR_HANDOVER
  ↓ (handover)
  ├─→ CLAIM_DONE (customer satisfied)
  └─→ OPEN (customer not satisfied - mở lại)

CLAIM_DONE
  ↓ (close)
CLOSED ✅

[Problem Handling]
EVM_APPROVED → PROBLEM_CONFLICT → PROBLEM_SOLVED → READY_FOR_REPAIR

[Cancel Flow]
Any status → CANCEL_PENDING → CANCELED_READY_TO_HANDOVER → CANCELED_DONE
```

---

## 🔑 CÁC TRẠNG THÁI CHÍNH

| Trạng thái | Mô tả | Người xử lý |
|------------|-------|-------------|
| **DRAFT** | Nháp, chưa chính thức | SC_STAFF |
| **OPEN** | Đã tiếp nhận, chờ chẩn đoán | SC_STAFF, SC_TECHNICIAN |
| **PENDING_APPROVAL** | Chờ technician gửi lên EVM | SC_TECHNICIAN |
| **PENDING_EVM_APPROVAL** | Đã gửi lên EVM, chờ phê duyệt | EVM_STAFF |
| **EVM_APPROVED** | EVM đã phê duyệt | - |
| **EVM_REJECTED** | EVM từ chối | - |
| **READY_FOR_REPAIR** | Sẵn sàng sửa chữa | SC_TECHNICIAN |
| **REPAIR_IN_PROGRESS** | Đang sửa chữa | SC_TECHNICIAN |
| **FINAL_INSPECTION** | Kiểm tra cuối | SC_STAFF, SC_TECHNICIAN |
| **READY_FOR_HANDOVER** | Sẵn sàng bàn giao | SC_STAFF |
| **CLAIM_DONE** | Hoàn tất claim | - |
| **CLOSED** | Đã đóng claim | SC_STAFF |

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Warranty Eligibility Check:**
   - Hệ thống tự động kiểm tra khi tạo/chỉnh sửa claim
   - Có thể override thủ công nhưng cần xác nhận

2. **Serial Number Tracking:**
   - **BẮT BUỘC** scan S/N phụ tùng WARRANTY trước khi hoàn tất sửa chữa
   - Hệ thống sẽ kiểm tra và báo lỗi nếu thiếu

3. **Inventory Management:**
   - Khi EVM approve → kiểm tra tồn kho
   - Khi đóng claim → trừ tồn kho (reservedStock và currentStock)

4. **Status History:**
   - Mọi thay đổi trạng thái đều được ghi vào `ClaimStatusHistory`
   - Có thể truy vết toàn bộ lịch sử xử lý claim

5. **Work Order:**
   - Mỗi claim có thể có nhiều Work Order
   - Work Order được tạo tự động khi gán technician (nếu chưa có)

6. **Resubmit Limit:**
   - Tối đa 1 lần resubmit sau khi bị reject
   - Nếu `canResubmit = false` → không thể resubmit

---

## 📝 TÓM TẮT CÁC ENDPOINT CHÍNH

| Endpoint | Method | Mô tả | Quyền |
|----------|--------|-------|-------|
| `/api/claims/intake` | POST | Tạo claim mới | SC_STAFF, ADMIN |
| `/api/claims/{id}/diagnostic` | PUT | Cập nhật chẩn đoán | SC_STAFF, SC_TECHNICIAN, ADMIN |
| `/api/claims/submit` | POST | Gửi lên EVM | SC_STAFF, SC_TECHNICIAN, ADMIN |
| `/api/evm/claims/{id}/approve` | POST | EVM phê duyệt | EVM_STAFF, ADMIN |
| `/api/evm/claims/{id}/reject` | POST | EVM từ chối | EVM_STAFF, ADMIN |
| `/api/claims/{id}/complete-repair` | PUT | Hoàn tất sửa chữa | SC_TECHNICIAN, SC_STAFF, ADMIN |
| `/api/claims/{id}/final-inspection` | POST | Kiểm tra cuối | SC_STAFF, SC_TECHNICIAN, ADMIN |
| `/api/claims/{id}/handover` | POST | Bàn giao xe | SC_STAFF, ADMIN |
| `/api/claims/{id}/close` | POST | Đóng claim | SC_STAFF, ADMIN |

---

*Tài liệu này mô tả chi tiết flow bảo hành chính của hệ thống. Để biết thêm về các flow phụ (cancel, problem handling, etc.), xem phần "FLOW XỬ LÝ NGOẠI LỆ" ở trên.*



