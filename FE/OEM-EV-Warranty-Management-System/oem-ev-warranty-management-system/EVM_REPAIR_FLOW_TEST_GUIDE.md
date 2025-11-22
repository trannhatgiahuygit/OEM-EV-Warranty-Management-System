# Hướng Dẫn Test Luồng EVM Repair Từ Đầu Đến Cuối

## 📋 Tổng Quan

Hướng dẫn này mô tả cách test toàn bộ luồng **EVM Repair** từ việc thêm mới điều kiện bảo hành cho một loại xe cho đến khi hoàn thành bàn giao xe cho khách hàng.

**Luồng bao gồm:**
1. Thêm điều kiện bảo hành cho Vehicle Model (EVM Staff)
2. Tạo Claim mới (SC Staff)
3. Chuyển Claim từ Draft sang Intake (SC Staff)
4. Update Diagnostic (Technician)
5. EVM Approval (EVM Staff)
6. Work Done - Hoàn thành sửa chữa (Technician)
7. Claim Done - Bàn giao xe cho khách hàng (SC Staff)

---

## 🚀 Chuẩn Bị

### 1. Khởi động Development Server

```bash
cd oem-ev-warranty-management-system
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

### 2. Tài Khoản Cần Thiết

- **EVM_STAFF** - Để tạo điều kiện bảo hành và approve claims
- **SC_STAFF** - Để tạo claims và bàn giao xe
- **SC_TECHNICIAN** - Để update diagnostic và hoàn thành sửa chữa

### 3. Dữ Liệu Test Cần Chuẩn Bị

- **Vehicle Model** đã tồn tại trong hệ thống
- **Customer** đã tồn tại
- **Vehicle** đã được tạo và gán cho customer
- **Service Center** đã được setup

---

## 📝 Test Flow Chi Tiết

### **Bước 1: Thêm Điều Kiện Bảo Hành Cho Vehicle Model**

**Người thực hiện:** EVM Staff

**Mục đích:** Tạo điều kiện bảo hành cho một loại xe cụ thể

#### Các bước:

1. **Đăng nhập với tài khoản EVM Staff**

2. **Navigate đến Warranty Condition Management:**
   - Vào **Dashboard** → **Warranty Condition Management**

3. **Tạo điều kiện bảo hành mới:**
   - Click nút **"Tạo Điều Kiện Mới"** hoặc **"Thêm Điều Kiện"**
   - Điền form:
     - **Mẫu Xe:** Chọn vehicle model (ví dụ: "VF 8", "VF 9")
     - **Tên chính sách:** Nhập tên (ví dụ: "Bảo hành tiêu chuẩn VF 8")
     - **Thời hạn bảo hành (năm):** Nhập số năm (ví dụ: `5`)
     - **Quãng đường (km):** Nhập số km (ví dụ: `100000`)
   - Click **"Lưu"** hoặc **"Tạo"**

4. **Kiểm tra kết quả:**
   - ✅ Thông báo thành công: "Đã tạo điều kiện bảo hành thành công!"
   - ✅ Điều kiện mới xuất hiện trong danh sách "Tất cả điều kiện"
   - ✅ Tự động chuyển sang tab "Tất cả điều kiện" sau khi tạo

**Dữ liệu test mẫu:**
```
Vehicle Model: VF 8
Policy Name: Bảo hành tiêu chuẩn VF 8
Coverage Years: 5
Coverage Km: 100000
```

---

### **Bước 2: Tạo Claim Mới (Draft)**

**Người thực hiện:** SC Staff

**Mục đích:** Tạo yêu cầu sửa chữa mới cho xe của khách hàng

#### Các bước:

1. **Đăng nhập với tài khoản SC Staff**

2. **Navigate đến New Repair Claim:**
   - Vào **Dashboard** → **Claim Management** → **New Repair Claim**

3. **Điền thông tin claim:**
   - **Customer:** Chọn hoặc tìm customer
   - **Vehicle:** Chọn vehicle từ danh sách xe của customer
   - **Reported Failure:** Mô tả lỗi (ví dụ: "Xe không khởi động được, có tiếng kêu lạ từ động cơ")
   - **Repair Type:** Chọn **"EVM_REPAIR"**
   - **Service Center:** Chọn service center
   - Các thông tin khác (nếu có)

4. **Lưu Draft:**
   - Click **"Lưu Draft"** hoặc **"Save as Draft"**
   - ✅ Thông báo: "Draft đã được lưu thành công"
   - ✅ Claim được tạo với status: `DRAFT`

5. **Kiểm tra trong Claim Management:**
   - Vào **Claim Management** → Tab **"Draft Claims"**
   - ✅ Claim mới xuất hiện trong danh sách

**Dữ liệu test mẫu:**
```
Customer: [Chọn customer có sẵn]
Vehicle: [Chọn vehicle của customer đó]
Reported Failure: "Xe không khởi động được, có tiếng kêu lạ từ động cơ"
Repair Type: EVM_REPAIR
Service Center: [Chọn service center]
```

---

### **Bước 3: Chuyển Claim Từ Draft Sang Intake**

**Người thực hiện:** SC Staff

**Mục đích:** Chuyển claim từ draft sang intake và phân công technician

#### Các bước:

1. **Mở Claim Detail:**
   - Vào **Claim Management** → Tab **"Draft Claims"**
   - Click vào claim vừa tạo để xem chi tiết

2. **Chuyển sang Intake:**
   - Click nút **"Process to Intake"** hoặc **"Chuyển sang Intake"**
   - **Phân công Technician:** Chọn technician từ dropdown
   - Click **"Submit"** hoặc **"Xác nhận"**

3. **Kiểm tra kết quả:**
   - ✅ Thông báo: "Yêu cầu đã được xử lý thành công!"
   - ✅ Thông báo: "Work Order đã được tạo và phân công cho kỹ thuật viên được chọn!"
   - ✅ Claim status chuyển từ `DRAFT` → `INTAKE`
   - ✅ Work Order được tạo và gán cho technician

4. **Kiểm tra trong Claim Management:**
   - Vào **Claim Management** → Tab **"Intake Claims"**
   - ✅ Claim xuất hiện trong danh sách với status `INTAKE`

---

### **Bước 4: Update Diagnostic (Technician)**

**Người thực hiện:** SC Technician

**Mục đích:** Technician chẩn đoán và cập nhật thông tin sửa chữa

#### Các bước:

1. **Đăng nhập với tài khoản SC Technician**

2. **Navigate đến Claim:**
   - Vào **Dashboard** → **Claim Management**
   - Tìm claim có status `INTAKE` và được assign cho technician này
   - Click vào claim để xem chi tiết

3. **Mở Update Diagnostic Page:**
   - Từ claim detail page, click **"Update Diagnostic"** hoặc **"Cập nhật Chẩn đoán"**

4. **Kiểm tra Auto Warranty Check:**
   - ✅ Hệ thống tự động kiểm tra điều kiện bảo hành
   - ✅ Hiển thị kết quả: `PASS`, `FAIL`, hoặc `NO_CONSTRAINTS`
   - ✅ Hiển thị lý do (nếu có)

5. **Điền thông tin Diagnostic:**
   - **Diagnostic Details:** Mô tả chi tiết chẩn đoán (ví dụ: "Kiểm tra pin, phát hiện cell pin bị hỏng")
   - **Initial Diagnosis:** Chẩn đoán ban đầu
   - **Test Results:** Kết quả kiểm tra
   - **Repair Notes:** Ghi chú sửa chữa

6. **Thêm Required Parts (EVM Parts):**
   - Trong phần **"Required Parts"**, click **"Thêm Linh Kiện"**
   - **Search Parts:** Nhập tên hoặc mã linh kiện (ví dụ: "battery", "pin")
   - ✅ **Kiểm tra Filter:** Chỉ hiển thị parts phù hợp với vehicle type của claim
   - Chọn part từ kết quả search
   - Nhập **Quantity:** Số lượng cần thiết
   - Click **"Thêm"**

7. **Thêm Service Catalog Items (nếu có):**
   - Trong phần **"Service Catalog"**, thêm các service items
   - Hệ thống tự động tính `totalServiceCost`

8. **Điền Warranty Eligibility (cho EVM_REPAIR):**
   - **Warranty Eligibility Assessment:** Đánh giá (ví dụ: "Đủ điều kiện bảo hành")
   - **Is Warranty Eligible:** Chọn `Yes` hoặc `No`
   - **Warranty Eligibility Notes:** Ghi chú (nếu cần)
   - Nếu warranty check `FAIL`, có thể **Warranty Override** (nếu được phép)

9. **Submit Diagnostic:**
   - Click **"Submit Diagnostic"** hoặc **"Gửi Chẩn Đoán"**
   - ✅ Thông báo: "Diagnostic đã được gửi thành công!"
   - ✅ Claim status chuyển từ `INTAKE` → `PENDING_EVM_APPROVAL`
   - ✅ Reserved parts được release tự động

10. **Kiểm tra trong EVM Claim Management:**
    - Vào **EVM Claim Management** → Tab **"Pending EVM Approval"**
    - ✅ Claim xuất hiện trong danh sách với status `PENDING_EVM_APPROVAL`

**Dữ liệu test mẫu:**
```
Diagnostic Details: "Kiểm tra pin, phát hiện cell pin bị hỏng. Cần thay thế pin mới."
Initial Diagnosis: "Pin hỏng"
Test Results: "Đo điện áp pin: 0V, pin không còn khả năng sạc"
Repair Notes: "Thay thế pin mới, kiểm tra hệ thống sạc"
Required Parts: Battery Pack (Quantity: 1)
Warranty Eligibility: Yes
```

---

### **Bước 5: EVM Approval**

**Người thực hiện:** EVM Staff

**Mục đích:** EVM Staff xem xét và phê duyệt claim

#### Các bước:

1. **Đăng nhập với tài khoản EVM Staff**

2. **Navigate đến EVM Claim Management:**
   - Vào **Dashboard** → **EVM Claim Management**
   - Tab **"Pending EVM Approval"**

3. **Xem Claim Chi Tiết:**
   - Click vào claim cần approve
   - Xem thông tin:
     - Claim context (VIN, Reported Failure, Warranty Cost)
     - Diagnostic details
     - Required parts
     - Warranty eligibility assessment

4. **Approve Claim:**
   - Click nút **"Approve"** hoặc **"Phê Duyệt"**
   - Điền form approval:
     - **Approval Notes:** Ghi chú phê duyệt (ví dụ: "Đồng ý phê duyệt, đủ điều kiện bảo hành")
     - **Warranty Cost:** Kiểm tra và xác nhận chi phí (tự động từ diagnostic)
     - **Approval Reason:** Lý do phê duyệt
     - **Requires Parts Shipment:** Chọn `Yes` nếu cần gửi parts
     - **Special Instructions:** Hướng dẫn đặc biệt (nếu có)
   - Click **"Submit Approval"** hoặc **"Xác nhận Phê Duyệt"**

5. **Kiểm tra kết quả:**
   - ✅ Thông báo: "Claim đã được phê duyệt thành công!"
   - ✅ Claim status chuyển từ `PENDING_EVM_APPROVAL` → `EVM_APPROVED` hoặc `READY_FOR_REPAIR`

6. **Kiểm tra trong Ready for Repair:**
   - Vào **EVM Claim Management** → Tab **"Ready for Repair"**
   - ✅ Claim xuất hiện trong danh sách

**Dữ liệu test mẫu:**
```
Approval Notes: "Đồng ý phê duyệt, đủ điều kiện bảo hành"
Warranty Cost: [Tự động từ diagnostic]
Approval Reason: "Đủ điều kiện bảo hành theo chính sách"
Requires Parts Shipment: Yes
```

---

### **Bước 6: Work Done - Hoàn Thành Sửa Chữa**

**Người thực hiện:** SC Technician

**Mục đích:** Technician hoàn thành sửa chữa và cập nhật thông tin

#### Các bước:

1. **Đăng nhập với tài khoản SC Technician**

2. **Navigate đến Claim:**
   - Vào **Dashboard** → **Claim Management**
   - Tìm claim có status `READY_FOR_REPAIR` hoặc `EVM_APPROVED`
   - Click vào claim để xem chi tiết

3. **Mở Work Done Page:**
   - Từ claim detail page, click **"Work Done"** hoặc **"Hoàn Thành Sửa Chữa"**

4. **Điền thông tin Work Done:**
   - **Work Notes:** Ghi chú công việc (bắt buộc)
     - Ví dụ: "Đã thay thế pin mới, kiểm tra hệ thống sạc hoạt động bình thường"
   - **Repair Summary:** Tóm tắt sửa chữa
   - **Test Results:** Kết quả kiểm tra sau sửa chữa
   - **Parts Used:** Phụ tùng đã sử dụng
   - **Issues Encountered:** Vấn đề gặp phải (nếu có)
   - **Recommendations:** Khuyến nghị (nếu có)

5. **Submit Work Done:**
   - Click **"Submit"** hoặc **"Hoàn Thành"**
   - ✅ Thông báo: "Công việc đã được hoàn thành thành công!"
   - ✅ Claim status chuyển từ `READY_FOR_REPAIR` → `WORK_DONE` hoặc `HANDOVER_PENDING`

6. **Kiểm tra trong Claim Management:**
   - Vào **Claim Management**
   - ✅ Claim có status mới phù hợp

**Dữ liệu test mẫu:**
```
Work Notes: "Đã thay thế pin mới, kiểm tra hệ thống sạc hoạt động bình thường. Xe đã sẵn sàng bàn giao."
Repair Summary: "Thay thế pin hỏng bằng pin mới"
Test Results: "Điện áp pin: 400V, hệ thống sạc hoạt động tốt"
Parts Used: "Battery Pack - Serial: BAT-001-2024"
```

---

### **Bước 7: Claim Done - Bàn Giao Xe Cho Khách Hàng**

**Người thực hiện:** SC Staff

**Mục đích:** Hoàn tất claim và bàn giao xe cho khách hàng

#### Các bước:

1. **Đăng nhập với tài khoản SC Staff**

2. **Navigate đến Claim:**
   - Vào **Dashboard** → **Claim Management**
   - Tìm claim có status `WORK_DONE` hoặc `HANDOVER_PENDING`
   - Click vào claim để xem chi tiết

3. **Mở Claim Complete Page:**
   - Từ claim detail page, click **"Claim Done"** hoặc **"Hoàn Tất Claim"**
   - Hoặc click **"Move to Handover"** nếu status là `WORK_DONE`

4. **Điền thông tin Bàn Giao:**
   - **Handover Notes:** Ghi chú bàn giao (bắt buộc)
     - Ví dụ: "Xe đã được sửa chữa hoàn tất, khách hàng đã kiểm tra và đồng ý nhận xe"
   - **Customer Signature:** Chữ ký khách hàng (nếu có)
   - **Handover Location:** Địa điểm bàn giao
   - **Vehicle Condition Notes:** Ghi chú tình trạng xe
   - **Warranty Info Provided:** Đã cung cấp thông tin bảo hành
   - **Follow Up Required:** Cần theo dõi sau bàn giao
   - **Handover Personnel:** Người bàn giao

5. **Submit Claim Done:**
   - Click **"Submit"** hoặc **"Hoàn Tất"**
   - ✅ Thông báo: "Yêu cầu [Claim Number] đã được hoàn tất thành công!"
   - ✅ Claim status chuyển từ `WORK_DONE` → `CLAIM_DONE` hoặc `COMPLETED`

6. **Kiểm tra trong Claim Management:**
   - Vào **Claim Management** → Tab **"Completed Claims"** (nếu có)
   - ✅ Claim xuất hiện trong danh sách với status `CLAIM_DONE`

**Dữ liệu test mẫu:**
```
Handover Notes: "Xe đã được sửa chữa hoàn tất, khách hàng đã kiểm tra và đồng ý nhận xe. Pin mới đã được lắp đặt và hoạt động tốt."
Handover Location: "Service Center - Hà Nội"
Vehicle Condition Notes: "Xe trong tình trạng tốt, đã được vệ sinh và kiểm tra toàn diện"
Warranty Info Provided: Yes
Follow Up Required: No
```

---

## ✅ Checklist Test Toàn Bộ Flow

### Bước 1: Warranty Condition
- [ ] Tạo điều kiện bảo hành thành công
- [ ] Điều kiện xuất hiện trong danh sách
- [ ] Tự động chuyển sang tab "Tất cả điều kiện" sau khi tạo

### Bước 2: Create Claim
- [ ] Tạo claim draft thành công
- [ ] Claim xuất hiện trong tab "Draft Claims"
- [ ] Thông tin claim được lưu đúng

### Bước 3: Process to Intake
- [ ] Chuyển claim sang intake thành công
- [ ] Work Order được tạo
- [ ] Technician được phân công
- [ ] Claim status chuyển sang `INTAKE`

### Bước 4: Update Diagnostic
- [ ] Auto warranty check hoạt động
- [ ] Filter parts theo vehicle type hoạt động đúng
- [ ] Thêm parts thành công
- [ ] Submit diagnostic thành công
- [ ] Claim status chuyển sang `PENDING_EVM_APPROVAL`
- [ ] Reserved parts được release

### Bước 5: EVM Approval
- [ ] Claim xuất hiện trong "Pending EVM Approval"
- [ ] Approve claim thành công
- [ ] Claim status chuyển sang `READY_FOR_REPAIR` hoặc `EVM_APPROVED`

### Bước 6: Work Done
- [ ] Work done form hoạt động đúng
- [ ] Submit work done thành công
- [ ] Claim status chuyển sang `WORK_DONE` hoặc `HANDOVER_PENDING`

### Bước 7: Claim Done
- [ ] Claim complete form hoạt động đúng
- [ ] Submit claim done thành công
- [ ] Claim status chuyển sang `CLAIM_DONE` hoặc `COMPLETED`
- [ ] Luồng hoàn tất từ đầu đến cuối

---

## 🔍 Debug Tips

### 1. Kiểm tra Claim Status Flow

Mở **Console** (F12) và xem logs:
```javascript
// Sẽ thấy các status transitions:
"DRAFT" → "INTAKE" → "PENDING_EVM_APPROVAL" → "EVM_APPROVED" → "READY_FOR_REPAIR" → "WORK_DONE" → "CLAIM_DONE"
```

### 2. Kiểm tra Warranty Check

Trong **Console**, xem:
- Warranty check result
- Warranty eligibility assessment
- Warranty cost calculation

### 3. Kiểm tra Parts Filtering

Trong **Update Diagnostic Page**:
- Xem vehicle type được extract
- Xem parts được filter như thế nào
- Kiểm tra reserved parts tracking

### 4. Network Tab

Xem các API calls:
- `/api/warranty-conditions` - Tạo điều kiện bảo hành
- `/api/claims` - Tạo claim
- `/api/claims/{id}/to-intake` - Chuyển sang intake
- `/api/claims/{id}/diagnostic` - Submit diagnostic
- `/api/evm/claims/{id}/approve` - Approve claim
- `/api/claims/{id}/work-done` - Work done
- `/api/claims/{id}/claim-done` - Claim done

---

## ⚠️ Lưu Ý Quan Trọng

1. **Vehicle Type Matching:**
   - Đảm bảo vehicle type của claim khớp với vehicle type của parts
   - Parts sẽ được filter tự động theo vehicle type

2. **Warranty Check:**
   - Warranty check tự động chạy khi technician vào Update Diagnostic Page
   - Kết quả ảnh hưởng đến warranty eligibility assessment

3. **Status Flow:**
   - Đảm bảo claim status chuyển đúng theo flow
   - Mỗi bước phải hoàn thành trước khi chuyển sang bước tiếp theo

4. **Parts Reservation:**
   - Parts được reserve khi thêm vào diagnostic
   - Parts được release tự động khi submit diagnostic, xóa part, hoặc unmount component

5. **Role Permissions:**
   - Đảm bảo đúng role thực hiện đúng bước
   - EVM Staff: Tạo warranty condition, approve claims
   - SC Staff: Tạo claims, bàn giao xe
   - SC Technician: Update diagnostic, work done

---

## 🐛 Troubleshooting

### Vấn đề: Warranty check không chạy

**Giải pháp:**
1. Kiểm tra vehicle model có warranty condition chưa
2. Kiểm tra vehicle có đầy đủ thông tin (warrantyStart, warrantyEnd, mileageKm)
3. Xem Console logs để debug

### Vấn đề: Claim không chuyển status

**Giải pháp:**
1. Kiểm tra Network tab xem API calls có thành công không
2. Kiểm tra response từ API
3. Kiểm tra role permissions

### Vấn đề: Parts không được filter

**Giải pháp:**
1. Kiểm tra vehicle type có được extract đúng không
2. Kiểm tra parts có vehicleType field không
3. Xem Console logs

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Console logs
2. Network tab
3. Component state trong React DevTools
4. Backend API responses
5. Database records

Chúc test thành công! 🎉

