# 📋 Phân Tích Quy Trình Xử Lý Bảo Hành - Cải Tiến

## 🎯 Mục Tiêu
Đánh giá và cải tiến quy trình xử lý claim sau khi EVM phê duyệt/từ chối, đảm bảo xử lý các vấn đề phát sinh (thiếu linh kiện, xung đột, v.v.)

---

## 📊 Phân Tích Logic Quy Trình Hiện Tại vs. Đề Xuất

### ✅ **ĐIỂM MẠNH CỦA ĐỀ XUẤT**

#### 1. **Quy trình xử lý vấn đề sau EVM Approval**
- ✅ **Logic rõ ràng**: Technician có thể báo cáo vấn đề (PROBLEM_CONFLICT) thay vì bị kẹt
- ✅ **Two-way communication**: EVM giải quyết → Technician xác nhận (PROBLEM_SOLVED)
- ✅ **Chu trình lặp**: Cho phép nhiều vòng xử lý vấn đề cho đến khi giải quyết xong

#### 2. **Xử lý EVM Rejection**
- ✅ **Cho phép resubmit 1 lần**: Hợp lý để xử lý lỗi nhập liệu/thiếu thông tin
- ✅ **Giới hạn resubmit**: Tránh spam và lạm dụng hệ thống
- ✅ **Fallback option**: Có lối thoát (third-party repair hoặc delete claim)

#### 3. **Trạng thái rõ ràng**
- ✅ **Status lifecycle**: EVM_APPROVED → PROBLEM_CONFLICT → PROBLEM_SOLVED → READY_FOR_REPAIR
- ✅ **Audit trail**: Mỗi thay đổi status có mô tả lý do

---

### ⚠️ **CÁC VẤN ĐỀ CẦN BỔ SUNG**

#### 1. **Status Naming & Database Schema**

**Vấn đề hiện tại:**
```sql
-- Trong data.sql chưa có:
('PROBLEM_CONFLICT', 'Problem Conflict'),
('PROBLEM_SOLVED', 'Problem Solved'),
('EVM_APPROVAL_PENDING_RESUBMIT', 'Pending Resubmit After Rejection'),
```

**❌ Thiếu:**
- Status `PROBLEM_CONFLICT` để đánh dấu claim có vấn đề
- Status `PROBLEM_SOLVED` để đánh dấu EVM đã xử lý
- Tracking số lần submit/reject (resubmit_count)

**✅ Giải pháp:**
```sql
-- Thêm statuses mới
INSERT INTO claim_statuses (code, label) VALUES
    ('PROBLEM_CONFLICT', 'Problem Conflict - Awaiting EVM Resolution'),
    ('PROBLEM_SOLVED', 'Problem Solved - Ready to Continue'),
    ('PENDING_RESUBMIT', 'Pending Resubmit After Rejection');

-- Thêm cột tracking cho Claim entity
ALTER TABLE claims ADD COLUMN resubmit_count INT DEFAULT 0;
ALTER TABLE claims ADD COLUMN rejection_reason TEXT;
ALTER TABLE claims ADD COLUMN problem_description TEXT;
```

---

#### 2. **Role-Based Actions - Thiếu Ràng Buộc Rõ Ràng**

**Vấn đề:**
- Chưa rõ ai được phép chuyển claim sang trạng thái nào
- Thiếu validation chặt chẽ

**✅ Giải pháp - State Machine:**

| **Từ Status** | **Đến Status** | **Role** | **Điều kiện** |
|--------------|---------------|---------|--------------|
| EVM_APPROVED | PROBLEM_CONFLICT | SC_TECHNICIAN | Mô tả vấn đề bắt buộc |
| EVM_APPROVED | READY_FOR_REPAIR | SC_TECHNICIAN | Không có vấn đề |
| PROBLEM_CONFLICT | PROBLEM_SOLVED | EVM_STAFF | Giải pháp bắt buộc |
| PROBLEM_SOLVED | READY_FOR_REPAIR | SC_TECHNICIAN | Xác nhận OK |
| PROBLEM_SOLVED | PROBLEM_CONFLICT | SC_TECHNICIAN | Vẫn còn vấn đề khác |
| EVM_REJECTED | PENDING_RESUBMIT | SC_TECHNICIAN | resubmit_count < 1 |
| EVM_REJECTED | INACTIVE | SC_TECHNICIAN | resubmit_count >= 1 hoặc chọn xóa |

