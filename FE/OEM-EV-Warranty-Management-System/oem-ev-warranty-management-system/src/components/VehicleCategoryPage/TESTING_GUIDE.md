# Hướng Dẫn Chạy Hệ Thống Phân Loại Xe Điện

## Bước 1: Khởi động ứng dụng
✅ **Đã hoàn thành** - App React đang khởi động...

Khi app khởi động xong, bạn sẽ thấy thông báo:
```
Local:            http://localhost:3000
On Your Network:  http://192.168.x.x:3000
```

## Bước 2: Truy cập hệ thống phân loại xe

### Cách 1: Truy cập trực tiếp
1. Mở trình duyệt
2. Truy cập: **http://localhost:3000/vehicle-categories**

### Cách 2: Từ trang chính (nếu có menu)
1. Vào http://localhost:3000
2. Tìm và click vào menu "Vehicle Categories" hoặc "Phân loại xe"

## Bước 3: Test các tính năng

### 🔍 **Tính năng tìm kiếm**
1. **Tìm kiếm theo từ khóa:**
   - Gõ "motorcycle" → Hiển thị xe máy điện
   - Gõ "Tesla" → Hiển thị category có Tesla
   - Gõ "battery" → Hiển thị các category có thông tin pin

2. **Test tìm kiếm trống:**
   - Xóa hết text trong ô search → Hiển thị tất cả categories

### 🏷️ **Tính năng lọc (Filter)**
1. **Filter theo loại xe:**
   - Click dropdown "Select Category"
   - Chọn "Motorcycle" → Chỉ hiển thị xe máy điện
   - Chọn "Car" → Chỉ hiển thị ô tô điện
   - Chọn "All Categories" → Hiển thị tất cả

2. **Kết hợp filter + search:**
   - Chọn filter "Car" + search "BMW" → Chỉ hiển thị ô tô BMW

### 📱 **Test giao diện responsive**
1. **Desktop view:** Thấy grid 2-3 columns
2. **Mobile view:** Thu nhỏ cửa sổ → Thấy 1 column
3. **Tablet view:** Thấy 2 columns

### 🎨 **Kiểm tra theme consistency**
1. **Màu sắc:** Phải match với màu dark theme của app
2. **Hover effects:** Không có animation di chuyển, chỉ thay đổi màu border
3. **Typography:** Font và size phải nhất quán với app

## Bước 4: Test từng Vehicle Category

### 🏍️ **Motorcycle Category**
- **Brands:** VinFast, Honda, Yamaha, BMW, Zero
- **Speed Range:** 45-200 km/h
- **Battery Range:** 80-300 km
- **Warranty Components:** Motor, Battery Pack, Controller, Display

### 🚗 **Car Category**  
- **Brands:** Tesla, VinFast, BMW, Mercedes, Audi
- **Speed Range:** 150-350 km/h  
- **Battery Range:** 250-600 km
- **Warranty Components:** Motor, Battery Pack, Infotainment, Charging Port

### 🚲 **Bike Category**
- **Brands:** Giant, Trek, Bosch, Shimano
- **Speed Range:** 25-45 km/h
- **Battery Range:** 40-120 km  
- **Warranty Components:** Motor, Battery Pack, Controller, Display

### 🛺 **Three-Wheeler Category**
- **Brands:** Mahindra, Bajaj, Piaggio
- **Speed Range:** 25-80 km/h
- **Battery Range:** 60-150 km
- **Warranty Components:** Motor, Battery Pack, Controller, Charger

### 🚛 **Commercial Vehicle**
- **Brands:** BYD, Mercedes, Volvo, Scania
- **Speed Range:** 90-120 km/h
- **Battery Range:** 200-500 km  
- **Warranty Components:** Motor, Battery Pack, Controller, Infotainment

## Bước 5: Test các button actions

### 👀 **"View Vehicles" Button**
- Click vào button xanh "View Vehicles"
- **Expected:** Hiển thị danh sách xe trong category đó

### 🛠️ **"Manage Warranty" Button**  
- Click vào button xanh lá "Manage Warranty"
- **Expected:** Chuyển đến trang quản lý bảo hành cho category

## Bước 6: Kiểm tra tính năng nâng cao

### 📊 **Statistics Display**
- Kiểm tra header hiển thị:
  - **Total Categories:** 5
  - **Total Vehicles:** (số tổng)
  - **Active Warranties:** (số bảo hành đang hoạt động)

### 🔄 **Clear Filters**
- Sau khi filter/search, click "Clear All Filters"
- **Expected:** Reset về hiển thị tất cả categories

### ⚡ **Performance**
- Page load nhanh
- Search/filter response tức thì
- Smooth animations (fade in, không có lag)

## Lỗi có thể gặp và cách fix

### ❌ **Lỗi "Module not found"**
```bash
npm install
npm start
```

### ❌ **Lỗi "Cannot read property"**  
- Kiểm tra file `vehicleCategories.js` có tồn tại
- Restart lại React app

### ❌ **UI không đúng theme**
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache

### ❌ **Route không hoạt động**
- Kiểm tra `App.js` có import VehicleCategoryPage
- Kiểm tra React Router setup

## Expected Results ✅

Khi test thành công, bạn sẽ thấy:

1. **Professional Dark Theme** - Nhất quán với app
2. **Smooth Performance** - Không lag, response nhanh  
3. **All Features Work** - Search, filter, buttons đều hoạt động
4. **Responsive Design** - Hiển thị tốt trên mọi device size
5. **No Console Errors** - Không có lỗi JavaScript

---

## Ghi chú cho Developer

- **Route:** `/vehicle-categories`
- **Main Component:** `VehicleCategoryPage`
- **Data Source:** `vehicleCategories.js`
- **Theme Variables:** Import từ `../../styles/theme.css`
- **Responsive Breakpoints:** 768px (mobile), 1024px (tablet)