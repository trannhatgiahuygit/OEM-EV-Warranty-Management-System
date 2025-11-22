# 🚗 HỆ THỐNG PHÂN LOẠI XE ĐIỆN - OEM EV WARRANTY MANAGEMENT

## 📋 Tổng quan

Hệ thống phân loại xe điện giúp quản lý và theo dõi các loại xe điện khác nhau trong hệ thống bảo hành OEM. Hệ thống được thiết kế để hỗ trợ tất cả các dòng xe điện từ xe máy đến xe chuyên dụng.

## 🎯 Các loại xe được hỗ trợ

### 1. 🏍️ Xe máy điện (Electric Motorcycle)
- **Mô tả**: Xe điện như của VinFast, YADEA...
- **Đặc điểm**:
  - Tốc độ tối đa: 70km/h
  - Loại pin: Li-ion removable
  - Phù hợp cho di chuyển cá nhân
- **Thương hiệu**: VinFast, YADEA, Pega, Dibao
- **Linh kiện bảo hành**:
  - Quản lý pin
  - Động cơ điện
  - Bộ điều khiển
  - Hệ thống sạc
  - Phanh điện tử

### 2. 🚗 Ô tô điện (Electric Car)
- **Mô tả**: Tesla, VinFast VF series, BYD, Hyundai Ioniq...
- **Đặc điểm**:
  - Tốc độ tối đa: 200km/h+
  - Loại pin: Li-ion fixed pack
  - Xe gia đình và thương mại
- **Thương hiệu**: Tesla, VinFast, BYD, Hyundai, BMW, Audi
- **Linh kiện bảo hành**:
  - Bảo hành pin
  - Inverter
  - BMS (Battery Management System)
  - Drive unit
  - Charging system
  - HVAC system

### 3. 🚲 Xe đạp điện - eBike
- **Mô tả**: Thường dùng ở trường học, thành phố
- **Đặc điểm**:
  - Tốc độ tối đa: 25km/h
  - Loại pin: Li-ion removable
  - Thân thiện môi trường
- **Thương hiệu**: Giant, Trek, Specialized, Xiaomi
- **Linh kiện bảo hành**:
  - Cũng cần quản lý bộ điều khiển
  - Pin lithium
  - Motor hub
  - Display controller
  - Pedal assist system

### 4. 🛺 Xe điện ba bánh / xe điện dịch vụ
- **Mô tả**: Xe chở hàng, xe du lịch săn golf...
- **Đặc điểm**:
  - Tốc độ tối đa: 35km/h
  - Loại pin: Lead-acid or Li-ion
  - Vận chuyển hàng hóa và dịch vụ
- **Thương hiệu**: Club Car, E-Z-GO, Yamaha, Custom
- **Linh kiện bảo hành**:
  - Quản lý bảo hành linh kiện tương tự
  - Heavy duty battery pack
  - Cargo management system
  - Commercial grade motor
  - Fleet tracking system

### 5. 🏭 Xe điện chuyên dụng
- **Mô tả**: Xe nâng điện (Forklift), Xe vận tải nhỏ trong nhà máy, Xe tự hành AGV
- **Đặc điểm**:
  - Tốc độ tối đa: 20km/h
  - Loại pin: Industrial grade Li-ion/Lead-acid
  - Ứng dụng công nghiệp
- **Thương hiệu**: Toyota, Crown, Hyster, Yale, Komatsu
- **Linh kiện bảo hành**:
  - Industrial battery management
  - Heavy duty motor
  - Hydraulic systems (for forklifts)
  - Navigation system (for AGV)
  - Safety sensors
  - Load management system

## 🔧 Linh kiện bảo hành chung

Tất cả xe điện đều có các linh kiện cơ bản cần bảo hành:

### Linh kiện mức độ cao (High Criticality) 🔴
- **Battery Pack** (Bộ pin): 8 năm hoặc 160,000km
- **Electric Motor** (Động cơ điện): 5 năm hoặc 100,000km
- **BMS** (Hệ thống quản lý pin): 5 năm hoặc 100,000km

### Linh kiện mức độ trung bình (Medium Criticality) 🟡
- **Power Inverter** (Bộ nghịch lưu): 3 năm hoặc 60,000km
- **Charging Port** (Cổng sạc): 2 năm hoặc 40,000km

### Linh kiện mức độ thấp (Low Criticality) 🟢
- **Display Unit** (Màn hình hiển thị): 2 năm hoặc 40,000km

## 🎨 Tính năng hệ thống

### 1. Bộ lọc phân loại thông minh
- Lọc theo loại xe
- Tìm kiếm theo tên, mô tả, thương hiệu
- Hiển thị thống kê theo từng loại

### 2. Cards hiển thị chi tiết
- Thông tin đầy đủ về từng loại xe
- Số lượng xe hiện có trong hệ thống
- Thương hiệu phổ biến
- Linh kiện bảo hành chính với mức độ ưu tiên

### 3. Tích hợp với hệ thống bảo hành
- Liên kết trực tiếp đến quản lý xe
- Theo dõi lịch sử bảo hành
- Quản lý serial parts theo loại xe

## 📱 Cách sử dụng

### Truy cập trang phân loại xe:
```
http://localhost:3000/vehicle-categories
```

### Các thao tác chính:
1. **Xem tất cả loại xe**: Trang chủ hiển thị tất cả categories
2. **Lọc theo loại**: Click dropdown "Phân loại xe"
3. **Tìm kiếm**: Dùng ô search để tìm theo từ khóa
4. **Xem chi tiết**: Click "Xem danh sách xe" trên mỗi card
5. **Quản lý bảo hành**: Click "Quản lý bảo hành" để vào trang quản lý

## 🛠️ Technical Implementation

### Files Structure:
```
src/
├── constants/
│   └── vehicleCategories.js          # Định nghĩa categories và constants
├── components/
│   ├── VehicleCategoryFilter/        # Component bộ lọc
│   ├── VehicleCategoryCard/          # Component card hiển thị
│   └── VehicleCategoryPage/          # Trang chính
```

### Key Constants:
- `VEHICLE_CATEGORIES`: Định nghĩa các loại xe
- `COMMON_EV_COMPONENTS`: Linh kiện chung của xe điện
- `WARRANTY_SEVERITY`: Mức độ ưu tiên bảo hành

### API Integration Ready:
Hệ thống đã chuẩn bị sẵn để tích hợp với backend:
- Vehicle counting by category
- Filter vehicles by category
- Category-specific warranty management

## 🚀 Tính năng mở rộng

1. **Thống kê chi tiết**: Biểu đồ phân bố xe theo loại
2. **Báo cáo bảo hành**: Thống kê theo từng category
3. **Quản lý thương hiệu**: Thêm/sửa/xóa thương hiệu
4. **Custom categories**: Cho phép tạo category tùy chỉnh
5. **Export data**: Xuất báo cáo Excel/PDF

## 📊 Kết luận

Hệ thống phân loại xe điện cung cấp:
- ✅ Quản lý tập trung tất cả loại xe điện
- ✅ UI/UX thân thiện và dễ sử dụng  
- ✅ Tích hợp hoàn chỉnh với hệ thống bảo hành
- ✅ Mở rộng dễ dàng cho các loại xe mới
- ✅ Responsive design cho mobile và desktop

**Hệ thống đã sẵn sàng sử dụng và có thể mở rộng theo nhu cầu thực tế! 🎉**