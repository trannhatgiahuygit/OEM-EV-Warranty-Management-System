# Hướng dẫn Debug Lỗi Encoding Tiếng Việt

## Vấn đề
Dữ liệu tiếng Việt từ backend hiển thị sai trên frontend (ví dụ: "Hoàng Văn Đức" → "Hoàng Van Ðêc")

## Cách kiểm tra

### 1. Kiểm tra Response từ Backend

Mở **Developer Console** (F12) → Tab **Network**:
1. Reload trang danh sách xe
2. Tìm request đến `/api/vehicles`
3. Click vào request → Tab **Response**
4. Kiểm tra:
   - Response headers có `Content-Type: application/json; charset=utf-8` không?
   - Dữ liệu trong Response có đúng encoding không?

### 2. Kiểm tra Console Logs

Trong **Console** tab, tìm các log:
- `Response encoding:` - Hiển thị charset từ response headers
- `Vehicles response:` - Hiển thị sample data từ backend
- `Potential encoding issue detected:` - Cảnh báo khi phát hiện lỗi encoding

### 3. Kiểm tra Backend

Vấn đề thường nằm ở **Backend**, cần kiểm tra:

#### Database:
- Database có dùng UTF-8 encoding không? (ví dụ: `utf8mb4` cho MySQL)
- Connection string có set charset không? (ví dụ: `?useUnicode=true&characterEncoding=UTF-8`)

#### API Response:
- Backend có set header `Content-Type: application/json; charset=utf-8` không?
- JSON serializer có encode đúng UTF-8 không?

#### Ví dụ cho Spring Boot:
```java
@RestController
@RequestMapping("/api")
public class VehicleController {
    
    @GetMapping(value = "/vehicles", produces = "application/json; charset=UTF-8")
    public ResponseEntity<List<Vehicle>> getVehicles() {
        // ...
    }
}
```

#### Ví dụ cho Database Connection (MySQL):
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/dbname?useUnicode=true&characterEncoding=UTF-8&useSSL=false
```

## Frontend đã được cấu hình

Frontend đã được cấu hình để:
- Request với `Accept: application/json; charset=utf-8`
- Response được decode với `responseEncoding: 'utf8'`
- Logging để debug encoding issues

**Lưu ý:** Frontend không thể tự động sửa dữ liệu đã bị encode sai từ backend. Vấn đề phải được fix ở backend/database level.

