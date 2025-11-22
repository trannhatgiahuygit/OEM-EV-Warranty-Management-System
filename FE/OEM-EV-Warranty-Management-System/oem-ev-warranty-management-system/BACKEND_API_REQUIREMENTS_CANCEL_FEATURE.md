# Backend API Requirements - Cancel Request Feature

## Tổng quan
Tài liệu này mô tả các API endpoints cần thiết để hỗ trợ tính năng "Yêu cầu Hủy" cho claims.

## Các Status mới
- `CANCEL_PENDING`: Technician đã yêu cầu hủy, đang chờ SC Staff xử lý
- `CANCELED_PENDING`: SC Staff đã chấp nhận hủy (tạm thời, sẽ tự động chuyển sang CANCELED_READY_TO_HANDOVER)
- `CANCELED_READY_TO_HANDOVER`: Sẵn sàng trả xe cho khách hàng (đã hủy)
- `CANCELED_DONE`: Đã hoàn tất hủy và trả xe

## API Endpoints

### 1. POST `/api/claims/{claimId}/cancel-request`
**Mô tả**: Technician yêu cầu hủy claim

**Request Body**:
```json
{
  "reason": "string" // Lý do yêu cầu hủy (required, max 1000 ký tự)
}
```

**Response** (200/201):
```json
{
  "id": "number",
  "claimNumber": "string",
  "status": "CANCEL_PENDING",
  "cancelRequestReason": "string",
  "cancelRequestCount": "number", // Số lần đã yêu cầu hủy
  // ... other claim fields
}
```

**Validation**:
- Chỉ Technician được phân công cho claim mới có thể yêu cầu
- Chỉ cho phép yêu cầu hủy từ status: OPEN, IN_PROGRESS, PENDING_APPROVAL (cho EVM Repair) hoặc thêm CUSTOMER_PAYMENT_PENDING (cho SC Repair)
- Không cho phép yêu cầu hủy nếu `cancelRequestCount >= 2`
- Không cho phép yêu cầu hủy nếu status là CUSTOMER_PAID hoặc READY_FOR_REPAIR trở đi
- Lưu `cancelRequestReason` vào claim
- Tăng `cancelRequestCount` lên 1
- Lưu status trước đó vào `previousStatus` (để có thể rollback khi từ chối)
- Tạo status history entry

**Error Responses**:
- 400: Validation error (reason missing, invalid status, etc.)
- 403: User không có quyền
- 404: Claim không tồn tại
- 409: Đã yêu cầu hủy 2 lần rồi

---

### 2. POST `/api/claims/{claimId}/cancel-approve`
**Mô tả**: SC Staff chấp nhận yêu cầu hủy từ Technician

**Request Body**: (empty hoặc có thể có note)
```json
{}
```

**Response** (200/201):
```json
{
  "id": "number",
  "claimNumber": "string",
  "status": "CANCELED_READY_TO_HANDOVER", // Tự động chuyển từ CANCELED_PENDING
  // ... other claim fields
}
```

**Validation**:
- Chỉ SC Staff mới có thể chấp nhận
- Claim phải có status = `CANCEL_PENDING`
- Khi chấp nhận:
  1. Status chuyển thành `CANCELED_PENDING`
  2. Tự động chuyển ngay sang `CANCELED_READY_TO_HANDOVER`
  3. Lưu status history với note từ `cancelRequestReason`

**Error Responses**:
- 400: Claim không ở trạng thái CANCEL_PENDING
- 403: User không có quyền
- 404: Claim không tồn tại

---

### 3. POST `/api/claims/{claimId}/cancel-reject`
**Mô tả**: SC Staff từ chối yêu cầu hủy từ Technician

**Request Body**:
```json
{
  "reason": "string" // Lý do từ chối (required, max 500 ký tự)
}
```

**Response** (200/201):
```json
{
  "id": "number",
  "claimNumber": "string",
  "status": "OPEN", // Hoặc status trước đó (từ previousStatus)
  "cancelRequestReason": null, // Clear cancel request reason
  // ... other claim fields
}
```

**Validation**:
- Chỉ SC Staff mới có thể từ chối
- Claim phải có status = `CANCEL_PENDING`
- Khi từ chối:
  1. Trả status về status trước đó (lưu trong `previousStatus`)
  2. Clear `cancelRequestReason`
  3. KHÔNG giảm `cancelRequestCount` (để đếm số lần đã yêu cầu)
  4. Lưu status history với note là lý do từ chối

**Error Responses**:
- 400: Claim không ở trạng thái CANCEL_PENDING hoặc reason missing
- 403: User không có quyền
- 404: Claim không tồn tại

---

### 4. POST `/api/claims/{claimId}/cancel-direct`
**Mô tả**: SC Staff trực tiếp hủy claim (không cần chờ Technician yêu cầu)

**Request Body**:
```json
{
  "reason": "string" // Lý do hủy (required, max 1000 ký tự)
}
```

