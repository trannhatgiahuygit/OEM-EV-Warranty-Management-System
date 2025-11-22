# Hướng Dẫn Test Luồng Kiểm Tra Bảo Hành Tự Động Cho Technician

## Tổng Quan

Khi technician (SC_TECHNICIAN) vào trang chi tiết yêu cầu sửa chữa (UpdateDiagnosticPage) với luồng **EVM Repair**, hệ thống sẽ tự động kiểm tra điều kiện bảo hành dựa trên thông tin xe và trả về kết quả (PASS/FAIL/NO_CONSTRAINTS) cùng với lý do.

## Dữ Liệu Test Cần Chuẩn Bị

### 1. Vehicle Model và Warranty Condition
- Tạo một hoặc nhiều **Vehicle Model** trong hệ thống (qua EVM Staff)
- Tạo **Warranty Condition** cho từng model với các điều kiện khác nhau:
  - **Test Case 1**: Bảo hành bình thường (có thời hạn)
    - `coverageKm`: 100,000 km
    - `coverageYears`: 5 năm
    - `effectiveFrom`: 01/01/2020
    - `effectiveTo`: 31/12/2025
  - **Test Case 2**: Bảo hành trọn đời (lifetime)
    - `coverageKm`: 150,000 km
    - `coverageYears`: null
    - `effectiveFrom`: 01/01/2020
    - `effectiveTo`: null
  - **Test Case 3**: Bảo hành hết hạn
    - `coverageKm`: 80,000 km
    - `coverageYears`: 3 năm
    - `effectiveFrom`: 01/01/2020
    - `effectiveTo`: 31/12/2023 (đã qua)

### 2. Vehicle Test Data
Tạo các vehicle với thông tin khác nhau để test các trường hợp:

#### **Vehicle 1: PASS - Đủ điều kiện bảo hành**
- `vehicleModelId`: ID của model có bảo hành bình thường
- `warrantyStart`: 01/06/2023 (trong thời hạn hiệu lực)
- `warrantyEnd`: 01/06/2028 (trong thời hạn hiệu lực)
- `mileageKm`: 25,000 (dưới giới hạn 100,000 km)

#### **Vehicle 2: FAIL - Vượt quá số km**
- `vehicleModelId`: ID của model có bảo hành bình thường
- `warrantyStart`: 01/06/2023
- `warrantyEnd`: 01/06/2028
- `mileageKm`: 120,000 (vượt quá 100,000 km)

#### **Vehicle 3: FAIL - Bảo hành hết hạn**
- `vehicleModelId`: ID của model có bảo hành bình thường
- `warrantyStart`: 01/06/2020
- `warrantyEnd`: 01/06/2023 (đã qua)
- `mileageKm`: 50,000

#### **Vehicle 4: FAIL - Bảo hành chưa có hiệu lực**
- `vehicleModelId`: ID của model có bảo hành bình thường
- `warrantyStart`: 01/01/2026 (tương lai)
- `warrantyEnd`: 01/01/2031
- `mileageKm`: 5,000

#### **Vehicle 5: PASS - Bảo hành trọn đời**
- `vehicleModelId`: ID của model có bảo hành trọn đời
- `warrantyStart`: 01/06/2023
- `warrantyEnd`: null (trọn đời)
- `mileageKm`: 80,000 (dưới 150,000 km)

#### **Vehicle 6: FAIL - Thiếu thông tin**
- `vehicleModelId`: ID của model có bảo hành bình thường
- `warrantyStart`: null
- `warrantyEnd`: null
- `mileageKm`: 30,000

#### **Vehicle 7: NO_CONSTRAINTS - Không có model ID**
- `vehicleModelId`: null
- `warrantyStart`: 01/06/2023
- `warrantyEnd`: 01/06/2028
- `mileageKm`: 30,000

### 3. Claim Test Data
Tạo các claim với các vehicle trên:
- Mỗi claim cần có `repairType = 'EVM_REPAIR'` để trigger warranty check
- Claim phải ở trạng thái cho phép technician cập nhật diagnostic

---

## Các Test Case Chi Tiết

### **TEST CASE 1: Kiểm tra PASS - Đủ điều kiện bảo hành**

**Mục tiêu**: Xác minh hệ thống tự động phát hiện xe đủ điều kiện bảo hành.

