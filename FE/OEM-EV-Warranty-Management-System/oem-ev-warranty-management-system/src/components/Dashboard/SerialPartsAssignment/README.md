# Serial Parts Assignment System

Hệ thống gán serial linh kiện tự động sau khi work order hoàn thành.

## 📋 Tổng quan

Khi một work order được đánh dấu là **DONE** (hoàn thành), hệ thống sẽ tự động:
1. Hiển thị form gán serial linh kiện
2. Load danh sách serial khả dụng từ kho (EVM & bên thứ 3)
3. Cho phép chọn serial cho từng linh kiện đã sử dụng
4. Gán serial vào xe khách hàng
5. Cập nhật trạng thái serial trong kho thành "INSTALLED"

## 🚀 Components đã tạo

### 1. **SerialPartsService** (`services/serialPartsService.js`)
Service xử lý API calls cho quản lý serial parts:
- `getAvailableSerialParts(partType)` - Lấy serial khả dụng theo loại
- `getAvailableSerialPartsByPartId(partId)` - Lấy serial theo ID linh kiện
- `assignSerialPartsToVehicle(workOrderId, assignments)` - Gán serial vào xe
- `updateSerialPartStatus(serialNumber, status, location)` - Cập nhật trạng thái
- `getVehicleSerialParts(vehicleId)` - Lấy lịch sử serial của xe
- `batchUpdateSerialPartsStatus(updates)` - Cập nhật hàng loạt

### 2. **SerialPartsAssignment** (`components/Dashboard/SerialPartsAssignment/`)
Component chính để gán serial:
- Tự động load serial khả dụng
- Chọn serial cho từng linh kiện (manual hoặc auto)
- Validation số lượng
- Xử lý gán và cập nhật trạng thái
- UI/UX professional với loading, error, success states

### 3. **VehicleSerialHistory** (`components/Dashboard/VehicleSerialHistory/`)
Component hiển thị lịch sử serial của xe:
- Bảng danh sách serial đã gán
- Filter theo trạng thái và search
- Summary statistics
- Responsive design

### 4. **WorkOrderDetailWithSerial** (`components/Dashboard/WorkOrderDetailWithSerial/`)
Example integration với work order management:
- Tự động trigger serial assignment khi status = DONE
- Handle success/error callbacks
- Integration với existing work order flow

## 📦 Cài đặt

Các components đã được tạo sẵn trong project structure:

```
src/
├── services/
│   └── serialPartsService.js          ✅ Created
├── components/
│   └── Dashboard/
│       ├── SerialPartsAssignment/
│       │   ├── SerialPartsAssignment.js    ✅ Created
│       │   └── SerialPartsAssignment.css   ✅ Created
│       ├── VehicleSerialHistory/
│       │   ├── VehicleSerialHistory.js     ✅ Created
│       │   └── VehicleSerialHistory.css    ✅ Created
│       └── WorkOrderDetailWithSerial/
│           └── WorkOrderDetailWithSerial.js ✅ Created
```

## 🔧 Cách sử dụng

### Option 1: Tích hợp vào Work Order Detail Page hiện tại

```javascript
import SerialPartsAssignment from '../SerialPartsAssignment/SerialPartsAssignment';

const YourWorkOrderDetailPage = ({ workOrder }) => {
  const [showSerialAssignment, setShowSerialAssignment] = useState(false);

  const handleStatusUpdate = async (newStatus) => {
    // ... update status logic
    
    // Show serial assignment when status becomes DONE
    if (newStatus === 'DONE' && workOrder.partsUsed?.length > 0) {
      setShowSerialAssignment(true);
    }
  };

  const handleAssignmentComplete = (assignments) => {
    console.log('Assigned serials:', assignments);
    setShowSerialAssignment(false);
    // Refresh data or show success message
  };

  return (
    <div>
      {/* ...existing work order UI... */}
      
      {showSerialAssignment && (
        <SerialPartsAssignment
          workOrder={workOrder}
          onAssignmentComplete={handleAssignmentComplete}
          onCancel={() => setShowSerialAssignment(false)}
        />
      )}
    </div>
  );
};
```

### Option 2: Sử dụng component mẫu WorkOrderDetailWithSerial

```javascript
import WorkOrderDetailWithSerial from './components/Dashboard/WorkOrderDetailWithSerial/WorkOrderDetailWithSerial';

// In your page:
<WorkOrderDetailWithSerial 
  workOrderId={selectedWorkOrderId}
  onClose={handleClose}
/>
```

### Option 3: Hiển thị lịch sử serial trong Vehicle Detail

```javascript
import VehicleSerialHistory from '../VehicleSerialHistory/VehicleSerialHistory';

const VehicleDetailPage = ({ vehicle }) => {
  return (
    <div>
      {/* ...vehicle info... */}
      
      <VehicleSerialHistory 
        vehicleId={vehicle.id}
        vehicleVin={vehicle.vin}
      />
    </div>
  );
};
```

## 🔗 Backend API Requirements

Backend cần implement các endpoints sau:

### 1. Get Available Serial Parts
```
GET /api/serial-parts/available?type={partType}
GET /api/serial-parts/available/part/{partId}

Response:
[
  {
    "serialNumber": "SN-EVM-2024-001",
    "partId": 123,
    "partName": "Battery Module",
    "partType": "EVM",
    "status": "IN_STOCK",
    "location": "EVM_WAREHOUSE"
  }
]
```

