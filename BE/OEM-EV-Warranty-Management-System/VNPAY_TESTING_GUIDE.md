# Hướng Dẫn Test VNPay Sandbox Integration

## 📋 Tổng Quan

Hệ thống đã tích hợp VNPay Sandbox với các API endpoints sau:

### Endpoints
- **Tạo thanh toán**: `POST /api/payment/vnpay/create`
- **Callback từ VNPay**: `GET /vnpay/return`
- **Test return**: `GET /api/payment/vnpay/return-test`

### Cấu hình hiện tại
```properties
vnpay.tmnCode=3LM60U0F
vnpay.hashSecret=32H3JYZG8L19NTXTPOHCWC3BW94SSMU4
vnpay.payUrl=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnpay.returnUrl=http://localhost:8080/vnpay/return
```

---

## 🚀 Cách Test VNPay

### Bước 1: Tạo Payment URL

**Request:**
```bash
curl --location 'http://localhost:8080/api/payment/vnpay/create' \
--header 'Content-Type: application/json' \
--data '{
    "amount": 100000,
    "orderInfo": "Thanh toan bao hanh EV",
    "orderType": "other",
    "locale": "vn",
    "bankCode": "NCB"
}'
```

**Request Body Fields:**
- `amount`: Số tiền (VND) - **Bắt buộc**
- `orderInfo`: Mô tả đơn hàng - Optional (mặc định: "Warranty payment")
- `orderType`: Loại đơn hàng - Optional (mặc định: "other")
- `locale`: Ngôn ngữ (vn/en) - Optional (mặc định: "vn")
- `bankCode`: Mã ngân hàng - Optional (nếu muốn chọn sẵn ngân hàng)
- `txnRef`: Mã giao dịch - Optional (hệ thống sẽ tự generate)

**Response:**
```json
{
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000&vnp_BankCode=NCB&...",
    "txnRef": "a1b2c3d4e5f6",
    "amount": 100000,
    "expireAt": "20250110151530"
}
```

### Bước 2: Truy cập Payment URL

1. Copy `paymentUrl` từ response
2. Mở trình duyệt và paste URL vào
3. Trang VNPay sandbox sẽ hiển thị

### Bước 3: Thanh toán trên VNPay Sandbox

**Thông tin thẻ test:**

#### Thẻ Nội Địa (ATM):
```
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
Mật khẩu OTP: 123456
```

#### Thẻ Quốc Tế (Visa/Master):
```
Số thẻ: 5200000000000007
Tên: Test User
Ngày hết hạn: 12/25
CVV: 123
```

### Bước 4: Xử lý Callback

Sau khi thanh toán thành công hoặc thất bại, VNPay sẽ redirect về:
```
http://localhost:8080/vnpay/return?vnp_Amount=10000000&vnp_BankCode=NCB&vnp_ResponseCode=00&...
```

**Response từ API:**
```json
{
    "success": true,
    "txnRef": "a1b2c3d4e5f6",
    "responseCode": "00",
    "message": "Payment successful",
    "rawParams": {
        "vnp_Amount": "10000000",
        "vnp_BankCode": "NCB",
        "vnp_ResponseCode": "00",
        "vnp_TxnRef": "a1b2c3d4e5f6",
        ...
    }
}
```

---

## 📊 VNPay Response Codes

| Code | Ý Nghĩa | Mô Tả |
|------|---------|-------|
| 00 | ✅ Thành công | Giao dịch thành công |
| 07 | ⚠️ Trừ tiền thành công | Giao dịch bị nghi ngờ (liên quan tới fraud, phải check thêm) |
| 09 | ❌ Thẻ chưa đăng ký | Thẻ chưa đăng ký Internet Banking |
| 10 | ❌ Xác thực thất bại | Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần |
| 11 | ❌ Timeout | Đã hết thời gian chờ thanh toán |
| 12 | ❌ Thẻ bị khóa | Thẻ/Tài khoản bị khóa |
| 13 | ❌ OTP sai | Mật khẩu xác thực không đúng |
| 24 | ❌ Hủy giao dịch | Khách hàng hủy giao dịch |
| 51 | ❌ Không đủ tiền | Tài khoản không đủ số dư |
| 65 | ❌ Vượt quá hạn mức | Tài khoản đã vượt quá hạn mức giao dịch trong ngày |
| 75 | ❌ Ngân hàng bảo trì | Ngân hàng thanh toán đang bảo trì |
| 79 | ❌ Nhập sai quá số lần | Nhập sai mật khẩu thanh toán quá số lần quy định |
| 99 | ❌ Lỗi khác | Lỗi không xác định |

