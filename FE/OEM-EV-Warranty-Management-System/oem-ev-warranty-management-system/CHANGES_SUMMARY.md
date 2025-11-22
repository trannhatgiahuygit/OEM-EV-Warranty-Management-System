# Tổng hợp thay đổi Frontend - Từ tối hôm qua đến nay

## 📊 Thống kê tổng quan:
- **38 files đã thay đổi**
- **+2,613 dòng thêm**
- **-1,306 dòng xóa**
- **Net: +1,307 dòng code**

---

## 🆕 Files mới tạo:

1. **`src/utils/axiosConfig.js`** - Cấu hình axios với UTF-8 encoding
2. **`src/utils/textEncoding.js`** - Utility functions cho text encoding (đã đơn giản hóa)
3. **`src/utils/validation.js`** - Validation utilities
4. **`src/components/common/`** - Common components (RequiredIndicator, etc.)
5. **`ENCODING_DEBUG_GUIDE.md`** - Hướng dẫn debug encoding issues
6. **`TESTING_GUIDE_NEW_FEATURES.md`** - Hướng dẫn test các tính năng mới

---

## 🔧 Các thay đổi chính (theo thứ tự thời gian):

### 1. **Sửa lỗi `vehicleType is not defined` trong UpdateDiagnosticPage**
**File:** `src/components/Dashboard/UpdateDiagnosticPage/UpdateDiagnosticPage.js`
- Thêm state: `const [vehicleType, setVehicleType] = useState(null);`
- State này được extract từ claim.vehicle khi fetch claim data
- Sử dụng để filter parts theo vehicleType

### 2. **Sửa lỗi font tiếng Việt (Encoding Issues)**
**Files:**
- `src/utils/axiosConfig.js` (mới) - Cấu hình axios với UTF-8
- `src/utils/textEncoding.js` (mới) - Utility functions (đã đơn giản hóa)
- `public/index.html` - Thêm meta tags UTF-8, đổi lang="vi"
- `src/index.css` - Thêm fonts 'Noto Sans', 'Noto Sans Vietnamese'
- `src/index.js` - Import axiosConfig
- `src/components/Dashboard/VehicleManagementPage/AllVehiclesList.js` - Thêm logging và response encoding config

**Thay đổi:**
- Cấu hình axios để tất cả requests có `charset=utf-8`
- Thêm response interceptor để xử lý UTF-8
- Thêm fonts hỗ trợ tiếng Việt
- Thêm logging để debug encoding issues

### 3. **Sửa lỗi validation `coverageYears.trim is not a function`**
**File:** `src/components/Dashboard/WarrantyConditionManagementPage/WarrantyConditionManagementPage.js`
- Sửa validation để xử lý cả string và number types
- Kiểm tra type trước khi gọi `.trim()`

### 4. **Thêm validation Part Type phải khớp với Vehicle Type**
**File:** `src/components/Dashboard/VehicleManagementPage/AddNewVehicle.js`
- Import `normalizeVehicleTypeForAPI`
- Cập nhật `performPartSearch()` để filter parts theo vehicleType
- Thêm validation trong `handlePartSelect()` để check part.vehicleType
- Cải thiện error message khi submit

### 5. **Xóa hai cột "Hiệu lực từ" và "Hiệu lực đến"**
**File:** `src/components/Dashboard/WarrantyConditionManagementPage/WarrantyConditionManagementPage.js`
- Xóa `<th>Hiệu lực từ</th>` và `<th>Hiệu lực đến</th>`
- Xóa hai `<td>` tương ứng

### 6. **Tự động quay lại danh sách sau khi submit**
**File:** `src/components/Dashboard/WarrantyConditionManagementPage/WarrantyConditionManagementPage.js`
- Cập nhật `handleCreateCondition()`: Auto switch to "all-conditions" tab
- Cập nhật `handleUpdateCondition()`: Auto switch to "all-conditions" tab
- Fetch lại dữ liệu sau khi submit thành công

### 7. **Auto-release reserved parts sau timeout**
**File:** `src/components/Dashboard/UpdateDiagnosticPage/UpdateDiagnosticPage.js`
- `AUTO_RELEASE_TIMEOUT = 30 * 60 * 1000` (30 phút)
- Auto-release reserved parts nếu diagnosis không được gửi trong 30 phút
- Release parts khi technician xóa part khỏi danh sách
- Release tất cả parts khi submit diagnosis thành công
- Release tất cả parts khi component unmount

---

## 📝 Files đã thay đổi (chi tiết):

