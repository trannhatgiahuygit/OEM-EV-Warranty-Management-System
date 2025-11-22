# 📖 Hướng Dẫn Đọc Code: EVM Repair & SC Repair Flows

## 🎯 Mục Đích

Document này hướng dẫn cách đọc và hiểu code của 2 luồng chính trong hệ thống:
- **EVM Repair Flow** (Luồng Bảo hành - EVM chi trả)
- **SC Repair Flow** (Luồng Sửa chữa - Khách hàng tự chi trả)

---

## 📋 Tổng Quan 2 Luồng

### EVM Repair Flow
- **Mục đích:** Xử lý các yêu cầu sửa chữa được bảo hành
- **Người chi trả:** EVM (Công ty)
- **Đặc điểm:**
  - Cần kiểm tra điều kiện bảo hành tự động
  - Cần EVM Staff phê duyệt
  - Sử dụng EVM Parts (linh kiện từ kho EVM)
  - Có warranty eligibility assessment

### SC Repair Flow
- **Mục đích:** Xử lý các yêu cầu sửa chữa khách hàng tự chi trả
- **Người chi trả:** Khách hàng
- **Đặc điểm:**
  - Không cần kiểm tra bảo hành
  - Không cần EVM approval
  - Sử dụng Third-Party Parts (linh kiện bên thứ 3)
  - Có Service Catalog Items (dịch vụ)
  - Có bước thanh toán của khách hàng

---

## 🗂️ Cấu Trúc File Chính

### 1. Entry Point - Tạo Claim Mới
**File:** `src/components/Dashboard/NewRepairClaimPage/NewRepairClaimPage.js`

**Vai trò:** Trang tạo claim mới, nơi SC Staff chọn `repairType`

**Key Functions:**
```javascript
// Line 466-529: handleSubmit - Tạo claim mới (intake)
const handleSubmit = async (e) => {
  // Validation: Kiểm tra khách hàng có xe chưa
  if (customerVehicles.length === 0 && formData.customerPhone) {
    toast.error('Khách hàng này chưa có xe đăng ký...');
    return;
  }
  
  // Tạo claim với repairType
  const claimData = {
    ...formData,
    repairType: 'EVM_REPAIR' hoặc 'SC_REPAIR' // Được chọn trong form
  };
  
  // API: POST /api/claims/intake
  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/api/claims/intake`,
    claimData
  );
}
```

**Cách đọc:**
1. Tìm form input `repairType` (radio buttons)
2. Xem validation logic (line 472-482)
3. Xem payload được gửi lên API (line 484-489)

---

### 2. Diagnostic Page - Trung Tâm Logic
**File:** `src/components/Dashboard/UpdateDiagnosticPage/UpdateDiagnosticPage.js`

**Vai trò:** Trang quan trọng nhất, xử lý logic khác biệt giữa 2 luồng

#### A. State Management (Line 22-92)

```javascript
// Line 33: Repair Type State
const [repairType, setRepairType] = useState('EVM_REPAIR');

// Line 34-36: Warranty Eligibility (chỉ cho EVM_REPAIR)
const [warrantyEligibilityAssessment, setWarrantyEligibilityAssessment] = useState('');
const [isWarrantyEligible, setIsWarrantyEligible] = useState(null);

// Line 46-53: Service Catalog (chủ yếu cho SC_REPAIR)
const [serviceCatalogItems, setServiceCatalogItems] = useState([]);
const [totalServiceCost, setTotalServiceCost] = useState(0);

// Line 55-62: Third Party Parts (chỉ cho SC_REPAIR)
const [thirdPartyParts, setThirdPartyParts] = useState([]);
```

**Cách đọc:**
- Tìm tất cả state variables liên quan đến `repairType`
- Xem logic conditional rendering dựa trên `repairType`

#### B. Load Claim Data (Line 104-270)

```javascript
// Line 172-183: Xác định repairType từ claim
if (isDoubleRejectedAndReopened) {
  setRepairType('SC_REPAIR'); // Force SC_REPAIR nếu bị reject 2 lần
} else {
  setRepairType(claimData.repairType || 'EVM_REPAIR');
}

