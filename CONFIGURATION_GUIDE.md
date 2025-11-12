# ⚙️ HƯỚNG DẪN CẤU HÌNH HỆ THỐNG
## OEM EV Warranty Management System

---

## 📋 MỤC LỤC
1. [Cấu hình Environment Variables](#1-cấu-hình-environment-variables)
2. [Cấu hình Database](#2-cấu-hình-database)
3. [Cấu hình Security](#3-cấu-hình-security)
4. [Cấu hình Third-party Services](#4-cấu-hình-third-party-services)
5. [Cấu hình cho Development](#5-cấu-hình-cho-development)
6. [Cấu hình cho Production](#6-cấu-hình-cho-production)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. CẤU HÌNH ENVIRONMENT VARIABLES

### 🔴 **QUAN TRỌNG: Không hardcode secrets trong code!**

Hệ thống sử dụng environment variables để quản lý cấu hình nhạy cảm.

### Bước 1: Tạo file `.env` (cho Docker)

```bash
# Copy file mẫu
cp .env.example .env

# Edit file .env và điền secrets thật
nano .env  # hoặc notepad .env trên Windows
```

### Bước 2: Tạo `application.properties` (cho local dev)

```bash
# Copy file mẫu
cd src/main/resources
cp application-sample.properties application.properties

# Edit và điền secrets
nano application.properties
```

### ⚠️ **LƯU Ý BẢO MẬT**
```bash
# ✅ Files NÊN commit vào Git:
.env.example           # Template không có secrets
application-sample.properties

# ❌ Files KHÔNG NÊN commit:
.env                   # Có secrets thật
application.properties # Có secrets thật (nếu override defaults)
```

**Kiểm tra `.gitignore` đã có:**
```gitignore
.env
application.properties  # Nếu bạn không dùng sample
```

---

## 2. CẤU HÌNH DATABASE

### Option A: Sử dụng Docker Compose (Khuyến nghị)

**File: `.env`**
```bash
MSSQL_SA_PASSWORD=YourStrong@Passw0rd
```

**Khởi động:**
```bash
docker-compose up -d
```

SQL Server sẽ chạy trên `localhost:1433` với database `OEM_EV2`.

### Option B: Sử dụng SQL Server Local

**Bước 1:** Cài đặt SQL Server Express/Developer Edition

**Bước 2:** Tạo database
```sql
CREATE DATABASE OEM_EV2
COLLATE SQL_Latin1_General_CP1_CI_AS;
```

**Bước 3:** Cấu hình trong `application.properties`
```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=OEM_EV2;encrypt=false;trustServerCertificate=true
spring.datasource.username=sa
spring.datasource.password=${DB_PASSWORD:12345}
```

### Kiểm tra kết nối
```bash
# Windows
sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd"

# Hoặc dùng SQL Server Management Studio (SSMS)
```

---

## 3. CẤU HÌNH SECURITY

### JWT Secret Key

**⚠️ YÊU CẦU:**
- Độ dài: **Tối thiểu 32 ký tự**
- Nội dung: Random, không đoán được
- **KHÁC NHAU** giữa dev/test/prod

**Tạo JWT Secret mạnh:**

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Hoặc dùng online tool (ĐỂ TEST THÔI, KHÔNG DÙNG CHO PROD!)
# https://randomkeygen.com/
```

**Cấu hình:**

```bash
# .env (cho Docker)
APP_JWT_SECRET=your-generated-secret-here-min-32-chars-xYz123ABC
```

```properties
# application.properties (cho local)
spring.app.secret=${APP_JWT_SECRET:default-dev-secret-change-in-prod}
```

### Password Hashing

Hệ thống sử dụng **BCrypt** với strength 10:
```java
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
String hashed = encoder.encode("password123");
```

**Tạo password hash cho seeding data:**
```bash
# Sử dụng online BCrypt generator
# https://bcrypt-generator.com/
# Rounds: 10
```

---

## 4. CẤU HÌNH THIRD-PARTY SERVICES

### A. Gemini AI (Google)

**Mục đích:** AI-powered diagnostics và chatbot

**Bước 1:** Lấy API Key
1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập với Google Account
3. Tạo API Key mới
4. Copy key

**Bước 2:** Cấu hình
```bash
# .env
GEMINI_API_KEY=AIzaSy...your-key-here

# application.properties
ai.gemini.api-key=${GEMINI_API_KEY}
ai.gemini.model=gemini-1.5-flash
```

**Kiểm tra:**
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### B. VNPay Payment Gateway

**Mục đích:** Thanh toán online cho out-of-warranty repairs

#### 🧪 **SANDBOX (Testing)**
```bash
# .env
VNPAY_TMN_CODE=3LM60U0F
VNPAY_HASH_SECRET=32H3JYZG8L19NTXTPOHCWC3BW94SSMU4
VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:8080/vnpay/return
```

**Test Card Numbers:**
- Card: `9704198526191432198`
- Name: `NGUYEN VAN A`
- Expiry: `07/15`
- OTP: `123456`

#### 🚀 **PRODUCTION**
1. Đăng ký tài khoản merchant: https://vnpay.vn
2. Hoàn tất KYC
3. Lấy `tmnCode` và `hashSecret` production
4. Cập nhật `.env` production:
```bash
VNPAY_TMN_CODE=your-prod-tmn-code
VNPAY_HASH_SECRET=your-prod-hash-secret
VNPAY_PAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/vnpay/return
```

**⚠️ QUAN TRỌNG:**
- `VNPAY_RETURN_URL` phải match với domain đã đăng ký với VNPay
- Không dùng `localhost` trong production

---

## 5. CẤU HÌNH CHO DEVELOPMENT

### Profile: `default` (không specify profile)

**File: `application.properties`**
```properties
# Database: Local hoặc Docker
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=OEM_EV2;...
spring.datasource.username=sa
spring.datasource.password=${DB_PASSWORD:12345}

# JPA: Auto-create schema (⚠️ CHẠY DATA.SQL MỖI LẦN RESTART)
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true

# Security: Weak secret cho dev (⚠️ KHÔNG DÙNG TRONG PROD)
spring.app.secret=${APP_JWT_SECRET:HyyNeverGonnaGiveYouUp}

# CORS: Allow all
app.cors.allowed-origins=*

# Swagger: Enable
springdoc.swagger-ui.enabled=true
```

### Run Application

**Option 1: IntelliJ IDEA**
1. Right-click `DemoApplication.java`
2. Run 'DemoApplication'

**Option 2: Maven**
```bash
mvnw spring-boot:run
```

**Option 3: Docker**
```bash
docker-compose up
```

**Access:**
- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

---

## 6. CẤU HÌNH CHO PRODUCTION

### ⚠️ **CHECKLIST BẢO MẬT**

- [ ] ✅ JWT secret mạnh (min 32 chars random)
- [ ] ✅ Database password mạnh
- [ ] ✅ Không hardcode secrets trong code
- [ ] ✅ `spring.jpa.hibernate.ddl-auto=validate` (KHÔNG dùng `create-drop`)
- [ ] ✅ `spring.jpa.show-sql=false` (không log SQL)
- [ ] ✅ CORS specific origins (không dùng `*`)
- [ ] ✅ Swagger disabled hoặc protected
- [ ] ✅ HTTPS enabled
- [ ] ✅ API key VNPay production
- [ ] ✅ Database backup strategy
- [ ] ✅ Monitoring/logging setup

### Profile: `prod`

**File: `application-prod.properties`**
```properties
# Database: Production server
spring.datasource.url=jdbc:sqlserver://prod-db-server:1433;databaseName=OEM_EV2_PROD;encrypt=true
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# JPA: Validate only (KHÔNG auto-create)
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

# Security: MUST use environment variable
spring.app.secret=${APP_JWT_SECRET}

# CORS: Specific origins only
app.cors.allowed-origins=https://yourdomain.com,https://app.yourdomain.com

# Swagger: Disable hoặc protect với authentication
springdoc.swagger-ui.enabled=false
springdoc.api-docs.enabled=false

# Logging
logging.level.root=WARN
logging.level.com.ev.warranty=INFO
logging.file.name=/var/log/warranty-app/app.log
```

### Deploy với Docker

**Build image:**
```bash
docker build -t oem-ev-warranty:1.0 .
```

**Run container:**
```bash
docker run -d \
  --name warranty-app \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_URL="jdbc:sqlserver://prod-db:1433;..." \
  -e DB_USERNAME=sa \
  -e DB_PASSWORD=SecurePassword123! \
  -e APP_JWT_SECRET=prod-secret-key-32-chars-min \
  -e GEMINI_API_KEY=AIza... \
  -e VNPAY_TMN_CODE=PROD_CODE \
  -e VNPAY_HASH_SECRET=PROD_SECRET \
  -v /var/log/warranty:/var/log/warranty-app \
  oem-ev-warranty:1.0
```

### Environment Variables cho Production

**Sử dụng Secret Management:**
- **AWS:** AWS Secrets Manager
- **Azure:** Azure Key Vault
- **GCP:** Google Secret Manager
- **Kubernetes:** Sealed Secrets / External Secrets Operator

**Ví dụ với Kubernetes:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: warranty-secrets
type: Opaque
stringData:
  DB_PASSWORD: "SecurePassword123!"
  APP_JWT_SECRET: "prod-jwt-secret-32-chars-min"
  GEMINI_API_KEY: "AIza..."
  VNPAY_HASH_SECRET: "prod-vnpay-secret"
```

---

## 7. TROUBLESHOOTING

### Vấn đề 1: Không kết nối được Database

**Triệu chứng:**
```
com.microsoft.sqlserver.jdbc.SQLServerException: Connection refused
```

**Giải pháp:**
```bash
# 1. Kiểm tra SQL Server đang chạy
docker ps  # hoặc check Windows Services

# 2. Kiểm tra port
netstat -an | grep 1433  # Linux/Mac
netstat -an | findstr 1433  # Windows

# 3. Kiểm tra credentials
sqlcmd -S localhost -U sa -P "password"

# 4. Kiểm tra firewall
# Windows: Allow port 1433 in Windows Firewall
```

### Vấn đề 2: JWT Token không hợp lệ

**Triệu chứng:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid JWT token"
}
```

**Giải pháp:**
```bash
# 1. Kiểm tra JWT secret match giữa sign và verify
echo $APP_JWT_SECRET

# 2. Kiểm tra token expiry
# Decode token tại: https://jwt.io

# 3. Regenerate token
POST /api/auth/login
{
  "username": "admin_user",
  "password": "password"
}
```

### Vấn đề 3: VNPay payment failed

**Triệu chứng:**
```
Invalid checksum
```

**Giải pháp:**
```bash
# 1. Kiểm tra hashSecret
echo $VNPAY_HASH_SECRET

# 2. Kiểm tra returnUrl match
# Phải giống với đã config trên VNPay portal

# 3. Check log
# Xem chi tiết parameters và checksum calculation
```

### Vấn đề 4: Gemini API Error

**Triệu chứng:**
```
403 Forbidden: API key not valid
```

**Giải pháp:**
```bash
# 1. Kiểm tra API key
echo $GEMINI_API_KEY

# 2. Test trực tiếp
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"

# 3. Kiểm tra quota
# Truy cập Google Cloud Console → API & Services → Quotas
```

### Vấn đề 5: CORS Error từ Frontend

**Triệu chứng:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Giải pháp:**
```properties
# application.properties
# Thêm frontend domain vào allowed origins
app.cors.allowed-origins=http://localhost:3000,https://app.yourdomain.com
```

---

## 📞 HỖ TRỢ

- **Documentation:** Xem `DATABASE_AND_ARCHITECTURE_ASSESSMENT.md`
- **API Documentation:** http://localhost:8080/swagger-ui.html (dev)
- **VNPay Test Guide:** Xem `VNPAY_TESTING_GUIDE.md`

---

**Cập nhật lần cuối:** 12/11/2025  
**Version:** 1.0

