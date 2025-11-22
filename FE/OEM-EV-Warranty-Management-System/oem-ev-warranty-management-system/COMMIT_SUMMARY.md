# Tổng Hợp Thay Đổi

## Thống Kê
- 38+ files đã thay đổi
- 7 files mới được tạo
- 1 file đã xóa

---

## Tính Năng Mới

### 1. Filter Linh Kiện Theo Loại Xe
- Tự động filter EVM parts và Third-party parts theo vehicle type của claim
- Validation khi chọn part không phù hợp
- Áp dụng cho UpdateDiagnosticPage và AddNewVehicle

### 2. Auto-Release Reserved Parts
- Tự động giải phóng reserved parts sau 30 phút nếu chưa submit
- Auto-release khi xóa part, submit thành công, hoặc rời khỏi page
- Tránh deadlock và tối ưu resource management

### 3. Design Compliance
- Loại bỏ hover effects di chuyển components
- Sử dụng theme variables thay vì hardcoded colors
- Đồng nhất design language across all pages

### 4. Encoding Support
- Cấu hình UTF-8 cho axios và HTML
- Thêm fonts hỗ trợ tiếng Việt (Noto Sans)
- Fix lỗi hiển thị font tiếng Việt

### 5. Validation & UX Improvements
- Fix validation errors (coverageYears.trim, vehicleType)
- Tự động quay lại danh sách sau khi submit
- Cải thiện error messages và logging

---

## Bugs Đã Fix

- ✅ `vehicleType is not defined` trong UpdateDiagnosticPage
- ✅ `coverageYears.trim is not a function` trong WarrantyConditionManagementPage
- ✅ Font tiếng Việt bị lỗi encoding
- ✅ Part type không khớp với vehicle type (400 error)
- ✅ 401/400 errors khi chuyển claim từ draft sang intake
- ✅ Reserved parts không được release (deadlock)

---

## Files Mới

- `src/utils/axiosConfig.js` - Axios UTF-8 configuration
- `src/utils/textEncoding.js` - Text encoding utilities
- `src/utils/validation.js` - Validation utilities
- `src/components/common/` - Common components
- `TESTING_GUIDE_NEW_FEATURES.md` - Testing guide
- `CHANGES_SUMMARY.md` - Detailed changes
- `ENCODING_DEBUG_GUIDE.md` - Encoding debug guide

