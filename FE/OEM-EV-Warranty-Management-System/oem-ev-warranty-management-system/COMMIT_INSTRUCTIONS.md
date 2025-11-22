# Hướng dẫn Commit các thay đổi

## Cách 1: Sử dụng script tự động (Khuyến nghị)

### Windows:
```bash
# Chạy file batch
commit-changes.bat
```

### Linux/Mac:
```bash
# Cấp quyền thực thi
chmod +x commit-changes.sh

# Chạy script
./commit-changes.sh
```

## Cách 2: Commit thủ công

### Bước 1: Add các files mới
```bash
git add src/utils/axiosConfig.js
git add src/utils/textEncoding.js
git add src/utils/validation.js
git add src/components/common/
git add ENCODING_DEBUG_GUIDE.md
git add TESTING_GUIDE_NEW_FEATURES.md
git add CHANGES_SUMMARY.md
```

### Bước 2: Add các files đã sửa (chính)
```bash
git add public/index.html
git add src/index.css
git add src/index.js
git add src/components/Dashboard/UpdateDiagnosticPage/UpdateDiagnosticPage.js
git add src/components/Dashboard/VehicleManagementPage/AddNewVehicle.js
git add src/components/Dashboard/VehicleManagementPage/AllVehiclesList.js
git add src/components/Dashboard/VehicleManagementPage/SearchVehicleByVin.js
git add src/components/Dashboard/VehicleManagementPage/VehicleDetailWithSerial.js
git add src/components/Dashboard/WarrantyConditionManagementPage/WarrantyConditionManagementPage.js
git add src/components/Dashboard/NewRepairClaimPage/NewRepairClaimPage.js
git add src/utils/vehicleClassification.js
git add src/services/serialPartsService.js
```

### Bước 3: Add tất cả files đã modified khác
```bash
git add -u
```

### Bước 4: Commit
```bash
git commit -m "fix: Sửa các lỗi runtime, validation và cải thiện UX

- Fix lỗi vehicleType is not defined trong UpdateDiagnosticPage
- Fix lỗi coverageYears.trim is not a function trong WarrantyConditionManagementPage
- Thêm validation part type phải khớp với vehicle type trong AddNewVehicle
- Cấu hình UTF-8 encoding cho axios và HTML để xử lý tiếng Việt
- Xóa hai cột 'Hiệu lực từ' và 'Hiệu lực đến' khỏi bảng điều kiện bảo hành
- Tự động quay lại danh sách sau khi submit form thành công
- Thêm auto-release reserved parts sau 30 phút nếu diagnosis chưa được gửi
- Release reserved parts khi xóa part hoặc submit diagnosis thành công
- Fix 401/400 errors khi chuyển claim từ draft sang intake
- Thêm axiosConfig và textEncoding utils
- Thêm ENCODING_DEBUG_GUIDE.md và CHANGES_SUMMARY.md"
```

### Bước 5: Push lên remote
```bash
git push origin BE
```

## Cách 3: Commit tất cả thay đổi (nhanh)

```bash
# Add tất cả files (trừ untracked files không liên quan)
git add -u

# Add các files mới
git add src/utils/axiosConfig.js
git add src/utils/textEncoding.js
git add src/utils/validation.js
git add src/components/common/
git add ENCODING_DEBUG_GUIDE.md
git add TESTING_GUIDE_NEW_FEATURES.md
git add CHANGES_SUMMARY.md

# Commit
git commit -m "fix: Sửa các lỗi runtime, validation và cải thiện UX

- Fix lỗi vehicleType is not defined trong UpdateDiagnosticPage
- Fix lỗi coverageYears.trim is not a function trong WarrantyConditionManagementPage
- Thêm validation part type phải khớp với vehicle type trong AddNewVehicle
- Cấu hình UTF-8 encoding cho axios và HTML để xử lý tiếng Việt
- Xóa hai cột 'Hiệu lực từ' và 'Hiệu lực đến' khỏi bảng điều kiện bảo hành
- Tự động quay lại danh sách sau khi submit form thành công
- Thêm auto-release reserved parts sau 30 phút nếu diagnosis chưa được gửi
- Release reserved parts khi xóa part hoặc submit diagnosis thành công
- Fix 401/400 errors khi chuyển claim từ draft sang intake
- Thêm axiosConfig và textEncoding utils
- Thêm ENCODING_DEBUG_GUIDE.md và CHANGES_SUMMARY.md"

# Push
git push origin BE
```

## Lưu ý:

- File `uploads/attachments/...` không nên commit (thường đã có trong .gitignore)
- Nếu muốn xem lại các thay đổi trước khi commit, dùng: `git diff`
- Nếu muốn xem status: `git status`