---

## 🧪 Test Cases

### Test Case 1: Thanh toán thành công với NCB
```json
{
    "amount": 50000,
    "orderInfo": "Test thanh toan thanh cong",
    "bankCode": "NCB"
}
```
**Expected**: vnp_ResponseCode = "00"

### Test Case 2: Khách hàng hủy thanh toán
1. Tạo payment URL
2. Truy cập URL
3. Click "Hủy giao dịch"

**Expected**: vnp_ResponseCode = "24"

### Test Case 3: Thanh toán hết hạn
1. Tạo payment URL
2. Đợi 15 phút (expire time)
3. Thử thanh toán

**Expected**: vnp_ResponseCode = "11"

### Test Case 4: Số tiền không hợp lệ
```json
{
    "amount": 0,
    "orderInfo": "Test amount invalid"
}
```
**Expected**: HTTP 400 hoặc 500 với message "Amount must be > 0"

### Test Case 5: Test signature verification
- Thử modify URL callback parameters
- Hệ thống sẽ reject với message "Invalid signature"

---

## 🔍 Debug & Troubleshooting

### Kiểm tra logs
```bash
# Xem log khi tạo payment URL
[INFO] Generated VNPay payment URL for txnRef a1b2c3d4e5f6

# Xem log khi nhận callback
[INFO] VNPay return received txnRef=a1b2c3d4e5f6, success=true, code=00
```

### Kiểm tra cấu hình
```java
// File: application.properties
vnpay.tmnCode=3LM60U0F  // Phải đúng với sandbox account
vnpay.hashSecret=32H3JYZG8L19NTXTPOHCWC3BW94SSMU4  // Secret key
vnpay.returnUrl=http://localhost:8080/vnpay/return  // Phải match với domain
```

### Các lỗi thường gặp

#### 1. Invalid signature
- **Nguyên nhân**: hashSecret sai hoặc parameters bị modify
- **Giải pháp**: Kiểm tra lại hashSecret trong config

#### 2. Return URL không hoạt động
- **Nguyên nhân**: returnUrl không match với backend
- **Giải pháp**: Đảm bảo server đang chạy ở đúng port 8080

#### 3. Không redirect về sau khi thanh toán
- **Nguyên nhân**: VNPay sandbox có thể không redirect trong một số trường hợp
- **Giải pháp**: Manually copy callback URL và test với endpoint `/api/payment/vnpay/return-test`

---

## 🌐 Test với Postman

Import file `Postman_VNPay_Tests.json` vào Postman để có sẵn các test cases.

Hoặc sử dụng file HTML `vnpay-test-ui.html` để test trực quan qua giao diện web.

---

## 📝 Notes

1. **Sandbox environment**: Chỉ dùng cho testing, không thể thanh toán thật
2. **Return URL**: Phải là URL có thể access được từ browser (localhost OK khi test local)
3. **Amount**: Phải > 0 và là số nguyên (đơn vị VND)
4. **Expire time**: Mặc định 15 phút
5. **Transaction Reference**: Auto-generate nếu không truyền, nên dùng ID từ database

---

## 🔗 Tài liệu tham khảo

- VNPay Sandbox: https://sandbox.vnpayment.vn/
- VNPay API Docs: https://sandbox.vnpayment.vn/apis/docs/
- Swagger UI: http://localhost:8080/swagger-ui.html

---

## ✅ Checklist Test

- [ ] Tạo payment URL thành công
- [ ] Truy cập được VNPay sandbox page
- [ ] Thanh toán thành công với thẻ test NCB
- [ ] Nhận được callback với responseCode=00
- [ ] Signature verification pass
- [ ] Test hủy thanh toán (responseCode=24)
- [ ] Test với số tiền khác nhau
- [ ] Test với các ngân hàng khác nhau
- [ ] Test invalid amount (<=0)
- [ ] Test signature tampering