---

#### 3. **Thiếu Mô Tả Chi Tiết Vấn đề**

**Vấn đề hiện tại:**
- Chỉ có status code, không có mô tả cụ thể
- EVM không biết technician gặp vấn đề gì

**✅ Giải pháp - Thêm DTO mới:**

```java
// ProblemReportRequest.java
public class ProblemReportRequest {
    private Integer claimId;
    
    @NotBlank
    private String problemType; // PARTS_SHORTAGE, WRONG_DIAGNOSIS, CUSTOMER_ISSUE, OTHER
    
    @NotBlank
    @Size(min = 10, max = 1000)
    private String problemDescription;
    
    private List<String> missingPartSerials; // Nếu thiếu linh kiện
    
    private Integer estimatedResolutionDays;
}

// ProblemResolutionRequest.java
public class ProblemResolutionRequest {
    private Integer claimId;
    
    @NotBlank
    private String resolutionAction; // PARTS_SHIPPED, APPROVED_ALTERNATIVE, CUSTOMER_CONTACTED
    
    @NotBlank
    private String resolutionNotes;
    
    private String trackingNumber; // Nếu gửi linh kiện
    private LocalDate estimatedArrival;
}
```

---

#### 4. **Workflow Loop Protection**

**Vấn đề:**
- Có thể lặp vô hạn PROBLEM_CONFLICT ↔ PROBLEM_SOLVED
- Thiếu giới hạn số lần report vấn đề

**✅ Giải pháp:**

```java
// Trong ClaimServiceImpl
public ClaimResponseDto reportProblem(Integer claimId, ProblemReportRequest request) {
    Claim claim = findClaimById(claimId);
    
    // ⚠️ Giới hạn số lần report vấn đề
    int problemCount = claimStatusHistoryRepository
        .countByClaimIdAndStatusCode(claimId, "PROBLEM_CONFLICT");
    
    if (problemCount >= 5) {
        throw new BadRequestException(
            "Quá nhiều vấn đề phát sinh (" + problemCount + " lần). " +
            "Vui lòng liên hệ supervisor hoặc chuyển sang third-party repair."
        );
    }
    
    // ... rest of logic
}
```

---

#### 5. **Thiếu Notification System**

**Vấn đề:**
- EVM không tự động biết khi technician report vấn đề
- Technician không biết khi EVM đã giải quyết

**✅ Giải pháp:**

```java
// Trong reportProblem()
notificationService.notifyEvmStaffAboutProblem(claim, request.getProblemDescription());

// Trong resolveProblem()
notificationService.notifyTechnicianAboutResolution(claim, request.getResolutionNotes());
```

---

## 🔄 **QUY TRÌNH HOÀN CHỈNH - STATE DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLAIM LIFECYCLE AFTER EVM REVIEW                 │
└─────────────────────────────────────────────────────────────────────┘

                           ┌──────────────┐
                           │ PENDING_EVM  │
                           │  _APPROVAL   │
                           └──────┬───────┘
                                  │
                     ┌────────────┴────────────┐
                     │   EVM REVIEW DECISION   │
                     └────────────┬────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
              ▼                                       ▼
     ┌────────────────┐                      ┌────────────────┐
     │  EVM_APPROVED  │                      │ EVM_REJECTED   │
     └────────┬───────┘                      └────────┬───────┘
              │                                       │
              │ [Technician Decision]                 │ [resubmit_count < 1?]
              │                                       │
     ┌────────┴──────────┐                   ┌────────┴──────────┐
     │                   │                   │                   │
     ▼                   ▼                   ▼                   ▼
┌─────────┐      ┌──────────────┐    ┌──────────────┐   ┌──────────┐
│NO ISSUE │      │PROBLEM       │    │PENDING       │   │INACTIVE  │
│         │      │CONFLICT      │    │RESUBMIT      │   │(Delete)  │
└────┬────┘      └──────┬───────┘    └──────┬───────┘   └──────────┘
     │                  │                    │
     │                  │ [EVM Resolves]     │ [Edit & Resubmit]
     │                  ▼                    │
     │           ┌──────────────┐            │
     │           │PROBLEM       │            │
     │           │SOLVED        │            │
     │           └──────┬───────┘            │
     │                  │                    │
     │      ┌───────────┴──────────┐         │
     │      │                      │         │
     │      ▼                      ▼         │
     │  ┌──────┐          ┌──────────────┐  │
     │  │ OK   │          │PROBLEM       │  │
     │  └──┬───┘          │CONFLICT      │  │
     │     │              │(New Issue)   │  │
     │     │              └──────┬───────┘  │
     │     │                     │          │
     │     │              [Loop max 5x]    │
     │     │                     │          │
     ▼     ▼                     ▼          ▼