// Line 215-232: Auto Warranty Check (chỉ cho EVM_REPAIR)
if (claimData.repairType === 'EVM_REPAIR' || !claimData.repairType) {
  performWarrantyCheck(claimData.vehicle);
}
```

**Cách đọc:**
1. Xem `useEffect` load claim (line 104)
2. Tìm logic set `repairType` (line 172-183)
3. Tìm auto warranty check (line 215-232)

#### C. Warranty Check Logic (Line 233-627)

```javascript
// Line 233-627: performWarrantyCheck function
const performWarrantyCheck = async (vehicle) => {
  // Chỉ chạy cho EVM_REPAIR
  if (!claim || repairType !== 'EVM_REPAIR') {
    return;
  }
  
  // Fetch warranty conditions
  const conditions = await axios.get(
    `${process.env.REACT_APP_API_URL}/api/warranty-conditions/effective?modelId=${vehicle.modelId}`
  );
  
  // Check: Thời hạn bảo hành, Quãng đường
  // Return: 'pass', 'fail', 'no_constraints'
}
```

**Cách đọc:**
1. Function này chỉ chạy khi `repairType === 'EVM_REPAIR'`
2. Kiểm tra điều kiện bảo hành dựa trên vehicle model
3. Set `warrantyCheckResult` và `warrantyCheckReasons`

#### D. Parts Management (Line 628-1200)

**EVM Parts (Line 628-900):**
```javascript
// Line 787: Filter parts theo vehicle type
if (repairType === 'EVM_REPAIR' && vehicleType && part.vehicleType) {
  return part.vehicleType === vehicleType;
}

// Line 808: Reserve EVM parts
if (part.partId && claim?.id && repairType === 'EVM_REPAIR') {
  await reserveEVMPart(part.partId, claim.id);
}
```

**Third-Party Parts (Line 900-1200):**
```javascript
// Line 932: Chỉ search third-party parts khi SC_REPAIR
if (repairType !== 'SC_REPAIR') {
  return; // Không search nếu không phải SC_REPAIR
}

// Line 1025: Search third-party parts với API
const response = await axios.get(
  `${process.env.REACT_APP_API_URL}/api/third-party-parts/service-center/${user.serviceCenterId}`,
  { params: { search: thirdPartyPartSearchQuery, vehicleType } }
);
```

**Cách đọc:**
1. Tìm conditional logic: `if (repairType === 'EVM_REPAIR')` vs `if (repairType === 'SC_REPAIR')`
2. EVM Parts: Từ kho EVM, có vehicle type filter
3. Third-Party Parts: Từ kho bên thứ 3, có giá cả, chỉ cho SC_REPAIR

#### E. Submit Diagnostic (Line 1597-1887)

```javascript
// Line 1597: handleSubmitDiagnostic
const handleSubmitDiagnostic = async (e) => {
  // Validation khác nhau cho 2 luồng
  if (repairType === 'EVM_REPAIR') {
    // Line 1628: Validate warranty eligibility
    if (!warrantyEligibilityAssessment || isWarrantyEligible === null) {
      toast.error('Vui lòng đánh giá điều kiện bảo hành...');
      return;
    }
  }
  
  if (repairType === 'SC_REPAIR') {
    // Line 1660: Validate service catalog hoặc third-party parts
    if (serviceCatalogItems.length === 0 && thirdPartyParts.length === 0) {
      toast.error('Vui lòng thêm dịch vụ hoặc phụ tùng...');
      return;
    }
  }
  
  // Line 1762-1808: Build payload khác nhau
  const payload = {
    repairType: repairType,
    
    // EVM_REPAIR: Warranty fields
    warrantyEligibilityAssessment: repairType === 'EVM_REPAIR' ? ... : null,
    isWarrantyEligible: repairType === 'EVM_REPAIR' ? ... : null,
    
    // SC_REPAIR: Cost fields
    totalServiceCost: repairType === 'SC_REPAIR' ? ... : null,
    totalThirdPartyPartsCost: repairType === 'SC_REPAIR' ? ... : null,
    totalEstimatedCost: repairType === 'SC_REPAIR' ? ... : null,
    
    // Parts khác nhau
    partsUsed: repairType === 'EVM_REPAIR' ? evmParts : thirdPartyParts,
    serviceCatalogItems: serviceCatalogItems
  };
  
  // API: PUT /api/claims/{claimId}/diagnostic
  await axios.put(
    `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/diagnostic`,
    payload
  );
}
```

**Cách đọc:**
1. Xem validation logic (line 1628-1687)
2. Xem payload building (line 1762-1808)
3. Payload khác nhau hoàn toàn giữa 2 luồng

#### F. UI Rendering (Line 1900-2899)

```javascript
// Line 1962-2027: Repair Type Selection
{/* Chỉ hiển thị khi claim chưa có repairType */}
{!claim?.repairType && (
  <>
    <input type="radio" value="EVM_REPAIR" />
    <input type="radio" value="SC_REPAIR" />
  </>
)}