**Các bước**:
1. Đăng nhập với tài khoản **SC_TECHNICIAN**
2. Vào trang **Chi tiết Yêu cầu** của claim có Vehicle 1 (PASS)
3. Chọn tab **EVM Repair** (nếu có)
4. Quan sát phần **"Kiểm tra Điều kiện Bảo hành Xe"**

**Kết quả mong đợi**:
- ✅ Hiển thị **"Đang kiểm tra..."** khi đang load
- ✅ Sau khi check xong, hiển thị **"✅ Đủ điều kiện bảo hành"** (màu xanh)
- ✅ Hiển thị các lý do:
  - Ngày bắt đầu bảo hành: 01/06/2023
  - Bảo hành còn hiệu lực đến 01/06/2028
  - Số km trong giới hạn: 25,000 km ≤ 100,000 km
  - Thời hạn bảo hành: 5 năm
- ✅ Các trường **"Điều kiện bảo hành được chấp nhận"**, **"Xe có đủ điều kiện bảo hành?"** được tự động điền
- ✅ Tất cả các input field trong form đều **KHÔNG bị disable** (có thể nhập bình thường)
- ✅ Nút **Submit** **KHÔNG bị disable**
- ✅ **KHÔNG hiển thị** checkbox override

---

### **TEST CASE 2: Kiểm tra FAIL - Vượt quá số km**

**Mục tiêu**: Xác minh hệ thống phát hiện xe vượt quá giới hạn số km và disable form.

**Các bước**:
1. Đăng nhập với tài khoản **SC_TECHNICIAN**
2. Vào trang **Chi tiết Yêu cầu** của claim có Vehicle 2 (vượt quá số km)
3. Quan sát phần **"Kiểm tra Điều kiện Bảo hành Xe"**

**Kết quả mong đợi**:
- ✅ Hiển thị **"Đang kiểm tra..."** khi đang load
- ✅ Sau khi check xong, hiển thị **"❌ Không đủ điều kiện bảo hành"** (màu đỏ)
- ✅ Hiển thị lý do:
  - `Số km (120,000 km) vượt quá giới hạn bảo hành (100,000 km)`
- ✅ Tất cả các input field trong form đều **BỊ DISABLE** (màu xám, không thể nhập):
  - Reported Failure
  - Diagnostic Summary
  - Initial Diagnosis
  - Test Results
  - Repair Notes
  - Diagnostic Details
  - Media Attachments (nút upload bị disable)
  - Service Catalog (tất cả input bị disable)
  - Required Parts (tất cả input bị disable)
  - Điều kiện bảo hành được chấp nhận
  - Xe có đủ điều kiện bảo hành?
  - Ghi chú bảo hành
  - Labor Hours
  - Ready For Submission checkbox
- ✅ Nút **Submit** **BỊ DISABLE**
- ✅ Hiển thị checkbox override ở cuối form:
  - `Bạn có chắc chắn những thông tin trên xe đáp ứng đầy đủ các điều kiện bảo hành của hãng đối với mẫu xe cho tới thời điểm hiện tại và đồng ý lưu thông tin? *`
  - Checkbox **KHÔNG bị disable** (vẫn có thể check)

---

### **TEST CASE 3: Kiểm tra FAIL - Bảo hành hết hạn**

**Các bước**: Tương tự TEST CASE 2, nhưng với Vehicle 3

**Kết quả mong đợi**:
- ✅ Hiển thị **"❌ Không đủ điều kiện bảo hành"**
- ✅ Lý do: `Bảo hành đã hết hạn vào 01/06/2023`
- ✅ Tất cả input field bị disable
- ✅ Hiển thị checkbox override

---

### **TEST CASE 4: Kiểm tra FAIL - Bảo hành chưa có hiệu lực**

**Các bước**: Tương tự TEST CASE 2, nhưng với Vehicle 4

**Kết quả mong đợi**:
- ✅ Hiển thị **"❌ Không đủ điều kiện bảo hành"**
- ✅ Lý do: `Bảo hành chưa có hiệu lực. Ngày bắt đầu: 01/01/2026`
- ✅ Tất cả input field bị disable
- ✅ Hiển thị checkbox override

---

### **TEST CASE 5: Kiểm tra PASS - Bảo hành trọn đời**

**Các bước**: Tương tự TEST CASE 1, nhưng với Vehicle 5