**Response** (200/201):
```json
{
  "id": "number",
  "claimNumber": "string",
  "status": "CANCELED_READY_TO_HANDOVER", // Tự động chuyển từ CANCELED_PENDING
  "cancelRequestReason": "string", // Lưu lý do
  // ... other claim fields
}
```

**Validation**:
- Chỉ SC Staff mới có thể trực tiếp hủy
- Chỉ cho phép hủy từ status: OPEN, IN_PROGRESS, PENDING_APPROVAL (cho EVM Repair) hoặc thêm CUSTOMER_PAYMENT_PENDING (cho SC Repair)
- Không cho phép hủy nếu status là CUSTOMER_PAID hoặc READY_FOR_REPAIR trở đi
- Khi hủy:
  1. Status chuyển thành `CANCELED_PENDING`
  2. Tự động chuyển ngay sang `CANCELED_READY_TO_HANDOVER`
  3. Lưu `cancelRequestReason`
  4. Lưu status history

**Error Responses**:
- 400: Validation error (invalid status, reason missing, etc.)
- 403: User không có quyền
- 404: Claim không tồn tại

---

### 5. PUT `/api/claims/{claimId}/status` (Existing endpoint, cần hỗ trợ status mới)
**Mô tả**: Cập nhật status của claim (đã có sẵn, cần thêm hỗ trợ cho status mới)

**Request Body**:
```json
{
  "status": "CANCELED_DONE" // hoặc "OPEN" (để mở lại)
}
```

**Validation cho CANCELED_DONE**:
- Chỉ cho phép từ status `CANCELED_READY_TO_HANDOVER`
- Chỉ SC Staff mới có thể thực hiện
- Lưu status history

**Validation cho OPEN (mở lại)**:
- Chỉ cho phép từ status `CANCELED_READY_TO_HANDOVER`
- Chỉ SC Staff mới có thể thực hiện
- Lưu status history với note "Mở lại yêu cầu từ trạng thái hủy"

---

## Database Schema Changes

### Claim Entity cần thêm các fields:
```java
@Column(name = "cancel_request_reason", length = 1000)
private String cancelRequestReason;

@Column(name = "cancel_request_count")
private Integer cancelRequestCount = 0;

@Column(name = "previous_status")
@Enumerated(EnumType.STRING)
private ClaimStatus previousStatus; // Lưu status trước khi yêu cầu hủy
```

### Status Enum cần thêm:
```java
CANCEL_PENDING,
CANCELED_PENDING,
CANCELED_READY_TO_HANDOVER,
CANCELED_DONE
```

---

## Business Logic

### 1. Kiểm tra điều kiện hủy (SC Repair):
- Cho phép hủy từ: OPEN, IN_PROGRESS, PENDING_APPROVAL, CUSTOMER_PAYMENT_PENDING
- KHÔNG cho phép hủy từ: CUSTOMER_PAID trở đi

### 2. Kiểm tra điều kiện hủy (EVM Repair):
- Cho phép hủy từ: OPEN, IN_PROGRESS, PENDING_APPROVAL
- KHÔNG cho phép hủy từ: READY_FOR_REPAIR trở đi (vì khi EVM approve thì tự động chuyển sang READY_FOR_REPAIR)

### 3. Giới hạn số lần yêu cầu hủy:
- Technician chỉ được yêu cầu hủy tối đa 2 lần cho một claim
- Backend cần validate `cancelRequestCount < 2` trước khi cho phép yêu cầu hủy

### 4. Luồng tự động chuyển status:
- Khi SC Staff chấp nhận hủy hoặc trực tiếp hủy:
  1. Status = CANCELED_PENDING (tạm thời)
  2. Tự động chuyển ngay sang CANCELED_READY_TO_HANDOVER
  3. Có thể thực hiện trong cùng một transaction

---

## Status History
Tất cả các thay đổi status cần được lưu vào bảng status history với:
- `statusCode`: Status mới
- `note`: Lý do hoặc ghi chú
- `changedBy`: User thực hiện
- `changedAt`: Thời gian thay đổi

---

## Error Handling
Tất cả các endpoints cần trả về error message rõ ràng bằng tiếng Việt khi có lỗi:
```json
{
  "message": "Không thể yêu cầu hủy. Bạn đã yêu cầu hủy 2 lần rồi.",
  "error": "MAX_CANCEL_REQUESTS_REACHED"
}
```

---

## Testing Checklist
- [ ] Technician có thể yêu cầu hủy từ các status hợp lệ
- [ ] Technician không thể yêu cầu hủy quá 2 lần
- [ ] SC Staff có thể chấp nhận yêu cầu hủy
- [ ] SC Staff có thể từ chối yêu cầu hủy và claim trả về status cũ
- [ ] SC Staff có thể trực tiếp hủy claim
- [ ] Status tự động chuyển từ CANCELED_PENDING sang CANCELED_READY_TO_HANDOVER
- [ ] SC Staff có thể xác nhận trả xe (CANCELED_DONE)
- [ ] SC Staff có thể mở lại claim từ CANCELED_READY_TO_HANDOVER
- [ ] Status history được lưu đầy đủ
- [ ] Validation đúng cho cả SC Repair và EVM Repair flows