// Line 2028-2560: Warranty Eligibility Section (chỉ EVM_REPAIR)
{repairType === 'EVM_REPAIR' && (
  <div>
    <label>Warranty Eligibility Assessment</label>
    <textarea value={warrantyEligibilityAssessment} />
    <select value={isWarrantyEligible}>
      <option value={true}>Yes</option>
      <option value={false}>No</option>
    </select>
  </div>
)}

// Line 2560-2800: Parts Section
{repairType === 'SC_REPAIR' ? (
  // Third-Party Parts UI với giá cả
  <div>
    <input placeholder="Tìm phụ tùng bên thứ 3..." />
    <input type="number" placeholder="Giá" />
  </div>
) : (
  // EVM Parts UI
  <div>
    <input placeholder="Tìm linh kiện EVM..." />
  </div>
)}

// Line 2789-2832: Service Catalog (chủ yếu SC_REPAIR)
{repairType === 'SC_REPAIR' && (
  <div>
    <input placeholder="Tìm dịch vụ..." />
    {/* Service items với giá */}
  </div>
)}
```

**Cách đọc:**
1. Tìm tất cả `{repairType === 'EVM_REPAIR' && ...}`
2. Tìm tất cả `{repairType === 'SC_REPAIR' && ...}`
3. Xem conditional rendering để hiểu UI khác nhau

---

### 3. Claim Detail Page - Điều Hướng Flow
**File:** `src/components/Dashboard/ClaimDetailPage/ClaimDetailPage.js`

**Vai trò:** Hiển thị thông tin claim và điều hướng các action

#### A. Display Repair Type (Line 926-929)

```javascript
// Line 926-929: Hiển thị repair type
{claim.repairType && (
  <DetailItem
    label="Loại Sửa chữa"
    value={claim.repairType === 'EVM_REPAIR' 
      ? 'EVM Repair (Bảo hành)' 
      : 'SC Repair (Khách hàng tự chi trả)'}
  />
)}
```

#### B. Cost Display (Line 968-1128)

```javascript
// Line 968-981: SC_REPAIR Cost Details
{claim.repairType === 'SC_REPAIR' && (
  <DetailCard title="Chi tiết Chi phí">
    {/* Service Catalog Items */}
    {/* Third Party Parts */}
    {/* Total Estimated Cost */}
  </DetailCard>
)}

// Line 1081-1028: EVM_REPAIR Cost Details
{claim.repairType === 'EVM_REPAIR' && (
  <DetailCard title="Chi tiết Chi phí">
    {/* Estimated Repair Cost */}
    {/* Warranty Cost */}
    {/* Company Paid Cost */}
  </DetailCard>
)}
```

#### C. Action Buttons (Line 1332-1577)

```javascript
// Line 1344-1361: EVM Approval (chỉ EVM_REPAIR)
{isEVMStaffAndPendingEVMApproval && (
  <>
    <button onClick={handleRejectClick}>Từ chối</button>
    <button onClick={handleApproveClick}>Phê duyệt</button>
  </>
)}