┌──────────────────────────────────────────────┐
│         READY_FOR_REPAIR                     │
│  (Create Work Order & Continue Workflow)     │
└──────────────────────────────────────────────┘
```

---

## 🛠️ **CÁC API ENDPOINTS CẦN BỔ SUNG**

### 1. **Technician Report Problem**
```http
POST /api/claims/{claimId}/report-problem
Authorization: Bearer {tech_token}
Content-Type: application/json

{
  "problemType": "PARTS_SHORTAGE",
  "problemDescription": "Thiếu pin serial BAT001-2024-XXX, kho không có sẵn",
  "missingPartSerials": ["BAT001-2024-XXX"],
  "estimatedResolutionDays": 5
}

Response: 200 OK
{
  "id": 123,
  "claimNumber": "CLM-2024-001",
  "status": "PROBLEM_CONFLICT",
  "problemDescription": "...",
  "message": "Problem reported. EVM staff notified."
}
```

### 2. **EVM Resolve Problem**
```http
POST /api/evm/claims/{claimId}/resolve-problem
Authorization: Bearer {evm_token}
Content-Type: application/json

{
  "resolutionAction": "PARTS_SHIPPED",
  "resolutionNotes": "Đã gửi pin BAT001-2024-009 qua DHL",
  "trackingNumber": "DHL123456789",
  "estimatedArrival": "2024-11-10"
}

Response: 200 OK
{
  "status": "PROBLEM_SOLVED",
  "resolutionNotes": "...",
  "message": "Problem resolved. Technician notified."
}
```

### 3. **Technician Confirm Resolution**
```http
POST /api/claims/{claimId}/confirm-resolution
Authorization: Bearer {tech_token}
Content-Type: application/json

{
  "confirmed": true,
  "nextAction": "READY_FOR_REPAIR" // or "REPORT_NEW_PROBLEM"
}

Response: 200 OK
{
  "status": "READY_FOR_REPAIR",
  "message": "Ready to create work order"
}
```

### 4. **Resubmit After Rejection**
```http
POST /api/claims/{claimId}/resubmit
Authorization: Bearer {tech_token}
Content-Type: application/json

{
  "revisedDiagnostic": "Cập nhật chẩn đoán chi tiết hơn...",
  "additionalEvidence": ["photo1.jpg", "diagnostic_log.pdf"],
  "responseToRejection": "Đã bổ sung thêm test results theo yêu cầu EVM"
}

Response: 200 OK
{
  "status": "PENDING_EVM_APPROVAL",
  "resubmitCount": 1,
  "message": "Claim resubmitted for EVM review"
}
```

---

## 📝 **VALIDATION RULES**

### Rule 1: Problem Reporting
- ✅ Chỉ status `EVM_APPROVED` mới report được vấn đề
- ✅ Mô tả vấn đề tối thiểu 10 ký tự
- ✅ Maximum 5 lần report vấn đề cho 1 claim
- ✅ Phải là assigned technician hoặc SC_STAFF

### Rule 2: Problem Resolution
- ✅ Chỉ EVM_STAFF mới resolve được
- ✅ Phải có resolutionNotes
- ✅ Nếu gửi parts → bắt buộc trackingNumber

### Rule 3: Resubmit
- ✅ Chỉ resubmit được 1 lần
- ✅ Phải có responseToRejection
- ✅ Không được resubmit nếu claim đã INACTIVE

### Rule 4: Transition to READY_FOR_REPAIR
- ✅ Từ `EVM_APPROVED`: Không có vấn đề
- ✅ Từ `PROBLEM_SOLVED`: Technician xác nhận OK
- ✅ Không được skip workflow

---

## 🎭 **TEST SCENARIOS**

### Scenario 1: Happy Path (No Problem)
```
PENDING_EVM_APPROVAL 
  → (EVM Approve) 
  → EVM_APPROVED 
  → (Tech: No issue) 
  → READY_FOR_REPAIR 
  → Create WO