**Kết quả mong đợi**:
- ✅ Hiển thị **"✅ Đủ điều kiện bảo hành"**
- ✅ Lý do:
  - `Bảo hành trọn đời (không có thời hạn)`
  - `Số km trong giới hạn: 80,000 km ≤ 150,000 km`
- ✅ Tất cả input field không bị disable
- ✅ Không hiển thị checkbox override

---

### **TEST CASE 6: Kiểm tra FAIL - Thiếu thông tin**

**Các bước**: Tương tự TEST CASE 2, nhưng với Vehicle 6

**Kết quả mong đợi**:
- ✅ Hiển thị **"❌ Không đủ điều kiện bảo hành"**
- ✅ Lý do: `Thiếu ngày bắt đầu bảo hành` và/hoặc `Thiếu ngày kết thúc bảo hành`
- ✅ Tất cả input field bị disable
- ✅ Hiển thị checkbox override

---

### **TEST CASE 7: Kiểm tra NO_CONSTRAINTS - Không có model ID**

**Các bước**: Tương tự TEST CASE 1, nhưng với Vehicle 7

**Kết quả mong đợi**:
- ✅ Hiển thị **"⚠️ Không có điều kiện bảo hành"** (màu vàng)
- ✅ Lý do: `Không tìm thấy thông tin mẫu xe. Vui lòng nhập thủ công.`
- ✅ Tất cả input field **KHÔNG bị disable** (cho phép nhập thủ công)
- ✅ Không hiển thị checkbox override

---

### **TEST CASE 8: Kiểm tra Override Functionality**

**Mục tiêu**: Xác minh technician có thể override khi check fail.

**Các bước**:
1. Thực hiện TEST CASE 2 hoặc 3 (một trong các trường hợp FAIL)
2. Sau khi thấy form bị disable và checkbox override xuất hiện
3. Click vào checkbox override
4. Quan sát form

**Kết quả mong đợi**:
- ✅ Sau khi check checkbox override:
  - Tất cả input field **ĐƯỢC ENABLE** trở lại (có thể nhập bình thường)
  - Nút **Submit** **ĐƯỢC ENABLE** trở lại
  - Checkbox override vẫn hiển thị và vẫn checked
- ✅ Technician có thể nhập tất cả thông tin bình thường
- ✅ Có thể submit form khi đã check override checkbox

---

### **TEST CASE 9: Kiểm tra Submit với Override**

**Mục tiêu**: Xác minh form có thể submit khi đã check override checkbox.

**Các bước**:
1. Thực hiện TEST CASE 8 (đã check override checkbox)
2. Nhập đầy đủ thông tin vào form
3. Check checkbox **"Ready For Submission"** (nếu có)
4. Click nút **Submit**

**Kết quả mong đợi**:
- ✅ Form submit thành công
- ✅ Dữ liệu được lưu với `warrantyOverrideConfirmed: true`
- ✅ Backend chấp nhận request (không reject dù warranty check fail)

---

### **TEST CASE 10: Kiểm tra Submit KHÔNG có Override (nên fail)**

**Mục tiêu**: Xác minh form KHÔNG thể submit nếu chưa check override khi warranty check fail.

**Các bước**:
1. Thực hiện TEST CASE 2 hoặc 3 (warranty check FAIL)
2. **KHÔNG check** checkbox override
3. Cố gắng submit form (có thể dùng dev tools để enable submit button)

**Kết quả mong đợi**:
- ✅ Nếu click submit (bằng cách nào đó), hiển thị error toast:
  - `Vui lòng xác nhận rằng xe đáp ứng đầy đủ các điều kiện bảo hành bằng cách chọn checkbox xác nhận.`
- ✅ Form không được submit

---

### **TEST CASE 11: Kiểm tra SC_REPAIR không trigger warranty check**

**Mục tiêu**: Xác minh warranty check chỉ chạy cho EVM_REPAIR, không chạy cho SC_REPAIR.

**Các bước**:
1. Đăng nhập với tài khoản **SC_TECHNICIAN**
2. Vào trang **Chi tiết Yêu cầu** của claim có `repairType = 'SC_REPAIR'`
3. Quan sát phần **"Kiểm tra Điều kiện Bảo hành Xe"**