// Line 1415-1424: Payment Status (chỉ SC_REPAIR)
{isSCStaff && claim.status === 'CUSTOMER_PAYMENT_PENDING' && (
  <button onClick={() => handleUpdatePaymentStatus('PAID')}>
    Xác nhận Thanh toán
  </button>
)}
```

**Cách đọc:**
1. Tìm các button conditional rendering
2. Xem logic check status và repairType
3. Mỗi luồng có các action buttons khác nhau

---

### 4. EVM Approval Page
**File:** `src/components/Dashboard/EVMClaimActionModal/EVMClaimApprovePage.js`

**Vai trò:** EVM Staff phê duyệt claim (chỉ EVM_REPAIR)

**Key Logic:**
```javascript
// Approve claim với warranty cost
const handleApprove = async () => {
  const payload = {
    approvalNotes: formData.approvalNotes,
    warrantyCost: claim.warrantyCost, // Từ diagnostic
    approvalReason: formData.approvalReason,
    requiresPartsShipment: formData.requiresPartsShipment
  };
  
  // API: POST /api/evm/claims/{claimId}/approve
  await axios.post(
    `${process.env.REACT_APP_API_URL}/api/evm/claims/${claimId}/approve`,
    payload
  );
  
  // Status: PENDING_EVM_APPROVAL → EVM_APPROVED / READY_FOR_REPAIR
}
```

**Cách đọc:**
1. Chỉ áp dụng cho `repairType === 'EVM_REPAIR'`
2. Xem payload approval
3. Xem status transition sau approval

---

## 🔄 Status Flow Diagrams

### EVM Repair Flow Status Transitions

```
DRAFT 
  ↓ (SC Staff: Process to Intake)
INTAKE 
  ↓ (Technician: Submit Diagnostic)
PENDING_EVM_APPROVAL 
  ↓ (EVM Staff: Approve)
EVM_APPROVED / READY_FOR_REPAIR 
  ↓ (Technician: Work Done)
WORK_DONE / HANDOVER_PENDING 
  ↓ (SC Staff: Claim Done)
CLAIM_DONE
```

**Key Statuses:**
- `PENDING_EVM_APPROVAL`: Chờ EVM phê duyệt (chỉ EVM_REPAIR)
- `EVM_APPROVED`: Đã được EVM phê duyệt
- `READY_FOR_REPAIR`: Sẵn sàng sửa chữa

### SC Repair Flow Status Transitions

```
DRAFT 
  ↓ (SC Staff: Process to Intake)
INTAKE 
  ↓ (Technician: Submit Diagnostic)
CUSTOMER_PAYMENT_PENDING 
  ↓ (SC Staff: Confirm Payment)
CUSTOMER_PAID 
  ↓ (Technician: Work Done)
WORK_DONE / HANDOVER_PENDING 
  ↓ (SC Staff: Claim Done)
