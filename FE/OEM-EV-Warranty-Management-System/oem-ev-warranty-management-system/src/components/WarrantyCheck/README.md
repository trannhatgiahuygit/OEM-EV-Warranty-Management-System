# Tính năng Kiểm tra Bảo hành Tự động (Warranty Check)

## Tổng quan

Tính năng này implement luồng kiểm tra điều kiện bảo hành tự động cho hệ thống EVM Warranty Management. Bao gồm:

1. **Kiểm tra bảo hành tự động** dựa trên thông tin xe và điều kiện bảo hành
2. **Form sửa chữa thông minh** với khả năng disable/collapse khi xe không đủ điều kiện
3. **Manual override** với checkbox xác nhận bắt buộc
4. **Bảng quản lý claim** tích hợp kiểm tra bảo hành tự động

## Cấu trúc File

```
src/
├── services/
│   └── warrantyService.js                    # Service API cho warranty
├── components/
│   ├── WarrantyCheck/
│   │   ├── index.js                          # Export component
│   │   ├── WarrantyCheckComponent.js         # Component chính
│   │   └── WarrantyCheckComponent.css        # Styles
│   └── Dashboard/
│       ├── EVMRepairForm/
│       │   ├── index.js                      # Export component
│       │   ├── EVMRepairForm.js              # Form sửa chữa enhanced
│       │   └── EVMRepairForm.css             # Styles
│       ├── EVMClaimTable/
│       │   ├── index.js                      # Export component
│       │   ├── EVMClaimTable.js              # Bảng claim enhanced
│       │   └── EVMClaimTable.css             # Styles
│       └── ExampleWarrantyPage/
│           └── ExampleWarrantyPage.js        # Demo page
```

## Luồng Hoạt động

### 1. EVM Staff tạo Model Xe
```javascript
// EVM staff set thông tin bảo hành cho model xe
const vehicleModel = {
  id: "MODEL001",
  name: "Tesla Model Y",
  warrantyConditions: {
    maxMileage: 100000,           // Số km tối đa
    warrantyPeriodMonths: 36,     // Thời hạn bảo hành (tháng)
  }
}
```

### 2. SC Staff tạo Xe
```javascript
// SC staff tạo xe sử dụng model đã có
const vehicle = {
  id: "VEH001",
  modelId: "MODEL001",
  vin: "1FTFW1ET5DFC12345",
  manufactureDate: "2023-01-15",
  warrantyStartDate: "2023-02-01",
  currentMileage: 25000
}
```

### 3. Technician sử dụng Form
- Khi technician vào trang chi tiết yêu cầu
- Hệ thống tự động chạy kiểm tra điều kiện bảo hành
- Hiển thị kết quả và điều chỉnh form theo điều kiện

## Cách Sử dụng

### 1. Warranty Check Component

```javascript
import { WarrantyCheckComponent } from '../components/WarrantyCheck';

function MyPage() {
  const handleWarrantyResult = (result) => {
    console.log('Warranty check result:', result);
    // result.isEligible - boolean
    // result.reasons - array of strings
    // result.vehicleInfo - object
  };

  return (
    <WarrantyCheckComponent
      vehicleId="VEH001"
      onCheckComplete={handleWarrantyResult}
      autoCheck={true}  // Tự động check khi mount
    />
  );
}
```

### 2. EVM Repair Form

```javascript
import { EVMRepairForm } from '../components/Dashboard/EVMRepairForm';

function RepairPage() {
  const handleFormSubmit = async (formData) => {
    // formData chứa:
    // - Thông tin sửa chữa
    // - warrantyCheckResult
    // - manualOverride
    // - confirmationChecked
    
    await submitRepairClaim(formData);
  };

  return (
    <EVMRepairForm
      vehicleId="VEH001"
      onSubmit={handleFormSubmit}
      initialData={{}}  // Optional initial data
    />
  );
}
```

### 3. EVM Claim Table

```javascript
import { EVMClaimTable } from '../components/Dashboard/EVMClaimTable';

function ClaimManagementPage() {
  const handleClaimAction = (claim, action) => {
    switch (action) {
      case 'view':
        // Xem chi tiết
        break;
      case 'approve':
        // Phê duyệt
        break;
      case 'reject':
        // Từ chối
        break;
    }
  };

  return (
    <EVMClaimTable
      claims={claims}
      onClaimSelect={handleClaimAction}
      loading={false}
    />
  );
}
```

## API Endpoints

