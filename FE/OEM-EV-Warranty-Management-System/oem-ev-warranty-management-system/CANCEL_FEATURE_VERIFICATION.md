# Cancel Feature - Frontend Verification Checklist

## ✅ Components Created

- [x] `CancelRequestForm.js` - Form cho Technician yêu cầu hủy
- [x] `CancelRequestForm.css` - Styling cho CancelRequestForm
- [x] `CancelConfirmForm.js` - Form cho SC Staff xử lý yêu cầu hủy
- [x] `CancelConfirmForm.css` - Styling cho CancelConfirmForm
- [x] `CancelDirectForm.js` - Form cho SC Staff trực tiếp hủy
- [x] `CancelDirectForm.css` - Styling cho CancelDirectForm

## ✅ Integration in ClaimDetailPage

- [x] Imports đã được thêm đúng
- [x] State variables cho các forms:
  - `showCancelRequestForm`
  - `showCancelConfirmForm`
  - `showCancelDirectForm`
- [x] Handlers đã được implement:
  - `handleCancelRequestSuccess`
  - `handleConfirmCanceledHandover`
  - `handleReopenCanceledClaim`

## ✅ API Endpoints Integration

### 1. POST `/api/claims/{claimId}/cancel-request`
- [x] Request body: `{ reason: string }`
- [x] Headers: Authorization Bearer token
- [x] Success handling: Toast message + refetch claim
- [x] Error handling: Display error message from backend

### 2. POST `/api/claims/{claimId}/cancel-approve`
- [x] Request body: `{}` (empty hoặc có thể có note)
- [x] Headers: Authorization Bearer token
- [x] Success handling: Toast message + refetch claim
- [x] Error handling: Display error message from backend

### 3. POST `/api/claims/{claimId}/cancel-reject`
- [x] Request body: `{ reason: string }`
- [x] Headers: Authorization Bearer token
- [x] Success handling: Toast message + refetch claim
- [x] Error handling: Display error message from backend

### 4. POST `/api/claims/{claimId}/cancel-direct`
- [x] Request body: `{ reason: string }`
- [x] Headers: Authorization Bearer token
- [x] Success handling: Toast message + refetch claim
- [x] Error handling: Display error message from backend

### 5. PUT `/api/claims/{claimId}/status`
- [x] Request body: `{ status: 'CANCELED_DONE' }` hoặc `{ status: 'OPEN' }`
- [x] Headers: Authorization Bearer token
- [x] Success handling: Toast message + refetch claim
- [x] Error handling: Display error message from backend

## ✅ Conditional Logic

### Technician Cancel Request Button
- [x] Chỉ hiển thị khi:
  - User là `SC_TECHNICIAN`
  - Claim có `assignedTechnician.id === userId`
  - Status hợp lệ:
    - SC_REPAIR: `OPEN`, `IN_PROGRESS`, `PENDING_APPROVAL`, `CUSTOMER_PAYMENT_PENDING`
    - EVM_REPAIR: `OPEN`, `IN_PROGRESS`, `PENDING_APPROVAL`
  - `cancelRequestCount < 2`

### SC Staff Cancel Confirm Button (CANCEL_PENDING)
- [x] Chỉ hiển thị khi:
  - User là `SC_STAFF`
  - Claim status = `CANCEL_PENDING`

### SC Staff Direct Cancel Button
- [x] Chỉ hiển thị khi:
  - User là `SC_STAFF`
  - Status hợp lệ:
    - SC_REPAIR: `OPEN`, `IN_PROGRESS`, `PENDING_APPROVAL`, `CUSTOMER_PAYMENT_PENDING`
    - EVM_REPAIR: `OPEN`, `IN_PROGRESS`, `PENDING_APPROVAL`

### Canceled Ready to Handover Actions
- [x] Chỉ hiển thị khi:
  - User là `SC_STAFF`
  - Claim status = `CANCELED_READY_TO_HANDOVER`
- [x] Có 2 buttons:
  - "Xác nhận Trả xe" → `CANCELED_DONE`
  - "Mở lại Yêu cầu" → `OPEN`

## ✅ Status Display

- [x] `getStatusName` đã được cập nhật trong:
  - `EVMClaimManagementPage.js`
  - `TechnicianClaimManagementPage.js`
  - `ClaimManagementPage.js`
- [x] Status badges CSS đã được thêm trong:
  - `ClaimDetailPage.css`
  - `EVMClaimManagementPage.css`
  - `ClaimManagementPage.css`

## ✅ Form Validation

### CancelRequestForm
- [x] Reason field required
- [x] Max length: 1000 characters
- [x] Character counter hiển thị
- [x] Submit button disabled khi reason empty
- [x] Submit button disabled khi đang submit

### CancelConfirmForm
- [x] Reject reason required khi chọn "Từ chối"
- [x] Max length: 500 characters
- [x] Character counter hiển thị
- [x] Radio buttons cho approve/reject
- [x] Submit button disabled khi đang submit