CLAIM_DONE
```

**Key Statuses:**
- `CUSTOMER_PAYMENT_PENDING`: Chờ khách hàng thanh toán (chỉ SC_REPAIR)
- `CUSTOMER_PAID`: Khách hàng đã thanh toán
- Không có `PENDING_EVM_APPROVAL` (không cần EVM approval)

---

## 🔍 Cách Trace Code Từng Bước

### Bước 1: Tạo Claim Mới

1. **Mở file:** `NewRepairClaimPage.js`
2. **Tìm form:** Line 850-1200 (form inputs)
3. **Tìm repairType selection:** Radio buttons cho EVM_REPAIR / SC_REPAIR
4. **Tìm submit handler:** `handleSubmit` (line 466)
5. **Xem API call:** Line 494-504
6. **Xem payload:** Line 484-489

### Bước 2: Diagnostic Submission

1. **Mở file:** `UpdateDiagnosticPage.js`
2. **Tìm load claim:** `useEffect` line 104
3. **Tìm repairType detection:** Line 172-183
4. **Tìm warranty check:** `performWarrantyCheck` line 233 (chỉ EVM_REPAIR)
5. **Tìm parts management:**
   - EVM Parts: Line 628-900
   - Third-Party Parts: Line 900-1200
6. **Tìm submit:** `handleSubmitDiagnostic` line 1597
7. **Xem payload building:** Line 1762-1808
8. **Xem API call:** Line 1810-1814

### Bước 3: EVM Approval (Chỉ EVM_REPAIR)

1. **Mở file:** `EVMClaimApprovePage.js`
2. **Tìm approve handler:** `handleApprove`
3. **Xem payload:** Approval notes, warranty cost
4. **Xem API call:** POST `/api/evm/claims/{id}/approve`
5. **Xem status transition:** PENDING_EVM_APPROVAL → EVM_APPROVED

### Bước 4: Payment (Chỉ SC_REPAIR)

1. **Mở file:** `ClaimDetailPage.js`
2. **Tìm payment button:** Line 1415-1424
3. **Tìm handler:** `handleUpdatePaymentStatus` line 328
4. **Xem API call:** PUT `/api/claims/{id}/payment-status`
5. **Xem status transition:** CUSTOMER_PAYMENT_PENDING → CUSTOMER_PAID

### Bước 5: Work Done

1. **Mở file:** `WorkDonePage.js`
2. **Tìm submit handler:** `handleSubmit` line 38
3. **Xem API call:** PUT `/api/claims/{id}/work-done`
4. **Xem status transition:** READY_FOR_REPAIR / CUSTOMER_PAID → WORK_DONE

### Bước 6: Claim Done

1. **Mở file:** `ClaimCompletePage.js`
2. **Tìm submit handler:** `handleSubmit`
3. **Xem API call:** PUT `/api/claims/{id}/claim-done`
4. **Xem status transition:** WORK_DONE → CLAIM_DONE

---

## 📊 So Sánh 2 Luồng

| Tính năng | EVM Repair | SC Repair |
|-----------|------------|-----------|
| **Warranty Check** | ✅ Tự động kiểm tra | ❌ Không có |
| **EVM Approval** | ✅ Cần phê duyệt | ❌ Không cần |
| **Parts Source** | EVM Parts (kho EVM) | Third-Party Parts (kho bên thứ 3) |
| **Service Catalog** | Có thể có | ✅ Bắt buộc có |
| **Payment Flow** | ❌ Không có | ✅ CUSTOMER_PAYMENT_PENDING → CUSTOMER_PAID |
| **Cost Fields** | warrantyCost, companyPaidCost | totalServiceCost, totalThirdPartyPartsCost, totalEstimatedCost |
| **Status Flow** | Có PENDING_EVM_APPROVAL | Có CUSTOMER_PAYMENT_PENDING |

---

## 🎯 Key Code Patterns

### Pattern 1: Conditional Logic Based on repairType

```javascript
// Luôn kiểm tra repairType trước khi thực hiện logic
if (repairType === 'EVM_REPAIR') {
  // EVM Repair logic
} else if (repairType === 'SC_REPAIR') {
  // SC Repair logic
}
```

**Nơi sử dụng:**
- `UpdateDiagnosticPage.js`: Line 1628, 1660, 1762-1808
- `ClaimDetailPage.js`: Line 926, 968, 1081

### Pattern 2: Conditional Rendering

```javascript
{repairType === 'EVM_REPAIR' && (
  <div>EVM Repair UI</div>
)}