### Core/Utils:
- `src/index.js` - Import axiosConfig
- `src/index.css` - Thêm fonts tiếng Việt
- `src/utils/axiosConfig.js` (mới)
- `src/utils/textEncoding.js` (mới)
- `src/utils/validation.js` (mới)
- `src/utils/vehicleClassification.js` - Thêm functions mới

### Components - UpdateDiagnosticPage:
- `src/components/Dashboard/UpdateDiagnosticPage/UpdateDiagnosticPage.js` - Fix vehicleType, auto-release parts
- `src/components/Dashboard/UpdateDiagnosticPage/UpdateDiagnosticPage.css`

### Components - Vehicle Management:
- `src/components/Dashboard/VehicleManagementPage/AddNewVehicle.js` - Part type validation
- `src/components/Dashboard/VehicleManagementPage/AddNewVehicle.css`
- `src/components/Dashboard/VehicleManagementPage/AllVehiclesList.js` - Encoding config, logging
- `src/components/Dashboard/VehicleManagementPage/SearchVehicleByVin.js` - Xóa decodeVietnameseText
- `src/components/Dashboard/VehicleManagementPage/SearchVehicleByCustomerId.js`
- `src/components/Dashboard/VehicleManagementPage/VehicleDetailWithSerial.js` - Xóa decodeVietnameseText
- `src/components/Dashboard/VehicleManagementPage/VehicleManagementPage.css`

### Components - Warranty Condition:
- `src/components/Dashboard/WarrantyConditionManagementPage/WarrantyConditionManagementPage.js` - Fix validation, xóa cột, auto-back

### Components - Other:
- `src/components/Dashboard/NewRepairClaimPage/NewRepairClaimPage.js` - Fix 401/400 errors
- `src/components/Dashboard/NewRepairClaimPage/NewRepairClaimPage.css`
- `src/components/Dashboard/ClaimCancelRequest/*` - Multiple files
- `src/components/Dashboard/ClaimManagementPage/ClaimManagementPage.css`
- `src/components/Dashboard/CustomerPage/CustomerPage.js`
- `src/components/Dashboard/EVMClaimActionModal/*`
- `src/components/Dashboard/EVMPartInventoryPage/*`
- `src/components/Dashboard/EVMRecallManagementPage/*`
- `src/components/Dashboard/SerialPartsAssignment/*`
- `src/components/Dashboard/ServiceCenterManagementPage/ServiceCenterManagementPage.js`
- `src/components/Dashboard/ThirdPartyPartManagementPage/*`
- `src/components/Dashboard/UserManagementPage/UserManagementPage.js`
- `src/components/Login/Login.js` & `Login.css`
- `src/components/ProfilePage/ProfilePage.js`
- `src/components/VehicleListModal/VehicleListModal.js`

### Services:
- `src/services/serialPartsService.js`

### Public:
- `public/index.html` - UTF-8 encoding

### Deleted:
- `TASK2_USER_GUIDE.md`

---

## 🎯 Các tính năng mới:

1. **Auto-release reserved parts**: Tự động giải phóng parts sau 30 phút nếu diagnosis chưa được gửi
2. **Part type validation**: Validate part type phải khớp với vehicle type
3. **Encoding support**: Cấu hình UTF-8 đầy đủ cho tiếng Việt
4. **Auto-back after submit**: Tự động quay lại danh sách sau khi submit form

---

## 🐛 Bugs đã fix:

1. ✅ `vehicleType is not defined` trong UpdateDiagnosticPage
2. ✅ `coverageYears.trim is not a function` trong WarrantyConditionManagementPage
3. ✅ Font tiếng Việt bị lỗi (encoding issues)
4. ✅ Part type không khớp với vehicle type (400 error)
5. ✅ 401/400 errors khi chuyển claim từ draft sang intake

---

## 📋 Commit message gợi ý:

```
fix: Sửa các lỗi runtime, validation và cải thiện UX

- Fix lỗi vehicleType is not defined trong UpdateDiagnosticPage
- Fix lỗi coverageYears.trim is not a function trong WarrantyConditionManagementPage
- Thêm validation part type phải khớp với vehicle type trong AddNewVehicle
- Cấu hình UTF-8 encoding cho axios và HTML để xử lý tiếng Việt
- Xóa hai cột "Hiệu lực từ" và "Hiệu lực đến" khỏi bảng điều kiện bảo hành
- Tự động quay lại danh sách sau khi submit form thành công
- Thêm auto-release reserved parts sau 30 phút nếu diagnosis chưa được gửi
- Release reserved parts khi xóa part hoặc submit diagnosis thành công
- Fix 401/400 errors khi chuyển claim từ draft sang intake
- Thêm axiosConfig và textEncoding utils
- Thêm ENCODING_DEBUG_GUIDE.md
```