### 2. Assign Serial Parts to Vehicle
```
POST /api/serial-parts/assign

Body:
{
  "workOrderId": 456,
  "assignments": [
    {
      "partId": 123,
      "serialNumber": "SN-EVM-2024-001",
      "partType": "EVM",
      "vehicleId": 789
    }
  ]
}

Response:
{
  "success": true,
  "assignedCount": 1,
  "message": "Serial parts assigned successfully"
}
```

### 3. Update Serial Part Status
```
PUT /api/serial-parts/status

Body:
{
  "serialNumber": "SN-EVM-2024-001",
  "status": "INSTALLED",
  "location": "CUSTOMER_VEHICLE"
}

Response:
{
  "success": true,
  "serialNumber": "SN-EVM-2024-001",
  "status": "INSTALLED"
}
```

### 4. Batch Update Status
```
PUT /api/serial-parts/batch-update-status

Body:
{
  "updates": [
    {
      "serialNumber": "SN-EVM-2024-001",
      "status": "INSTALLED",
      "location": "CUSTOMER_VEHICLE"
    }
  ]
}
```

### 5. Get Vehicle Serial Parts History
```
GET /api/vehicles/{vehicleId}/serial-parts

Response:
[
  {
    "id": 1,
    "serialNumber": "SN-EVM-2024-001",
    "partName": "Battery Module",
    "partType": "EVM",
    "status": "INSTALLED",
    "location": "CUSTOMER_VEHICLE",
    "assignedDate": "2024-01-15T10:30:00Z",
    "workOrderId": 456
  }
]
```

### 6. Get Work Order with Parts
```
GET /api/work-orders/{workOrderId}/parts

Response:
{
  "id": 456,
  "status": "DONE",
  "vehicleId": 789,
  "vehicleVin": "VIN123456",
  "partsUsed": [
    {
      "id": 123,
      "partName": "Battery Module",
      "partType": "EVM",
      "quantity": 2
    }
  ]
}
```

## 📊 Database Schema Suggestions

### serial_parts table
```sql
CREATE TABLE serial_parts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  part_id BIGINT NOT NULL,
  part_type VARCHAR(50) NOT NULL, -- 'EVM' or 'THIRD_PARTY'
  status VARCHAR(50) NOT NULL, -- 'IN_STOCK', 'ASSIGNED', 'INSTALLED', 'REPLACED', 'DEFECTIVE'
  location VARCHAR(100) NOT NULL, -- 'EVM_WAREHOUSE', 'THIRD_PARTY_WAREHOUSE', 'CUSTOMER_VEHICLE'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (part_id) REFERENCES parts(id)
);
```

### serial_part_assignments table
```sql
CREATE TABLE serial_part_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  serial_number VARCHAR(100) NOT NULL,
  vehicle_id BIGINT NOT NULL,
  work_order_id BIGINT NOT NULL,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by BIGINT, -- user_id
  notes TEXT,
  FOREIGN KEY (serial_number) REFERENCES serial_parts(serial_number),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);
```

## 🎨 Features

### ✅ Đã implement
- [x] Serial parts service với full API integration
- [x] Component gán serial tự động/manual
- [x] Component lịch sử serial của xe
- [x] Example integration với work order
- [x] Professional UI/UX design
- [x] Loading, error, success states
- [x] Auto-select functionality
- [x] Validation số lượng serial
- [x] Filter & search trong history
- [x] Summary statistics
- [x] Responsive design
- [x] Print-friendly styles

### 🔮 Có thể mở rộng
- [ ] Scan barcode/QR code cho serial number
- [ ] Export lịch sử serial ra Excel/PDF
- [ ] Notification khi serial sắp hết hạn bảo hành
- [ ] Track serial part location trong kho
- [ ] Serial part defect reporting
- [ ] Bulk import serial numbers
- [ ] Serial part transfer between warehouses

## 🐛 Troubleshooting

### Lỗi: "Không thể tải danh sách linh kiện serial"
- Kiểm tra backend API endpoint đã implement chưa
- Kiểm tra authentication token
- Kiểm tra CORS settings

### Lỗi: "Không đủ serial khả dụng"
- Kiểm tra database có serial với status = 'IN_STOCK'
- Kiểm tra partId matching giữa work order và serial_parts

### Serial assignment không hiển thị
- Kiểm tra work order status = 'DONE'
- Kiểm tra work order có partsUsed array
- Kiểm tra showSerialAssignment state

## 📝 Notes

1. **Work Order Structure**: Component expect work order có structure:
```javascript
{
  id: number,
  status: string,
  vehicleId: number,
  vehicleVin: string,
  partsUsed: [
    {
      id: number,
      partName: string,
      partType: string,
      quantity: number
    }
  ]
}
```

2. **Authentication**: Tất cả API calls sử dụng Bearer token từ localStorage

3. **Error Handling**: Components có built-in error handling và toast notifications

4. **Performance**: Sử dụng batch update cho multiple serial status changes

## 🔐 Security Considerations

- Validate user permissions trước khi cho phép gán serial
- Log tất cả serial assignments cho audit trail
- Restrict serial number modification sau khi assigned
- Validate serial number uniqueness
- Check work order ownership before assignment

## 📞 Support

Nếu cần hỗ trợ thêm về:
- Backend API implementation
- Database schema design
- Integration với existing pages
- Custom features

Hãy liên hệ team development! 🚀