{repairType === 'SC_REPAIR' && (
  <div>SC Repair UI</div>
)}
```

**Nơi sử dụng:**
- `UpdateDiagnosticPage.js`: Line 2028, 2560, 2789
- `ClaimDetailPage.js`: Line 968, 1081

### Pattern 3: Conditional Payload Building

```javascript
const payload = {
  repairType: repairType,
  // Conditional fields
  warrantyEligibilityAssessment: repairType === 'EVM_REPAIR' ? value : null,
  totalServiceCost: repairType === 'SC_REPAIR' ? value : null,
};
```

**Nơi sử dụng:**
- `UpdateDiagnosticPage.js`: Line 1762-1808

---

## 🔑 Key Functions to Understand

### 1. `performWarrantyCheck` (UpdateDiagnosticPage.js:233)
- **Mục đích:** Kiểm tra điều kiện bảo hành tự động
- **Chỉ chạy:** Khi `repairType === 'EVM_REPAIR'`
- **Input:** Vehicle object
- **Output:** `warrantyCheckResult` ('pass', 'fail', 'no_constraints')

### 2. `handleSubmitDiagnostic` (UpdateDiagnosticPage.js:1597)
- **Mục đích:** Submit diagnostic với payload khác nhau cho 2 luồng
- **Validation:** Khác nhau cho EVM_REPAIR vs SC_REPAIR
- **Payload:** Khác nhau hoàn toàn

### 3. `autoAssignSerialParts` (ClaimDetailPage.js:425)
- **Mục đích:** Tự động gắn serial parts khi work order = DONE
- **Áp dụng:** Cả 2 luồng
- **Logic:** Tự động gán parts vào vehicle và update status

---

## 📝 Checklist Đọc Code

### ✅ EVM Repair Flow
- [ ] Hiểu cách `repairType` được set trong NewRepairClaimPage
- [ ] Hiểu `performWarrantyCheck` logic
- [ ] Hiểu EVM Parts reservation và release
- [ ] Hiểu warranty eligibility assessment
- [ ] Hiểu EVM approval process
- [ ] Hiểu status flow: DRAFT → INTAKE → PENDING_EVM_APPROVAL → EVM_APPROVED → WORK_DONE → CLAIM_DONE

### ✅ SC Repair Flow
- [ ] Hiểu cách `repairType` được set
- [ ] Hiểu Third-Party Parts search và selection
- [ ] Hiểu Service Catalog Items
- [ ] Hiểu payment flow (CUSTOMER_PAYMENT_PENDING → CUSTOMER_PAID)
- [ ] Hiểu cost calculation (totalServiceCost + totalThirdPartyPartsCost)
- [ ] Hiểu status flow: DRAFT → INTAKE → CUSTOMER_PAYMENT_PENDING → CUSTOMER_PAID → WORK_DONE → CLAIM_DONE

### ✅ Common Logic
- [ ] Hiểu auto-assign serial parts khi work order = DONE
- [ ] Hiểu work done process
- [ ] Hiểu claim done process
- [ ] Hiểu serial parts assignment

---

## 🎤 Tips Thuyết Trình

### 1. Bắt đầu với Entry Point
- Show `NewRepairClaimPage.js` - nơi user chọn repairType
- Giải thích: "Đây là điểm bắt đầu, user chọn EVM_REPAIR hoặc SC_REPAIR"

### 2. Show Diagnostic Page Logic
- Highlight conditional logic: `if (repairType === 'EVM_REPAIR')`
- Show warranty check (chỉ EVM_REPAIR)
- Show parts management khác nhau

### 3. Show Status Flow
- Vẽ sơ đồ status transitions
- Giải thích sự khác biệt: EVM có PENDING_EVM_APPROVAL, SC có CUSTOMER_PAYMENT_PENDING

### 4. Show Code Examples
- Copy-paste code snippets quan trọng
- Highlight conditional rendering
- Show payload differences

### 5. Demo Live (nếu có thể)
- Mở DevTools
- Show Network tab khi submit diagnostic
- Show payload khác nhau giữa 2 luồng

---

## 📚 Files Tham Khảo

### Core Files
1. `NewRepairClaimPage.js` - Entry point
2. `UpdateDiagnosticPage.js` - Core logic (quan trọng nhất)
3. `ClaimDetailPage.js` - Display và navigation
4. `EVMClaimApprovePage.js` - EVM approval
5. `WorkDonePage.js` - Work done
6. `ClaimCompletePage.js` - Claim done

### Supporting Files
1. `serialPartsService.js` - Serial parts management
2. `EVMClaimManagementPage.js` - EVM claim list
3. `ClaimManagementPage.js` - SC claim list

---

## 🎯 Kết Luận

**Điểm quan trọng nhất:**
- **`repairType`** là key variable quyết định toàn bộ flow
- Tất cả logic conditional đều dựa trên `repairType`
- `UpdateDiagnosticPage.js` là file quan trọng nhất, chứa hầu hết logic khác biệt

**Cách đọc hiệu quả:**
1. Bắt đầu từ `NewRepairClaimPage.js` để hiểu entry point
2. Đọc `UpdateDiagnosticPage.js` để hiểu core logic
3. Trace theo status flow để hiểu từng bước
4. So sánh code giữa 2 luồng để thấy sự khác biệt

Chúc thuyết trình thành công! 🎉

