# 📋 Hướng dẫn sử dụng Postman Test Suite cho EV Warranty Management System

## 🎯 Tổng quan

Bộ test này bao gồm các file JSON Postman để test toàn diện hệ thống quản lý bảo hành xe điện. Tất cả các test đều tự động đăng nhập và sử dụng token để thực hiện các API calls.

## 📁 Danh sách file test

### 1. **Postman_Authentication_Tests.json**
- Test đăng nhập cho tất cả các role
- Test invalid login
- Lưu token cho các role khác nhau

### 2. **Postman_Customer_Management_Tests.json**
- Test quản lý khách hàng
- Test đăng ký xe
- Test cập nhật thông tin
- Test kiểm tra trạng thái bảo hành

### 3. **Postman_Warranty_Claim_Flow_Tests.json**
- Test toàn bộ quy trình bảo hành từ A-Z
- Tạo claim → Diagnostic → Approval → Repair → Completion
- Test tất cả các bước trong workflow

### 4. **Postman_Inventory_Management_Tests.json**
- Test quản lý kho và phụ tùng
- Test reserve/release parts
- Test tạo shipment
- Test stock levels và alerts

### 5. **Postman_Work_Order_Tests.json**
- Test quản lý work order
- Test assign technician
- Test track progress
- Test complete work order

### 6. **Postman_Recall_Campaign_Tests.json**
- Test quản lý recall campaigns
- Test tạo và release campaign
- Test notify affected vehicles
- Test search campaigns

### 7. **Postman_Reporting_Analytics_Tests.json**
- Test báo cáo và phân tích
- Test warranty cost reports
- Test dashboard summary
- Test export reports

### 8. **Postman_Edge_Cases_Tests.json**
- Test các trường hợp đặc biệt
- Test error handling
- Test out of warranty vehicles
- Test concurrent operations

### 9. **Postman_Complete_Test_Suite.json**
- Bộ test hoàn chỉnh tích hợp tất cả chức năng
- Test end-to-end workflow
- Tự động tạo test data
- Test toàn bộ quy trình bảo hành

## 🚀 Cách sử dụng

### Bước 1: Import vào Postman
1. Mở Postman
2. Click "Import" 
3. Chọn file JSON muốn test
4. Click "Import"

### Bước 2: Cấu hình Environment
1. Tạo Environment mới
2. Set biến `base_url` = `http://localhost:8080`
3. Save environment

### Bước 3: Chạy test
1. Chọn Environment đã tạo
2. Chọn collection muốn test
3. Click "Run" để chạy tất cả test
4. Hoặc chạy từng test riêng lẻ

## 🔧 Cấu hình cần thiết

### Database Setup
Đảm bảo database đã được setup với data từ file `data.sql`:
- Users với password `123`
- Sample vehicles, customers, parts
- Claim statuses và inventory data

### Server Setup
- Spring Boot application chạy trên port 8080
- Database connection đã được cấu hình
- JWT authentication đã được enable

## 👥 Tài khoản test

Các tài khoản có sẵn trong database:

| Username | Password | Role | Mô tả |
|----------|----------|------|-------|
| `admin_user` | `123` | ADMIN | Quản trị viên hệ thống |
| `evm_staff1` | `123` | EVM_STAFF | Nhân viên hãng xe |
| `sc_staff1` | `123` | SC_STAFF | Nhân viên trung tâm dịch vụ |
| `tech1` | `123` | SC_TECHNICIAN | Kỹ thuật viên |

## 📊 Kết quả test mong đợi

### ✅ Test thành công
- Tất cả API calls trả về status 200/201
- Token được lưu và sử dụng đúng
- Data được tạo và cập nhật chính xác
- Workflow hoàn tất từ đầu đến cuối

### ❌ Test thất bại
- Kiểm tra server có đang chạy không
- Kiểm tra database connection
- Kiểm tra JWT configuration
- Kiểm tra API endpoints có đúng không

## 🔍 Debug và Troubleshooting

### Lỗi thường gặp:

1. **401 Unauthorized**
   - Kiểm tra token có được lưu đúng không
   - Kiểm tra JWT configuration

2. **404 Not Found**
   - Kiểm tra API endpoints
   - Kiểm tra server có đang chạy không

3. **500 Internal Server Error**
   - Kiểm tra database connection
   - Kiểm tra server logs

### Debug steps:
1. Kiểm tra server logs
2. Kiểm tra database data
3. Test từng API riêng lẻ
4. Kiểm tra network connection

## 📈 Performance Testing

Các test được thiết kế để:
- Test response time < 5 seconds
- Test concurrent operations
- Test large data handling
- Test system stability

## 🎯 Test Coverage

Bộ test này cover:
- ✅ Authentication & Authorization
- ✅ Customer Management
- ✅ Vehicle Management  
- ✅ Warranty Claim Flow
- ✅ Work Order Management
- ✅ Inventory Management
- ✅ Recall Campaign Management
- ✅ Reporting & Analytics
- ✅ Edge Cases & Error Handling
- ✅ Performance Testing

## 📝 Ghi chú

- Tất cả test đều tự động đăng nhập
- Test data được tạo tự động
- Có thể chạy test nhiều lần
- Test data sẽ được cleanup sau mỗi lần chạy

## 🔄 Cập nhật

Để cập nhật test suite:
1. Thêm test cases mới vào file JSON
2. Cập nhật test data nếu cần
3. Test lại để đảm bảo hoạt động
4. Commit changes vào repository

---

**Lưu ý**: Đảm bảo server và database đã được setup đúng trước khi chạy test. Test suite này được thiết kế để test toàn diện hệ thống quản lý bảo hành xe điện.
