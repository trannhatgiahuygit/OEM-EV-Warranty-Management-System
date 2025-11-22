# Hướng Dẫn Test Các Tính Năng Mới

## 📋 Tổng Quan

Hướng dẫn này mô tả cách test các tính năng mới đã được implement:
1. **Filter linh kiện theo loại xe** trong UpdateDiagnosticPage
2. **Auto-release mechanism** cho reserved parts
3. **Design compliance** updates

---

## 🚀 Cách Chạy Project

### 1. Khởi động Development Server

```bash
cd oem-ev-warranty-management-system
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

### 2. Đăng nhập

- Đăng nhập với tài khoản **Technician** hoặc **Service Center** để test các tính năng mới

---

## 🧪 Test Case 1: Filter Linh Kiện Theo Loại Xe

### Mục đích
Kiểm tra xem khi technician nhập linh kiện thay thế, chỉ hiển thị linh kiện phù hợp với loại xe đã khai báo trong claim.

### Các bước test:

#### **A. Test EVM Repair Flow (EVM Parts)**

1. **Tạo/Navigate đến một Claim:**
   - Vào **Dashboard** → **Claim Management**
   - Chọn một claim có vehicle type rõ ràng (ví dụ: Ô tô điện, Xe máy điện)
   - Click vào claim để xem chi tiết

2. **Mở Update Diagnostic Page:**
   - Từ claim detail page, click **"Update Diagnostic"** hoặc **"Cập nhật Chẩn đoán"**
   - Đảm bảo repair type là **"EVM_REPAIR"**

3. **Kiểm tra Vehicle Type:**
   - Xác nhận vehicle type của claim (ví dụ: "Ô tô điện" = CAR)
   - Vehicle type sẽ được extract tự động từ `claim.vehicle`

4. **Test Search EVM Parts:**
   - Trong phần **"Required Parts"**, nhập tên hoặc mã linh kiện vào search box
   - **Kết quả mong đợi:**
     - Chỉ hiển thị EVM parts có `vehicleType` phù hợp với vehicle type của claim
     - Nếu part có `vehicleType` khác, sẽ không xuất hiện trong kết quả search
   - Ví dụ:
     - Claim vehicle: "Ô tô điện" (CAR)
     - Search "battery" → Chỉ hiển thị battery parts có `vehicleType = CAR`
     - Parts có `vehicleType = MOTORCYCLE` sẽ không hiển thị

5. **Test Validation khi chọn Part:**
   - Thử chọn một part không phù hợp (nếu có thể)
   - **Kết quả mong đợi:**
     - Hiển thị error message: "Linh kiện này không phù hợp với loại xe đã khai báo..."
     - Part không được thêm vào danh sách

#### **B. Test SC Repair Flow (Third-Party Parts)**

1. **Tạo/Navigate đến một Claim:**
   - Chọn một claim có repair type là **"SC_REPAIR"**
   - Hoặc tạo claim mới với repair type = SC_REPAIR

2. **Mở Update Diagnostic Page:**
   - Click **"Update Diagnostic"**
   - Đảm bảo repair type hiển thị là **"SC_REPAIR"**

3. **Test Search Third-Party Parts:**
   - Trong phần **"Third-Party Parts"**, nhập tên hoặc mã linh kiện
   - **Kết quả mong đợi:**
     - Chỉ hiển thị third-party parts có `vehicleType` phù hợp với vehicle type của claim
     - Parts không phù hợp sẽ bị filter ra

4. **Test Validation khi thêm Part:**
   - Thử thêm một third-party part không phù hợp
   - **Kết quả mong đợi:**
     - Hiển thị error message
     - Part không được thêm vào

---

## 🧪 Test Case 2: Auto-Release Mechanism

### Mục đích
Kiểm tra xem reserved parts có được tự động release khi:
- Technician xóa part
- Component unmount (user rời khỏi page)
- Timeout 30 phút nếu diagnosis chưa được submit

### Các bước test:

#### **A. Test Manual Release (Xóa Part)**

1. **Thêm Part vào Diagnosis:**
   - Mở Update Diagnostic Page
   - Thêm một EVM part hoặc third-party part
   - Part sẽ được reserve tự động

2. **Kiểm tra Reserved Status:**
   - Mở **Network tab** trong DevTools (F12)
   - Xem request `/api/third-party-parts/serials/reserve` (cho third-party parts)
   - Xác nhận part đã được reserve

3. **Xóa Part:**
   - Click nút **"Xóa"** hoặc **"Remove"** bên cạnh part
   - **Kết quả mong đợi:**
     - Part được xóa khỏi danh sách
     - Request `/api/third-party-parts/serials/release/{claimId}/{thirdPartyPartId}` được gửi
     - Reserved serials được release

#### **B. Test Auto-Release on Unmount**

1. **Thêm Part và Reserve:**
   - Thêm một part vào diagnosis
   - Part được reserve

2. **Rời khỏi Page:**
   - Click **"Back"** hoặc navigate đến page khác
   - **Kết quả mong đợi:**
     - Component unmount
     - Cleanup function chạy
     - Tất cả reserved parts được release
     - Request release được gửi cho mỗi reserved part

3. **Kiểm tra trong Network Tab:**
   - Xem các request release được gửi khi component unmount

#### **C. Test Auto-Release Timeout (30 phút)**

1. **Thêm Part và Reserve:**
   - Thêm một part vào diagnosis
   - Part được reserve và schedule auto-release sau 30 phút

2. **Chờ 30 phút (hoặc test với shorter timeout trong code):**
   - **Lưu ý:** Để test nhanh, có thể tạm thời thay đổi timeout từ 30 phút (1800000ms) xuống 1 phút (60000ms) trong code
   - Sau khi timeout, **không submit diagnosis**
   - **Kết quả mong đợi:**
     - Auto-release timer chạy
     - Reserved parts được release tự động
     - Request release được gửi

3. **Submit Diagnosis trước Timeout:**
   - Thêm part và reserve
   - Submit diagnosis **trước** khi timeout
   - **Kết quả mong đợi:**
     - Khi submit thành công, tất cả reserved parts được release
     - Auto-release timer được clear
     - Request release được gửi

---

## 🧪 Test Case 3: Design Compliance

### Mục đích
Kiểm tra xem tất cả components đã tuân thủ design guidelines:
- Không có hover effects di chuyển component
- Màu sắc đơn giản, professional
- Sử dụng theme variables

### Các bước test:

1. **Kiểm tra Hover Effects:**
   - Hover vào các buttons, cards, badges trong:
     - VehicleManagementPage
     - ClaimManagementPage
     - EVMRecallManagementPage
     - ThirdPartyPartManagementPage
     - EVMPartInventoryPage
     - UpdateDiagnosticPage
   - **Kết quả mong đợi:**
     - Components **KHÔNG** di chuyển khi hover
     - Chỉ có thay đổi màu/background
     - Có thể có subtle box-shadow nhưng không có transform

2. **Kiểm tra Color Usage:**
   - Xem các status badges, buttons, error messages
   - **Kết quả mong đợi:**
     - Không có hardcoded colors như `#ff4444`, `#34c759`
     - Sử dụng CSS variables: `var(--text-primary)`, `var(--error)`, etc.
     - Màu sắc subtle, professional