### Kiểm tra Bảo hành
```
POST /api/warranty/check
Content-Type: application/json
Authorization: Bearer <token>

{
  "vehicleId": "VEH001",
  "claimDate": "2024-11-13T10:00:00.000Z"
}

Response:
{
  "isEligible": false,
  "reasons": [
    "Số km vượt quá giới hạn bảo hành (105000 km > 100000 km)"
  ],
  "checkedAt": "2024-11-13T10:00:00.000Z",
  "vehicleInfo": {
    "model": "Tesla Model Y",
    "currentMileage": 105000,
    "warrantyStartDate": "2023-02-01"
  },
  "warrantyConditions": {
    "maxMileage": 100000,
    "warrantyPeriodMonths": 36
  }
}
```

### Lấy danh sách Model Xe
```
GET /api/vehicle-models
Authorization: Bearer <token>

Response:
[
  {
    "id": "MODEL001",
    "name": "Tesla Model Y",
    "warrantyConditions": {
      "maxMileage": 100000,
      "warrantyPeriodMonths": 36
    }
  }
]
```

### Lấy thông tin Xe
```
GET /api/vehicles/:id
Authorization: Bearer <token>

Response:
{
  "id": "VEH001",
  "vin": "1FTFW1ET5DFC12345",
  "model": "Tesla Model Y",
  "manufactureDate": "2023-01-15",
  "warrantyStartDate": "2023-02-01",
  "currentMileage": 25000
}
```

## Trạng thái Form

### Khi xe ĐỦ điều kiện bảo hành:
- ✅ Form hiển thị bình thường
- ✅ Tất cả field có thể nhập
- ✅ Nút submit active

### Khi xe KHÔNG ĐỦ điều kiện bảo hành:
- ❌ Form bị disable/collapse
- ❌ Các field không thể nhập
- ❌ Nút submit bị disable
- ➡️ Hiển thị option "Manual Override"

### Khi Manual Override:
- ✅ Form được enable lại
- ✅ Hiển thị checkbox xác nhận bắt buộc
- ⚠️ Yêu cầu technician tick checkbox để submit

## Styling Guidelines

- **Professional theme**: Sử dụng màu sắc đơn giản, không quá nhiều màu
- **No hover movements**: Chỉ highlight, không di chuyển components
- **Consistent UI/UX**: Tuân thủ design language của app
- **Responsive**: Hỗ trợ mobile và tablet
- **Loading states**: Hiển thị spinner khi đang xử lý

## Customization

### CSS Classes chính:
```css
.warranty-check              /* Container chính */
.warranty-check__loading     /* Loading state */
.warranty-check__result      /* Kết quả check */
.warranty-check__error       /* Error state */

.evm-repair-form            /* Form container */
.repair-form-section        /* Form section */
.manual-override-section    /* Override section */

.claim-table-container      /* Table container */
.warranty-status            /* Warranty status trong table */
```

### Theme Colors:
```css
:root {
  --warranty-eligible: #28a745;    /* Xanh lá - đủ điều kiện */
  --warranty-not-eligible: #dc3545; /* Đỏ - không đủ điều kiện */
  --warranty-checking: #007bff;     /* Xanh dương - đang check */
  --warranty-error: #dc3545;        /* Đỏ - lỗi */
  --warranty-na: #6c757d;           /* Xám - không áp dụng */
}
```

## Demo

Xem file `ExampleWarrantyPage.js` để demo đầy đủ các tính năng:

```bash
# Import vào routing của bạn
import ExampleWarrantyPage from '../components/Dashboard/ExampleWarrantyPage/ExampleWarrantyPage';
```

## Lưu ý Implementation

1. **Error Handling**: Tất cả component đều có error handling và fallback UI
2. **Loading States**: Hiển thị loading khi đang kiểm tra bảo hành
3. **Responsive**: Tối ưu cho mobile/tablet
4. **Accessibility**: Sử dụng proper labels và semantic HTML
5. **Performance**: Tránh re-render không cần thiết với proper state management

## Tích hợp vào Project hiện tại

### 1. Update EVMClaimManagementPage:
```javascript
// Thay thế bảng hiện tại bằng EVMClaimTable
import { EVMClaimTable } from '../EVMClaimTable';

// Trong render function:
<EVMClaimTable 
  claims={claims} 
  onClaimSelect={handleClaimAction}
  loading={loading}
/>
```

### 2. Update Technician Submit Form:
```javascript
// Thay thế form hiện tại bằng EVMRepairForm
import { EVMRepairForm } from '../EVMRepairForm';

// Trong component:
<EVMRepairForm
  vehicleId={currentVehicleId}
  onSubmit={handleRepairSubmit}
/>
```

### 3. Add Warranty Service:
```javascript
// Trong API layer
import { WarrantyService } from '../services/warrantyService';

// Sử dụng:
const result = await WarrantyService.checkWarrantyEligibility({
  vehicleId: 'VEH001'
});
```