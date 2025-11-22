#!/bin/bash
# Script to commit all changes from yesterday to now
# Usage: Run this script from the project root directory

echo "========================================"
echo "Committing Frontend Changes"
echo "========================================"
echo ""

# Add new files
echo "[1/3] Adding new files..."
git add src/utils/axiosConfig.js
git add src/utils/textEncoding.js
git add src/utils/validation.js
git add src/components/common/
git add ENCODING_DEBUG_GUIDE.md
git add TESTING_GUIDE_NEW_FEATURES.md
git add CHANGES_SUMMARY.md
echo "New files added."
echo ""

# Add modified files (main changes from yesterday)
echo "[2/3] Adding modified files..."
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
echo "Modified files added."
echo ""

# Add other modified files (if you want to include all changes)
echo "[3/3] Adding other modified files..."
git add -u
echo "All modified files added."
echo ""

# Show status
echo "========================================"
echo "Current git status:"
echo "========================================"
git status --short
echo ""

# Commit
echo "========================================"
echo "Committing changes..."
echo "========================================"
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

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "Commit successful!"
    echo "========================================"
    echo ""
    echo "To push to remote, run:"
    echo "  git push origin BE"
else
    echo ""
    echo "========================================"
    echo "Commit failed! Please check the errors above."
    echo "========================================"
fi