3. **Kiểm tra Theme Consistency:**
   - Navigate qua các pages khác nhau
   - **Kết quả mong đợi:**
     - Tất cả components có cùng design language
     - Consistent spacing, typography, colors

---

## 🔍 Debug Tips

### 1. Kiểm tra Vehicle Type Extraction

Mở **Console** (F12) và xem logs:
```javascript
// Sẽ thấy log khi claim được load:
"UpdateDiagnosticPage - Vehicle type extracted: CAR"
```

### 2. Kiểm tra Part Filtering

Trong **Console**, có thể log để xem:
- `vehicleType` được extract
- Parts được filter như thế nào
- Normalized vehicle types

### 3. Kiểm tra Reserved Parts

Trong **Console**, xem:
- `reservedPartsRef.current` để xem các parts đang được reserve
- Timers đang chạy
- Auto-release schedules

### 4. Network Tab

Xem các API calls:
- `/api/part-serials` - Fetch EVM parts
- `/api/third-party-parts/service-center/{id}` - Fetch third-party parts
- `/api/third-party-parts/serials/reserve` - Reserve parts
- `/api/third-party-parts/serials/release/{claimId}/{partId}` - Release parts

---

## ⚠️ Lưu Ý Quan Trọng

1. **Vehicle Type Mapping:**
   - Frontend vehicle types (e.g., `electric_car`) được map sang backend types (e.g., `CAR`)
   - Mapping được handle bởi `normalizeVehicleTypeForAPI()`

2. **EVM Parts vs Third-Party Parts:**
   - **EVM Parts:** Sử dụng `/api/part-serials` endpoint
   - **Third-Party Parts:** Sử dụng `/api/third-party-parts/service-center/{id}` endpoint
   - Cả hai đều được filter theo `vehicleType`

3. **Auto-Release Timeout:**
   - Mặc định là **30 phút** (1800000ms)
   - Có thể tạm thời giảm để test nhanh hơn

4. **Reserved Parts Tracking:**
   - EVM parts: Hiện tại chỉ schedule auto-release (chưa có API reserve/release)
   - Third-party parts: Có đầy đủ API reserve/release

---

## 📝 Checklist Test

- [ ] EVM parts được filter đúng theo vehicle type
- [ ] Third-party parts được filter đúng theo vehicle type
- [ ] Error message hiển thị khi chọn part không phù hợp
- [ ] Reserved parts được release khi xóa part
- [ ] Reserved parts được release khi unmount component
- [ ] Reserved parts được release khi submit diagnosis
- [ ] Auto-release timeout hoạt động đúng (nếu test được)
- [ ] Không có hover effects di chuyển component
- [ ] Màu sắc sử dụng theme variables
- [ ] Design consistent across all pages

---

## 🐛 Troubleshooting

### Vấn đề: Parts không được filter theo vehicle type

**Giải pháp:**
1. Kiểm tra `vehicleType` có được extract đúng không (xem Console logs)
2. Kiểm tra `claim.vehicle` có đầy đủ thông tin không
3. Kiểm tra `normalizeVehicleTypeForAPI()` có hoạt động đúng không

### Vấn đề: Reserved parts không được release

**Giải pháp:**
1. Kiểm tra Network tab xem API calls có được gửi không
2. Kiểm tra `reservedPartsRef.current` trong Console
3. Kiểm tra cleanup function có được gọi không

### Vấn đề: Hover effects vẫn di chuyển component

**Giải pháp:**
1. Clear browser cache
2. Restart dev server
3. Kiểm tra CSS file đã được update chưa

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Console logs
2. Network tab
3. Component state trong React DevTools
4. CSS đã được apply đúng chưa

Chúc test thành công! 🎉