### CancelDirectForm
- [x] Reason field required
- [x] Max length: 1000 characters
- [x] Character counter hiển thị
- [x] Submit button disabled khi reason empty
- [x] Submit button disabled khi đang submit

## ✅ Error Handling

- [x] Tất cả API calls có try-catch
- [x] Error messages hiển thị từ backend response
- [x] Fallback error messages nếu backend không trả về message
- [x] Loading states được quản lý đúng
- [x] Forms không bị submit nhiều lần

## ✅ UI/UX

- [x] Modal overlays với click outside để đóng
- [x] Close button (×) trong modal header
- [x] Loading states ("Đang gửi...", "Đang xử lý...")
- [x] Success toast messages
- [x] Error toast messages
- [x] Form fields có placeholder text
- [x] Warning messages trong forms
- [x] Character counters
- [x] Disabled states cho buttons

## ✅ Data Flow

- [x] Sau khi submit thành công, claim được refetch
- [x] Forms tự động đóng sau khi submit thành công
- [x] State được reset đúng cách
- [x] UI cập nhật sau khi claim status thay đổi

## 🔍 Edge Cases to Test

### 1. Technician Cancel Request
- [ ] Technician yêu cầu hủy lần 1 → Status = CANCEL_PENDING
- [ ] Technician yêu cầu hủy lần 2 → Status = CANCEL_PENDING
- [ ] Technician yêu cầu hủy lần 3 → Button không hiển thị (cancelRequestCount >= 2)
- [ ] Technician không phải assigned technician → Button không hiển thị
- [ ] Claim status không hợp lệ → Button không hiển thị

### 2. SC Staff Process Cancel Request
- [ ] SC Staff chấp nhận hủy → Status = CANCELED_READY_TO_HANDOVER
- [ ] SC Staff từ chối hủy → Status trả về status trước đó
- [ ] SC Staff không phải SC_STAFF → Button không hiển thị
- [ ] Claim status không phải CANCEL_PENDING → Button không hiển thị

### 3. SC Staff Direct Cancel
- [ ] SC Staff trực tiếp hủy → Status = CANCELED_READY_TO_HANDOVER
- [ ] SC Staff không phải SC_STAFF → Button không hiển thị
- [ ] Claim status không hợp lệ → Button không hiển thị

### 4. Canceled Ready to Handover
- [ ] SC Staff xác nhận trả xe → Status = CANCELED_DONE
- [ ] SC Staff mở lại yêu cầu → Status = OPEN
- [ ] User không phải SC_STAFF → Buttons không hiển thị
- [ ] Claim status không phải CANCELED_READY_TO_HANDOVER → Buttons không hiển thị

### 5. API Error Handling
- [ ] Backend trả về 400 (Bad Request) → Error message hiển thị
- [ ] Backend trả về 403 (Forbidden) → Error message hiển thị
- [ ] Backend trả về 404 (Not Found) → Error message hiển thị
- [ ] Network error → Error message hiển thị
- [ ] Backend trả về 500 (Server Error) → Error message hiển thị

### 6. Form Validation
- [ ] Submit form với reason empty → Validation error
- [ ] Submit form với reason quá dài → Validation error (nếu có)
- [ ] Submit form nhiều lần → Chỉ submit 1 lần (disabled state)

## 📝 Notes

### Backend Requirements
- Backend cần trả về các fields sau trong claim object:
  - `cancelRequestReason`: string | null
  - `cancelRequestCount`: number (default: 0)
  - `previousStatus`: string | null (để rollback khi reject)

### Status Transitions
1. **Technician Request Cancel:**
   - `OPEN/IN_PROGRESS/PENDING_APPROVAL` → `CANCEL_PENDING`
   - `cancelRequestCount` tăng lên 1
   - `previousStatus` lưu status hiện tại

2. **SC Staff Approve Cancel:**
   - `CANCEL_PENDING` → `CANCELED_PENDING` → `CANCELED_READY_TO_HANDOVER` (tự động)

3. **SC Staff Reject Cancel:**
   - `CANCEL_PENDING` → `previousStatus`
   - `cancelRequestReason` được clear
   - `cancelRequestCount` không giảm

4. **SC Staff Direct Cancel:**
   - `OPEN/IN_PROGRESS/PENDING_APPROVAL` → `CANCELED_PENDING` → `CANCELED_READY_TO_HANDOVER` (tự động)

5. **Confirm Handover:**
   - `CANCELED_READY_TO_HANDOVER` → `CANCELED_DONE`

6. **Reopen Claim:**
   - `CANCELED_READY_TO_HANDOVER` → `OPEN`

## 🚀 Ready for Testing

Frontend implementation đã hoàn tất và sẵn sàng để test với backend. Tất cả các components, handlers, và logic điều kiện đã được implement đầy đủ.