```

### Scenario 2: Parts Shortage
```
EVM_APPROVED 
  → (Tech: Report "Thiếu pin") 
  → PROBLEM_CONFLICT 
  → (EVM: Ship parts) 
  → PROBLEM_SOLVED 
  → (Tech: Confirm OK) 
  → READY_FOR_REPAIR
```

### Scenario 3: Multiple Issues
```
EVM_APPROVED 
  → PROBLEM_CONFLICT (Issue #1: Thiếu pin)
  → PROBLEM_SOLVED 
  → PROBLEM_CONFLICT (Issue #2: Customer không đồng ý)
  → PROBLEM_SOLVED 
  → READY_FOR_REPAIR
```

### Scenario 4: Rejection & Resubmit
```
PENDING_EVM_APPROVAL 
  → (EVM Reject: "Thiếu evidence") 
  → EVM_REJECTED 
  → (Tech: Resubmit với evidence) 
  → PENDING_EVM_APPROVAL 
  → (EVM Approve) 
  → EVM_APPROVED
```

### Scenario 5: Double Rejection → Inactive
```
PENDING_EVM_APPROVAL 
  → EVM_REJECTED (resubmit_count = 0)
  → (Tech: Resubmit) 
  → PENDING_EVM_APPROVAL 
  → EVM_REJECTED (resubmit_count = 1)
  → (Tech: Delete hoặc Third-party repair) 
  → INACTIVE
```

---

## 🔒 **SECURITY CONSIDERATIONS**

1. **Authorization Matrix**:
   ```
   Action                     | SC_TECH | SC_STAFF | EVM_STAFF | ADMIN
   ─────────────────────────────────────────────────────────────────────
   Report Problem            |    ✅    |    ✅     |    ❌     |  ✅
   Resolve Problem           |    ❌    |    ❌     |    ✅     |  ✅
   Resubmit Claim            |    ✅    |    ✅     |    ❌     |  ✅
   Move to READY_FOR_REPAIR  |    ✅    |    ✅     |    ❌     |  ✅
   Delete Claim (INACTIVE)   |    ❌    |    ✅     |    ❌     |  ✅
   ```

2. **Audit Trail**: Mọi thay đổi status phải ghi vào `claim_status_history`

3. **Notification**: Email/SMS tự động khi:
   - Technician report problem → Notify EVM team
   - EVM resolve problem → Notify Technician
   - Claim rejected → Notify Technician & SC Manager

---

## ✅ **KẾT LUẬN**

### **Logic của bạn là ĐÚNG và RẤT TỐT**, chỉ cần bổ sung:

1. ✅ **Database schema**: Thêm statuses mới + tracking columns
2. ✅ **DTOs mới**: ProblemReportRequest, ProblemResolutionRequest
3. ✅ **API endpoints**: 4 endpoints như đã mô tả
4. ✅ **Validation rules**: Giới hạn loops, kiểm tra resubmit count
5. ✅ **Notification system**: Tự động thông báo giữa Tech ↔ EVM
6. ✅ **Postman tests**: Thêm test cases cho các scenarios

### **Ưu điểm của quy trình này:**
- 🎯 Realistic: Phản ánh đúng thực tế quy trình bảo hành
- 🔄 Flexible: Cho phép xử lý nhiều tình huống phát sinh
- 🛡️ Safe: Có giới hạn để tránh lạm dụng
- 📊 Trackable: Đầy đủ audit trail

### **Điểm cần lưu ý:**
- ⚠️ Training users: Phải train kỹ cho technician và EVM staff
- ⚠️ Performance: Monitor số lượng claims bị stuck ở PROBLEM_CONFLICT
- ⚠️ Metrics: Track average resolution time cho các problem types

---

## 📦 **NEXT STEPS**

1. ✅ Review tài liệu này
2. ✅ Implement database changes
3. ✅ Code new DTOs & endpoints
4. ✅ Update Postman test flow
5. ✅ Test thoroughly
6. ✅ Deploy & monitor

**Tôi sẽ cập nhật Postman test flow ngay sau đây!** 🚀