**Kết quả mong đợi**:
- ✅ **KHÔNG hiển thị** trạng thái "Đang kiểm tra..."
- ✅ **KHÔNG hiển thị** kết quả warranty check (pass/fail/no_constraints)
- ✅ Tất cả input field **KHÔNG bị disable**
- ✅ **KHÔNG hiển thị** checkbox override
- ✅ Form hoạt động bình thường như trước

---

## Checklist Test Tổng Quan

### ✅ Functional Testing
- [ ] Test PASS case - đủ điều kiện bảo hành
- [ ] Test FAIL case - vượt quá số km
- [ ] Test FAIL case - bảo hành hết hạn
- [ ] Test FAIL case - bảo hành chưa có hiệu lực
- [ ] Test PASS case - bảo hành trọn đời
- [ ] Test FAIL case - thiếu thông tin
- [ ] Test NO_CONSTRAINTS case - không có model ID
- [ ] Test override functionality - enable form khi check override
- [ ] Test submit với override - form submit thành công
- [ ] Test submit không có override - form không submit
- [ ] Test SC_REPAIR - không trigger warranty check

### ✅ UI/UX Testing
- [ ] Loading state hiển thị đúng khi đang check
- [ ] Kết quả hiển thị rõ ràng với màu sắc phù hợp (xanh/đỏ/vàng)
- [ ] Lý do hiển thị đầy đủ và dễ đọc
- [ ] Disabled state rõ ràng (màu xám, cursor not-allowed)
- [ ] Overlay che phủ form khi disabled (không thể click vào input)
- [ ] Checkbox override luôn có thể tương tác (không bị disable)
- [ ] Responsive trên mobile/tablet

### ✅ Edge Cases
- [ ] Vehicle không có vehicleModelId
- [ ] Warranty condition không tồn tại cho model
- [ ] Warranty condition có effectiveTo = null (trọn đời)
- [ ] Warranty start/end = null
- [ ] Mileage = null hoặc 0
- [ ] API error khi fetch warranty conditions
- [ ] Network timeout khi check warranty

---

## Debugging Tips

### 1. Kiểm tra Console Logs
Mở Developer Tools (F12) và xem Console để kiểm tra:
- Các API calls đến `/api/warranty-conditions/effective`
- Warranty check logic trong `performWarrantyCheck`
- State updates: `warrantyCheckResult`, `warrantyCheckReasons`

### 2. Kiểm tra Network Requests
Trong tab Network của Developer Tools:
- Xem request `GET /api/warranty-conditions/effective?modelId=...`
- Kiểm tra response có đúng format không
- Kiểm tra status code (200, 404, 500, etc.)

### 3. Kiểm tra State trong React DevTools
Nếu có React DevTools:
- Xem state `warrantyCheckResult` (null, 'checking', 'pass', 'fail', 'no_constraints')
- Xem state `warrantyCheckReasons` (array of strings)
- Xem state `warrantyOverrideConfirmed` (boolean)

### 4. Test với Different Data
- Thay đổi `warrantyStart`, `warrantyEnd`, `mileageKm` của vehicle trong database
- Thay đổi `coverageKm`, `coverageYears`, `effectiveFrom`, `effectiveTo` của warranty condition
- Refresh trang để trigger warranty check lại

---

## Lưu Ý Quan Trọng

1. **Warranty check chỉ chạy cho `repairType = 'EVM_REPAIR'`**, không chạy cho `SC_REPAIR`
2. **Warranty check chạy tự động** khi component mount và `claim` data đã được load
3. **Checkbox override chỉ hiển thị** khi `warrantyCheckResult === 'fail'` và `repairType === 'EVM_REPAIR'`
4. **Backend luôn linh hoạt**: Dù warranty check fail, backend vẫn cho phép submit nếu `warrantyOverrideConfirmed = true`
5. **Auto-populate**: Khi check PASS, các field `warrantyEligibilityAssessment` và `isWarrantyEligible` được tự động điền
6. **Reset override**: Khi warranty check fail mới, `warrantyOverrideConfirmed` được reset về `false`

---

## Báo Cáo Bug

Nếu phát hiện bug, vui lòng ghi lại:
1. **Test case nào** bị lỗi
2. **Các bước để reproduce** bug
3. **Kết quả mong đợi** vs **Kết quả thực tế**
4. **Console logs** và **Network requests** (nếu có)
5. **Screenshot** (nếu có)
6. **Browser và version** (Chrome, Firefox, Safari, etc.)

---

**Chúc bạn test thành công! 🚀**

