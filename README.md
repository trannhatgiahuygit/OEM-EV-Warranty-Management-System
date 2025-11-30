# 🚗 HỆ THỐNG QUẢN LÝ BẢO HÀNH XE ĐIỆN OEM

Hệ thống quản lý bảo hành toàn diện cho xe điện OEM, hỗ trợ quy trình từ tiếp nhận yêu cầu bảo hành, chẩn đoán, sửa chữa, đến thanh toán và quản lý kho.

---

## 📋 MỤC LỤC

- [Tổng quan](#-tổng-quan)
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt và Chạy](#-cài-đặt-và-chạy)
- [Cấu hình](#-cấu-hình)
- [Quy trình bảo hành](#-quy-trình-bảo-hành)
- [Phân quyền người dùng](#-phân-quyền-người-dùng)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Tài liệu tham khảo](#-tài-liệu-tham-khảo)

---

## 🎯 TỔNG QUAN

Hệ thống quản lý bảo hành xe điện OEM là một giải pháp phần mềm toàn diện được thiết kế để quản lý toàn bộ vòng đời của các yêu cầu bảo hành, từ khi khách hàng yêu cầu đến khi hoàn tất và đóng claim. Hệ thống hỗ trợ nhiều vai trò người dùng khác nhau, từ nhân viên trung tâm dịch vụ, kỹ thuật viên, đến nhân viên EVM và quản trị viên.

### Đối tượng sử dụng

- **SC_STAFF** - Nhân viên Trung tâm Dịch vụ
- **SC_TECHNICIAN** - Kỹ thuật viên Trung tâm Dịch vụ
- **EVM_STAFF** - Nhân viên EVM
- **ADMIN** - Quản trị viên hệ thống

---

## ✨ TÍNH NĂNG CHÍNH

### 🔧 Quản lý Bảo hành (Warranty Claims)
- Tạo và theo dõi yêu cầu bảo hành
- Kiểm tra điều kiện bảo hành tự động
- Quy trình phê duyệt đa cấp (SC → EVM)
- Quản lý trạng thái claim chi tiết
- Lịch sử thay đổi trạng thái đầy đủ

### 👥 Quản lý Khách hàng & Xe
- Quản lý thông tin khách hàng
- Đăng ký và quản lý xe theo VIN
- Theo dõi lịch sử dịch vụ và bảo hành
- Phân loại xe theo danh mục

### 🔩 Quản lý Phụ tùng & Tồn kho
- Quản lý phụ tùng EVM và phụ tùng bên thứ 3
- Theo dõi tồn kho theo warehouse
- Quản lý serial number phụ tùng
- Tự động reserve phụ tùng khi claim được approve
- Cảnh báo khi thiếu phụ tùng

### 📋 Quản lý Work Orders
- Tạo và gán work order cho technician
- Theo dõi tiến độ sửa chữa
- Quản lý workload của technician
- Quét và ghi nhận S/N phụ tùng thay thế

### 💳 Thanh toán
- Tích hợp VNPay payment gateway
- Thanh toán cho sửa chữa ngoài bảo hành
- Theo dõi trạng thái thanh toán

### 🤖 AI-Powered Features
- Tích hợp Google Gemini AI
- Hỗ trợ chẩn đoán thông minh
- Chatbot hỗ trợ

### 📢 Quản lý Recall Campaigns
- Tạo và quản lý chiến dịch thu hồi
- Theo dõi tiến độ thu hồi
- Thông báo cho khách hàng

### 📊 Báo cáo & Phân tích
- Dashboard theo vai trò
- Báo cáo thống kê bảo hành
- Phân tích hiệu suất
- Export dữ liệu

### 🎨 Giao diện người dùng
- Thiết kế hiện đại, tối giản
- Hỗ trợ Light/Dark mode
- Responsive design (mobile & desktop)
- Animations mượt mà
- Trải nghiệm người dùng tối ưu

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Backend
- **Framework**: Spring Boot 3.5.6
- **Language**: Java 21
- **Database**: Microsoft SQL Server 2022
- **ORM**: Spring Data JPA / Hibernate
- **Security**: Spring Security + JWT
- **API Documentation**: SpringDoc OpenAPI (Swagger)
- **Build Tool**: Maven
- **Containerization**: Docker & Docker Compose

### Frontend
- **Framework**: React 19.1.1
- **Routing**: React Router DOM 7.9.4
- **HTTP Client**: Axios 1.12.2
- **UI/UX**: 
  - CSS3 & CSS Modules
  - Framer Motion 12.23.22 (animations)
  - React Icons 5.5.0
- **Notifications**: React Toastify 11.0.5
- **3D Graphics**: Three.js & React Three Fiber (optional)

### Third-party Services
- **Payment Gateway**: VNPay
- **AI Service**: Google Gemini AI
- **Authentication**: JWT (JSON Web Tokens)

---

## 📁 CẤU TRÚC DỰ ÁN

```
OEM-EV-Warranty-Management-System/
├── BE/                                    # Backend (Spring Boot)
│   └── OEM-EV-Warranty-Management-System/
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/com/ev/
│       │   │   │   ├── warranty/
│       │   │   │   │   ├── controller/    # REST Controllers
│       │   │   │   │   ├── service/       # Business Logic
│       │   │   │   │   ├── repository/    # Data Access
│       │   │   │   │   ├── model/         # Entities & DTOs
│       │   │   │   │   ├── config/        # Configuration
│       │   │   │   │   └── security/      # Security Config
│       │   │   └── resources/
│       │   │       ├── application.properties
│       │   │       └── data.sql
│       │   └── test/                      # Unit Tests
│       ├── migrations/                    # Database Migrations
│       ├── Postman_Test/                  # Postman Collections
│       ├── docker-compose.yml
│       ├── Dockerfile
│       └── pom.xml
│
├── FE/                                    # Frontend (React)
│   └── OEM-EV-Warranty-Management-System/
│       └── oem-ev-warranty-management-system/
│           ├── src/
│           │   ├── components/            # React Components
│           │   │   ├── Dashboard/         # Dashboard Pages
│           │   │   ├── Login/
│           │   │   ├── HomePage/
│           │   │   └── ...
│           │   ├── services/              # API Services
│           │   ├── utils/                 # Utilities
│           │   └── hooks/                 # Custom Hooks
│           ├── public/
│           ├── package.json
│           └── README.md
│
├── WARRANTY_FLOW_EXPLANATION.md          # Chi tiết flow bảo hành
├── CONFIGURATION_GUIDE.md                # Hướng dẫn cấu hình
├── DATABASE_ANALYSIS.md                  # Phân tích database
├── ACTION_ITEMS.md                       # Danh sách công việc
└── README.md                             # File này
```

---

## 💻 YÊU CẦU HỆ THỐNG

### Backend
- **Java**: JDK 21 hoặc cao hơn
- **Maven**: 3.6+ (hoặc sử dụng Maven Wrapper)
- **Database**: SQL Server 2019+ hoặc SQL Server Express
- **Docker**: 20.10+ (tùy chọn, để chạy với Docker Compose)

### Frontend
- **Node.js**: 16.x hoặc cao hơn
- **npm**: 8.x hoặc cao hơn (hoặc yarn)

### Development Tools
- **IDE**: IntelliJ IDEA, Eclipse, hoặc VS Code
- **Database Client**: SQL Server Management Studio (SSMS) hoặc Azure Data Studio
- **API Testing**: Postman hoặc Insomnia

---

## 🚀 CÀI ĐẶT VÀ CHẠY

### 1. Clone Repository

```bash
git clone <repository-url>
cd OEM-EV-Warranty-Management-System
```

### 2. Cài đặt Database

#### Option A: Sử dụng Docker Compose (Khuyến nghị)

```bash
cd BE/OEM-EV-Warranty-Management-System

# Tạo file .env
cp .env.example .env
# Chỉnh sửa .env và điền MSSQL_SA_PASSWORD

# Khởi động database
docker-compose up -d db db-init
```

#### Option B: Cài đặt SQL Server Local

1. Tải và cài đặt [SQL Server Express](https://www.microsoft.com/sql-server/sql-server-downloads)
2. Tạo database:
```sql
CREATE DATABASE OEM_EV2
COLLATE SQL_Latin1_General_CP1_CI_AS;
```

### 3. Cấu hình Backend

```bash
cd BE/OEM-EV-Warranty-Management-System

# Copy file cấu hình mẫu
cp src/main/resources/application-sample.properties src/main/resources/application.properties

# Chỉnh sửa application.properties:
# - Cập nhật database connection string
# - Cập nhật JWT secret
# - Cập nhật API keys (Gemini, VNPay)
```

Xem chi tiết trong [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md)

### 4. Chạy Backend

#### Option A: Sử dụng Maven Wrapper

```bash
cd BE/OEM-EV-Warranty-Management-System
./mvnw spring-boot:run
# Hoặc trên Windows:
mvnw.cmd spring-boot:run
```

#### Option B: Sử dụng IntelliJ IDEA

1. Mở project trong IntelliJ IDEA
2. Tìm file `RunApplication.java` hoặc class có `@SpringBootApplication`
3. Right-click → Run

#### Option C: Sử dụng Docker Compose (Full Stack)

```bash
cd BE/OEM-EV-Warranty-Management-System
docker-compose up
```

Backend sẽ chạy tại: **http://localhost:8080**

### 5. Cài đặt và Chạy Frontend

```bash
cd FE/OEM-EV-Warranty-Management-System/oem-ev-warranty-management-system

# Cài đặt dependencies
npm install

# Chạy development server
npm start
```

Frontend sẽ chạy tại: **http://localhost:3000**

### 6. Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs**: http://localhost:8080/v3/api-docs

---

## ⚙️ CẤU HÌNH

### Environment Variables

Tạo file `.env` trong thư mục `BE/OEM-EV-Warranty-Management-System/`:

```bash
# Database
MSSQL_SA_PASSWORD=YourStrong@Passw0rd

# JWT Secret (tối thiểu 32 ký tự)
APP_JWT_SECRET=your-generated-secret-here-min-32-chars

# Gemini AI
GEMINI_API_KEY=AIzaSy...your-key-here

# VNPay (Sandbox)
VNPAY_TMN_CODE=3LM60U0F
VNPAY_HASH_SECRET=32H3JYZG8L19NTXTPOHCWC3BW94SSMU4
VNPAY_RETURN_URL=http://localhost:8080/vnpay/return
```

### Application Properties

File `application.properties` chứa các cấu hình chi tiết:

- Database connection
- JWT settings
- File upload settings
- CORS configuration
- Third-party service APIs

Xem chi tiết trong [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md)

---

## 🔄 QUY TRÌNH BẢO HÀNH

Hệ thống hỗ trợ 2 flow chính:

### 1. EVM_REPAIR (Sửa chữa bảo hành - dùng phụ tùng từ kho EVM)

```
DRAFT/OPEN
  ↓ (Intake)
OPEN
  ↓ (Diagnostic)
PENDING_APPROVAL
  ↓ (Submit to EVM)
PENDING_EVM_APPROVAL
  ├─→ EVM_APPROVED → READY_FOR_REPAIR → REPAIR_IN_PROGRESS
  └─→ EVM_REJECTED → (Resubmit) → PENDING_EVM_APPROVAL
REPAIR_IN_PROGRESS
  ↓ (Complete Repair)
FINAL_INSPECTION
  ↓ (Inspection)
READY_FOR_HANDOVER
  ↓ (Handover)
CLAIM_DONE
  ↓ (Close)
CLOSED ✅
```

### 2. SC_REPAIR (Sửa chữa dịch vụ - khách hàng thanh toán)

```
OPEN
  ↓ (Diagnostic - chọn SC_REPAIR)
CUSTOMER_PAYMENT_PENDING
  ↓ (Payment)
CUSTOMER_PAID → READY_FOR_REPAIR → REPAIR_IN_PROGRESS
  ↓ (Complete Repair)
FINAL_INSPECTION → READY_FOR_HANDOVER → CLAIM_DONE → CLOSED
```

Xem chi tiết đầy đủ trong [WARRANTY_FLOW_EXPLANATION.md](./WARRANTY_FLOW_EXPLANATION.md)

---

## 👤 PHÂN QUYỀN NGƯỜI DÙNG

### SC_STAFF (Nhân viên Trung tâm Dịch vụ)
- Quản lý hồ sơ xe và khách hàng
- Đăng ký xe theo số VIN
- Theo dõi lịch sử dịch vụ và bảo hành
- Xử lý yêu cầu bảo hành (intake)
- Giám sát trạng thái yêu cầu
- Bàn giao xe cho khách hàng

### SC_TECHNICIAN (Kỹ thuật viên)
- Đính kèm báo cáo, hình ảnh, chẩn đoán
- Thực hiện sửa chữa bảo hành
- Cập nhật tiến độ sửa chữa
- Quét và ghi nhận S/N phụ tùng
- Quản lý work orders

### EVM_STAFF (Nhân viên EVM)
- Quản lý cơ sở dữ liệu phụ tùng EV
- Phê duyệt/từ chối yêu cầu bảo hành
- Giám sát chiến dịch thu hồi
- Phân tích dữ liệu bảo hành
- Quản lý warranty policies

### ADMIN (Quản trị viên)
- Phân công kỹ thuật viên cho các trường hợp
- Phân tích dữ liệu bảo hành
- Tạo báo cáo
- Quản lý người dùng và phân quyền
- Quản lý hoạt động nội bộ

---

## 📚 API DOCUMENTATION

### Swagger UI

Khi backend đang chạy, truy cập:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

### Postman Collections

Các Postman collections có sẵn trong thư mục:
```
BE/OEM-EV-Warranty-Management-System/Postman_Test/
├── Postman_Complete_Test_Suite.json
├── Postman_Warranty_Claim_Flow_Tests.json
├── Postman_Authentication_Tests.json
├── Postman_Customer_Management_Tests.json
├── Postman_Inventory_Management_Tests.json
└── ...
```

### Các Endpoint chính

| Endpoint | Method | Mô tả | Quyền |
|----------|--------|-------|-------|
| `/api/auth/login` | POST | Đăng nhập | Public |
| `/api/claims/intake` | POST | Tạo claim mới | SC_STAFF, ADMIN |
| `/api/claims/{id}/diagnostic` | PUT | Cập nhật chẩn đoán | SC_STAFF, SC_TECHNICIAN, ADMIN |
| `/api/claims/submit` | POST | Gửi lên EVM | SC_STAFF, SC_TECHNICIAN, ADMIN |
| `/api/evm/claims/{id}/approve` | POST | EVM phê duyệt | EVM_STAFF, ADMIN |
| `/api/evm/claims/{id}/reject` | POST | EVM từ chối | EVM_STAFF, ADMIN |
| `/api/claims/{id}/complete-repair` | PUT | Hoàn tất sửa chữa | SC_TECHNICIAN, SC_STAFF, ADMIN |
| `/api/claims/{id}/final-inspection` | POST | Kiểm tra cuối | SC_STAFF, SC_TECHNICIAN, ADMIN |
| `/api/claims/{id}/handover` | POST | Bàn giao xe | SC_STAFF, ADMIN |
| `/api/claims/{id}/close` | POST | Đóng claim | SC_STAFF, ADMIN |

---




