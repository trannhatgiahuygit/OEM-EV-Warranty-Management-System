# 🚀 HƯỚNG DẪN SỬ DỤNG TASK 2 - SERIAL PARTS ASSIGNMENT

## 📋 Tổng quan
Task 2 đã được tích hợp hoàn chỉnh với Backend API. Hệ thống sẽ tự động gán serial linh kiện vào xe sau khi work order hoàn thành.

---

## ✅ ĐÃ HOÀN THÀNH

### 1. Backend API (Đã có sẵn)
- ✅ GET `/api/part-serials/available?partId={id}` - Lấy serial khả dụng
- ✅ POST `/api/part-serials/install` - Gán serial vào xe  
- ✅ GET `/api/part-serials/vehicle/{vin}` - Xem lịch sử serial của xe
- ✅ GET `/api/part-serials/{serialNumber}` - Chi tiết serial

### 2. Frontend Components (Đã implement)
- ✅ `serialPartsService.js` - API service (đã fix match backend)
- ✅ `SerialPartsAssignment` - Component gán serial
- ✅ `VehicleSerialHistory` - Component xem lịch sử
- ✅ `VehicleDetailWithSerial` - Modal chi tiết xe + serial
- ✅ Integration vào Vehicle Management page

---

## 🎯 CÁCH SỬ DỤNG

### Bước 1: Khởi động ứng dụng

```powershell
# Terminal 1: Chạy Backend (port 8080)
cd D:\SWP\OEM-EV-Warranty-Management-System\BE\OEM-EV-Warranty-Management-System
mvnw spring-boot:run

# Terminal 2: Chạy Frontend (port 3000)  
cd D:\SWP\OEM-EV-Warranty-Management-System\FE\OEM-EV-Warranty-Management-System\oem-ev-warranty-management-system
npm start
```

### Bước 2: Login vào hệ thống

1. Mở trình duyệt: `http://localhost:3000`
2. Login với tài khoản (ví dụ: `evm_staff1` hoặc `sc_staff1`)

### Bước 3: Xem lịch sử Serial của xe

#### 📍 Đường dẫn: Dashboard → Quản lý Xe

1. Click **"Quản lý Xe"** trong menu bên trái
2. Chọn tab **"Tất cả Xe"** hoặc search theo VIN/Customer
3. Với mỗi xe, bạn sẽ thấy 3 nút:
   - Chi tiết Phụ tùng
   - Lịch sử Dịch vụ
   - **Lịch sử Serial** ⭐ (NÚT MỚI - màu tím gradient)

4. Click **"Lịch sử Serial"**

### Bước 4: Modal "Chi tiết Xe với Lịch sử Serial"

Modal hiển thị 2 phần:

#### **Phần 1: Thông tin Xe**
```
VIN: ABC123XYZ
Mẫu xe: Tesla Model S 
Số km: 15,000 km
Ngày sản xuất: 15/01/2023
Ngày bảo hành: 15/01/2026
Chủ xe: Nguyễn Văn A
Số điện thoại: 0912345678
Email: nguyenvana@email.com
```

#### **Phần 2: Lịch sử Serial Linh Kiện**

**Summary Cards:**
- 📦 Tổng số linh kiện: 12
- ✅ Đã lắp đặt: 10
- 🔄 Đã thay thế: 1
- ⚠️ Lỗi: 1

**Bộ lọc:**
- Dropdown trạng thái: Tất cả / Trong kho / Đã lắp / Đã thay thế / Lỗi
- Search box: Tìm theo serial number, tên linh kiện

**Bảng chi tiết:**
| Serial Number | Tên Linh Kiện | Loại | Ngày Gán | Trạng Thái | Vị Trí | Work Order |
|---|---|---|---|---|---|---|
| SN-EVM-2024-001 | Battery Module | EVM | 15/03/2024 | Đã lắp đặt | Xe khách hàng | WO-123 |
| SN-EVM-2024-045 | Motor Controller | EVM | 20/03/2024 | Đã lắp đặt | Xe khách hàng | WO-145 |

---

## 🔧 LUỒNG HOÀN CHỈNH (Khi có Work Order)

### Scenario: Technician hoàn thành sửa chữa

1. **Technician** nhận work order và sửa xe
2. Update work order status → **"DONE"**
3. → Hệ thống tự động trigger `SerialPartsAssignment` component
4. Component load danh sách serial khả dụng từ kho
5. Technician chọn serial cho từng linh kiện:
   - Click "Chọn tự động" hoặc
   - Chọn manual từng serial
6. Click **"Gán Serial Tự Động"**
7. → Backend gọi API `POST /api/part-serials/install` cho mỗi serial
8. → Status serial cập nhật: `in_stock` → `installed`
9. → Serial được link với xe (qua VIN)

### Xem kết quả:

1. Vào **"Quản lý Xe"**
2. Tìm xe vừa sửa
3. Click **"Lịch sử Serial"**
4. → Thấy serial mới được gán với thông tin đầy đủ

---

## 📊 DATABASE STRUCTURE (Backend đã có)

### Table: `part_serials`
```sql
- id: Integer (PK)
- part_id: Integer (FK to parts)
- serial_number: String (Unique)
- manufacture_date: Date
- status: String (in_stock / allocated / installed / returned)
- installed_on_vehicle_id: Integer (FK to vehicles)
- installed_at: DateTime
```

### Table: `part_serial_history`
```sql
- id: Integer (PK)
- part_serial_id: Integer (FK)
- action: String
- performed_at: DateTime
- performed_by_user_id: Integer
- notes: Text
```

---

## 🎨 UI FEATURES

### ✅ Đã có
- [x] Professional gradient button "Lịch sử Serial" (màu tím)
- [x] Beautiful modal với animation
- [x] Summary statistics cards
- [x] Status badges với màu sắc
- [x] Filter & search functionality
- [x] Responsive design
- [x] Loading states
- [x] Error handling
- [x] Empty states

### 🎯 Key Points
- Nút "Lịch sử Serial" có màu gradient tím nổi bật
- Modal mở với smooth animation
- Table có scroll nếu nhiều records
- Status có màu: Xanh (installed), Vàng (allocated), Xám (returned)
- Search real-time khi gõ

---

## 🔍 TESTING

### Test Case 1: Xem lịch sử serial
1. Login với `sc_staff1`
2. Vào "Quản lý Xe"
3. Click "Lịch sử Serial" của xe bất kỳ
4. **Expected**: Modal mở, hiển thị thông tin xe và danh sách serial

### Test Case 2: Filter serial
1. Mở modal lịch sử serial
2. Chọn dropdown "Trạng thái" → "Đã lắp đặt"
3. **Expected**: Chỉ hiển thị serial có status = installed

### Test Case 3: Search serial
1. Mở modal lịch sử serial
2. Gõ vào search box: "SN-EVM"
3. **Expected**: Filter real-time, chỉ hiển thị serial match

### Test Case 4: Empty state
1. Mở lịch sử serial của xe mới (chưa có serial)
2. **Expected**: Hiển thị "Chưa có linh kiện nào được gán cho xe này"

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Failed to load serial parts"
**Nguyên nhân**: Backend không chạy hoặc API không khớp  
**Fix**: 
1. Kiểm tra backend đang chạy: `http://localhost:8080`
2. Check console log để xem API response

### Lỗi: Modal không mở
**Nguyên nhân**: Vehicle không có VIN  
**Fix**: Đảm bảo xe có VIN trong database

### Lỗi: Empty list nhưng xe có serial
**Nguyên nhân**: VIN không match  
**Fix**: 
1. Check VIN trong database
2. Verify API endpoint `/api/part-serials/vehicle/{vin}`

---

## 📝 NOTES

### Backend API Format
```javascript
// GET /api/part-serials/available?partId=123
Response: [
  {
    id: 1,
    serialNumber: "SN-EVM-2024-001",
    part: { id: 123, name: "Battery Module" },
    status: "in_stock",
    manufactureDate: "2024-01-15"
  }
]

// GET /api/part-serials/vehicle/{vin}
Response: {
  vin: "ABC123XYZ",
  installedParts: [
    {
      id: 1,
      serialNumber: "SN-EVM-2024-001",
      part: { name: "Battery Module", partType: "EVM" },
      status: "installed",
      installedAt: "2024-03-15T10:30:00"
    }
  ],
  totalParts: 5
}
```

### Frontend Service Methods
```javascript
// Get available serials
await serialPartsService.getAvailableSerialParts(partId);

// Install serial on vehicle
await serialPartsService.installSerialPart(serialNumber, vin, workOrderId);

// Get vehicle serial history
await serialPartsService.getVehicleSerialParts(vin);
```

---

## ✨ NEXT STEPS (Optional Enhancements)

1. **Scan Barcode**: Thêm tính năng scan barcode cho serial number
2. **Export**: Export lịch sử ra Excel/PDF
3. **Notifications**: Thông báo khi serial sắp hết hạn bảo hành
4. **Analytics**: Dashboard thống kê serial usage
5. **Bulk Import**: Import nhiều serial cùng lúc

---

## 🎉 HOÀN THÀNH!

Task 2 đã sẵn sàng sử dụng với đầy đủ:
- ✅ Backend API integration
- ✅ Professional UI/UX
- ✅ Complete documentation
- ✅ Error handling
- ✅ Ready for production

**Chúc bạn test thành công! 🚀**
