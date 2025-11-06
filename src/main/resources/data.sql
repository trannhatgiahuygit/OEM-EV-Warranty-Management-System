INSERT INTO roles (role_name, description) VALUES
                                               ('SC_STAFF','Service Center Staff'),
                                               ('SC_TECHNICIAN','Service Center Technician'),
                                               ('EVM_STAFF','EVM Staff'),
                                               ('ADMIN','Administrator');

-- SERVICE CENTERS (Main centers and branches) - Must be inserted before users
-- Main Service Centers
INSERT INTO service_centers (code, name, location, address, phone, email, manager_name, region, parent_service_center_id, is_main_branch, active, capacity, notes, created_at, updated_at, updated_by) VALUES
('SC-HCM-001', 'Ho Chi Minh City Main Service Center', 'Ho Chi Minh City', '123 Nguyen Hue Boulevard, District 1, Ho Chi Minh City', '+84-28-12345678', 'hcm-main@evservice.com', 'Nguyen Van A', 'SOUTH', NULL, 1, 1, 50, 'Main service center for South Vietnam region', '2023-01-01 08:00:00', '2023-01-01 08:00:00', 'admin'),
('SC-HN-001', 'Hanoi Main Service Center', 'Hanoi', '456 Le Loi Street, Hoan Kiem District, Hanoi', '+84-24-12345678', 'hn-main@evservice.com', 'Tran Thi B', 'NORTH', NULL, 1, 1, 45, 'Main service center for North Vietnam region', '2023-01-01 08:00:00', '2023-01-01 08:00:00', 'admin'),
('SC-DN-001', 'Da Nang Main Service Center', 'Da Nang', '789 Tran Phu Street, Hai Chau District, Da Nang', '+84-236-12345678', 'dn-main@evservice.com', 'Le Van C', 'CENTRAL', NULL, 1, 1, 40, 'Main service center for Central Vietnam region', '2023-01-01 08:00:00', '2023-01-01 08:00:00', 'admin');

-- Branches of HCM Main Center
INSERT INTO service_centers (code, name, location, address, phone, email, manager_name, region, parent_service_center_id, is_main_branch, active, capacity, notes, created_at, updated_at, updated_by) VALUES
('SC-HCM-002', 'HCM District 7 Branch', 'Ho Chi Minh City', '321 Nguyen Van Linh Street, District 7, Ho Chi Minh City', '+84-28-87654321', 'hcm-branch2@evservice.com', 'Pham Van D', 'SOUTH', 1, 0, 1, 30, 'Branch service center in District 7', '2023-02-01 08:00:00', '2023-02-01 08:00:00', 'admin'),
('SC-HCM-003', 'HCM Binh Thanh Branch', 'Ho Chi Minh City', '654 Xo Viet Nghe Tinh Street, Binh Thanh District, Ho Chi Minh City', '+84-28-87654322', 'hcm-branch3@evservice.com', 'Hoang Thi E', 'SOUTH', 1, 0, 1, 25, 'Branch service center in Binh Thanh District', '2023-03-01 08:00:00', '2023-03-01 08:00:00', 'admin');

-- Branches of Hanoi Main Center
INSERT INTO service_centers (code, name, location, address, phone, email, manager_name, region, parent_service_center_id, is_main_branch, active, capacity, notes, created_at, updated_at, updated_by) VALUES
('SC-HN-002', 'Hanoi Cau Giay Branch', 'Hanoi', '987 Xuan Thuy Street, Cau Giay District, Hanoi', '+84-24-87654321', 'hn-branch2@evservice.com', 'Vu Van F', 'NORTH', 2, 0, 1, 35, 'Branch service center in Cau Giay District', '2023-04-01 08:00:00', '2023-04-01 08:00:00', 'admin'),
('SC-HN-003', 'Hanoi Ha Dong Branch', 'Hanoi', '147 Quang Trung Street, Ha Dong District, Hanoi', '+84-24-87654322', 'hn-branch3@evservice.com', 'Dang Thi G', 'NORTH', 2, 0, 1, 28, 'Branch service center in Ha Dong District', '2023-05-01 08:00:00', '2023-05-01 08:00:00', 'admin');

-- Additional main centers in other regions
INSERT INTO service_centers (code, name, location, address, phone, email, manager_name, region, parent_service_center_id, is_main_branch, active, capacity, notes, created_at, updated_at, updated_by) VALUES
('SC-CT-001', 'Can Tho Service Center', 'Can Tho', '258 Tran Hung Dao Street, Ninh Kieu District, Can Tho', '+84-292-12345678', 'ct-main@evservice.com', 'Bui Van H', 'SOUTH', NULL, 1, 1, 30, 'Service center in Mekong Delta region', '2023-06-01 08:00:00', '2023-06-01 08:00:00', 'admin'),
('SC-HP-001', 'Hai Phong Service Center', 'Hai Phong', '369 Le Thanh Tong Street, Ngo Quyen District, Hai Phong', '+84-225-12345678', 'hp-main@evservice.com', 'Do Thi I', 'NORTH', NULL, 1, 1, 25, 'Service center in Hai Phong city', '2023-07-01 08:00:00', '2023-07-01 08:00:00', 'admin');

-- Branch of Da Nang Main Center
INSERT INTO service_centers (code, name, location, address, phone, email, manager_name, region, parent_service_center_id, is_main_branch, active, capacity, notes, created_at, updated_at, updated_by) VALUES
('SC-DN-002', 'Da Nang Hoi An Branch', 'Hoi An', '159 Nguyen Duy Hieu Street, Hoi An, Quang Nam', '+84-235-87654321', 'dn-branch2@evservice.com', 'Ngo Van K', 'CENTRAL', 3, 0, 1, 20, 'Branch service center in Hoi An', '2023-08-01 08:00:00', '2023-08-01 08:00:00', 'admin');

-- 2. USERS (phụ thuộc vào roles và service_centers)
-- Note: service_center_id is required for SC_STAFF (role_id=1) and SC_TECHNICIAN (role_id=2)
INSERT INTO users (username, email, password_hash, role_id, full_name, phone, active, service_center_id, created_at, updated_at) VALUES
                                                                                                                  ('admin_user', 'admin@evwarranty.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 4, 'System Administrator', '+1234567890', 1, NULL, '2023-01-01 08:00:00', '2023-01-01 08:00:00'),
                                                                                                                  ('evm_staff1', 'evm1@evwarranty.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 3, 'John Smith', '+1234567891', 1, NULL, '2023-01-05 09:00:00', '2023-01-05 09:00:00'),
                                                                                                                  ('sc_staff1', 'scstaff1@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 1, 'Alice Johnson', '+1234567892', 1, 1, '2023-01-10 10:00:00', '2023-01-10 10:00:00'),
                                                                                                                  ('tech1', 'tech1@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 2, 'Bob Wilson', '+1234567893', 1, 1, '2023-01-15 11:00:00', '2023-01-15 11:00:00'),
                                                                                                                  ('tech2', 'tech2@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 2, 'Carol Davis', '+1234567894', 1, 2, '2023-01-20 12:00:00', '2023-01-20 12:00:00'),
                                                                                                                  ('sc_staff2', 'scstaff2@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 1, 'David Brown', '+1234567895', 1, 2, '2023-01-25 13:00:00', '2023-01-25 13:00:00'),
                                                                                                                  ('former_tech', 'former@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 2, 'Former Technician', '+1234567896', 0, 3, '2022-01-01 08:00:00', '2024-01-01 08:00:00'),
                                                                                                                  ('suspended_staff', 'suspended@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 1, 'Suspended Staff', '+1234567897', 0, 4, '2023-06-01 08:00:00', '2024-02-01 08:00:00'),
                                                                                                                  ('trannhatgiahuygit', 'trannhatgiahuygit@gmail.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 1, 'Tran Nhat Gia Huy', '+84912345678', 1, 1, '2024-01-01 08:00:00', '2024-01-01 08:00:00');
-- =====================================
-- 2.1. TECHNICIAN PROFILES (phụ thuộc vào users)
-- =====================================
INSERT INTO technician_profiles (user_id, assignment_status, current_workload, max_workload, specialization, certification_level, total_completed_work_orders, average_completion_hours, available_from, created_at, updated_at) VALUES
-- Existing technicians
(4, 'BUSY', 2, 5, 'Battery Systems', 'Senior', 5, 6.5, '2024-03-28 17:00:00', '2023-01-15 11:00:00', GETDATE()),
(5, 'AVAILABLE', 0, 5, 'Electronics & Software', 'Senior', 12, 4.5, '2024-03-25 17:00:00', '2024-01-10 08:00:00', GETDATE());

-- 3. CUSTOMERS (phụ thuộc vào users)
INSERT INTO customers (name, email, phone, address, created_by, created_at) VALUES
    ('Michael Thompson', 'michael.t@email.com', '0987654321', '123 Main St, New York, NY 10001', 1, '2023-02-01 09:00:00'),
    ('Sarah Williams', 'sarah.w@email.com', '0989654321', '456 Oak Ave, Los Angeles, CA 90210', 1, '2023-02-02 10:00:00'),
    ('Robert Garcia', 'robert.g@email.com', '0988654321', '789 Pine Rd, Chicago, IL 60601', 2, '2023-02-03 11:00:00'),
    ('Emma Martinez', 'emma.m@email.com', '0986754321', '321 Elm St, Houston, TX 77001', 2, '2023-02-04 12:00:00'),
    ('James Rodriguez', 'james.r@email.com', '0985674321', '654 Maple Dr, Phoenix, AZ 85001', 3, '2023-02-05 13:00:00'),
    ('Lisa Anderson', 'lisa.a@email.com', '0789456234', '987 Cedar Ln, Philadelphia, PA 19101', 3, '2023-02-06 14:00:00'),
    ('David Chen', 'david.chen@email.com', '0912345678', '111 Tech Blvd, San Francisco, CA 94102', 3, '2024-03-01 09:00:00'),
    ('Jennifer Lee', 'jennifer.lee@email.com', '0923456789', '222 Innovation Way, Seattle, WA 98101', 1, '2024-03-02 10:00:00'),
    ('Kevin Patel', 'kevin.patel@email.com', '0934567890', '333 Green St, Portland, OR 97201', 2, '2024-03-03 11:00:00'),
    ('Michelle Nguyen', 'michelle.n@email.com', '0945678901', '444 Eco Drive, Austin, TX 78701', 3, '2024-03-04 12:00:00'),
    ('Thomas Brown', 'thomas.b@email.com', '0956789012', '555 Electric Ave, Denver, CO 80201', 1, '2024-03-05 13:00:00'),
    ('Angela White', 'angela.w@email.com', '0967890123', '666 Future Pkwy, Miami, FL 33101', 2, '2024-03-06 14:00:00');

INSERT INTO vehicles (vin, license_plate, model, year, customer_id, registration_date, warranty_start, warranty_end, mileage_km, created_at) VALUES
                                                                                                                                  ('1HGBH41JXMN109186', 'EV-0001', 'EV Model X Pro', 2023, 1, '2023-03-01', '2023-03-01', '2026-03-01', 25000, '2023-03-01 10:00:00'),
                                                                                                                                  ('2HGBH41JXMN109187', 'EV-0002', 'EV Model Y Standard', 2023, 2, '2023-03-05', '2023-03-05', '2026-03-05', 18000, '2023-03-05 11:00:00'),
                                                                                                                                  ('3HGBH41JXMN109188', 'EV-0003', 'EV Model Z Luxury', 2023, 3, '2023-03-10', '2023-03-10', '2026-03-10', 22000, '2023-03-10 12:00:00'),
                                                                                                                                  ('4HGBH41JXMN109189', 'EV-0004', 'EV Model X Pro', 2022, 4, '2022-12-15', '2022-12-15', '2025-12-15', 35000, '2022-12-15 13:00:00'),
                                                                                                                                  ('5HGBH41JXMN109190', 'EV-0005', 'EV Model Y Standard', 2024, 5, '2024-01-01', '2024-01-01', '2027-01-01', 8000, '2024-01-01 14:00:00'),
                                                                                                                                  ('6HGBH41JXMN109191', 'EV-0006', 'EV Model Z Luxury', 2024, 6, '2024-02-01', '2024-02-01', '2027-02-01', 5000, '2024-02-01 15:00:00'),
                                                                                                                                  -- Thêm VIN cho Postman test cases
                                                                                                                                  ('5YJSA1E14HF999999', 'EV-0007', 'Tesla Model 3', 2023, 2, '2023-04-01', '2023-04-01', '2026-04-01', 15000, '2023-04-01 10:00:00'),
                                                                                                                                  ('WAUZZZ4G7DN123456', 'EV-0008', 'Audi e-tron GT', 2023, 3, '2023-05-01', '2023-05-01', '2026-05-01', 12000, '2023-05-01 10:00:00'),
                                                                                                                                  ('1HGBH41JXMN109999', 'EV-0009', 'EV Model X Pro', 2023, 4, '2023-06-01', '2023-06-01', '2026-06-01', 14000, '2023-06-01 10:00:00'),
                                                                                                                                  ('1HGBH41JXMN108888', 'EV-0010', 'EV Model Y Standard', 2023, 5, '2023-07-01', '2023-07-01', '2026-07-01', 11000, '2023-07-01 10:00:00'),
                                                                                                                                  -- NEW: Thêm xe mới để test quy trình bảo hành
                                                                                                                                  ('7HGBH41JXMN200001', 'EV-0011', 'EV Model X Pro', 2024, 7, '2024-03-01', '2024-03-01', '2027-03-01', 3000, '2024-03-01 10:00:00'),
                                                                                                                                  ('8HGBH41JXMN200002', 'EV-0012', 'EV Model Y Standard', 2024, 8, '2024-03-05', '2024-03-05', '2027-03-05', 2500, '2024-03-05 11:00:00'),
                                                                                                                                  ('9HGBH41JXMN200003', 'EV-0013', 'EV Model Z Luxury', 2024, 9, '2024-03-10', '2024-03-10', '2027-03-10', 2000, '2024-03-10 12:00:00'),
                                                                                                                                  ('AHGBH41JXMN200004', 'EV-0014', 'EV Model X Pro', 2024, 10, '2024-03-15', '2024-03-15', '2027-03-15', 1800, '2024-03-15 13:00:00'),
                                                                                                                                  ('BHGBH41JXMN200005', 'EV-0015', 'EV Model Y Standard', 2024, 11, '2024-03-20', '2024-03-20', '2027-03-20', 1500, '2024-03-20 14:00:00'),
                                                                                                                                  ('CHGBH41JXMN200006', 'EV-0016', 'EV Model Z Luxury', 2024, 12, '2024-03-25', '2024-03-25', '2027-03-25', 1200, '2024-03-25 15:00:00'),
                                                                                                                                  -- Xe hết bảo hành để test
                                                                                                                                  ('DHGBH41JXMN200007', 'EV-0017', 'EV Model X Pro', 2020, 1, '2020-01-01', '2020-01-01', '2023-01-01', 89000, '2020-01-01 10:00:00'),
                                                                                                                                  -- THÊM: Xe hết bảo hành từ năm 2021-2022
                                                                                                                                  ('EXPIRED001', 'EV-0018', 'EV Model X Pro', 2020, 1, '2020-01-01', '2020-01-01', '2023-01-01', 85000, '2020-01-01 10:00:00'),
                                                                                                                                  ('EXPIRED002', 'EV-0019', 'EV Model Y Standard', 2021, 2, '2021-06-01', '2021-06-01', '2024-06-01', 65000, '2021-06-01 10:00:00'),
                                                                                                                                  ('EXPIRED003', 'EV-0020', 'EV Model Z Luxury', 2020, 3, '2020-12-01', '2020-12-01', '2023-12-01', 95000, '2020-12-01 10:00:00'),
                                                                                                                                  ('EXPIRED004', 'EV-0021', 'EV Model X Pro', 2021, 4, '2021-03-15', '2021-03-15', '2024-03-15', 78000, '2021-03-15 10:00:00'),
                                                                                                                                  -- Xe sắp hết bảo hành (trong vòng 6 tháng)
                                                                                                                                  ('EXPIRING001', 'EV-0022', 'EV Model Y Standard', 2022, 5, '2022-05-01', '2022-05-01', '2025-05-01', 45000, '2022-05-01 10:00:00'),
                                                                                                                                  ('EXPIRING002', 'EV-0023', 'EV Model X Pro', 2022, 6, '2022-08-01', '2022-08-01', '2025-08-01', 52000, '2022-08-01 10:00:00');

-- 5. WAREHOUSES (độc lập)
INSERT INTO warehouses (name, location, warehouse_type, active, created_at) VALUES
                                           ('Central Warehouse', '1000 Industrial Blvd, Dallas, TX 75201', 'main', 1, '2023-01-01 08:00:00'),
                                           ('West Coast Distribution', '2000 Logistics Way, Los Angeles, CA 90021', 'regional', 1, '2023-01-01 08:00:00'),
                                           ('East Coast Hub', '3000 Supply Chain Dr, Newark, NJ 07102', 'regional', 1, '2023-01-01 08:00:00');

-- 6. PARTS (độc lập)
INSERT INTO parts (part_number, name, category, description, unit_cost) VALUES
                                                                 ('BAT-LI-4680-100', 'Lithium Ion Battery Pack', 'Battery', 'High capacity 100kWh lithium ion battery pack', 5000.00),
                                                                 ('MOT-AC-200KW', 'AC Motor 200kW', 'Motor', '200kW AC induction motor for EV propulsion', 3000.00),
                                                                 ('INV-PWR-150KW', 'Power Inverter 150kW', 'Electronics', '150kW power inverter for motor control', 2500.00),
                                                                 ('CHG-PORT-CCS', 'CCS Charging Port', 'Charging', 'Combined Charging System port assembly', 100.00),
                                                                 ('CTRL-MCU-V2', 'Main Control Unit V2', 'Electronics', 'Primary vehicle control computer', 1500.00),
                                                                 ('SENS-TEMP-BAT', 'Battery Temperature Sensor', 'Sensors', 'High precision battery temperature monitoring sensor', 50.00),
                                                                 ('CABLE-HV-50MM', 'High Voltage Cable 50mm', 'Electrical', 'High voltage cable assembly 50mm diameter', 200.00),
                                                                 ('FUSE-HV-400A', 'High Voltage Fuse 400A', 'Safety', '400 Amp high voltage safety fuse', 800.00);

-- 7. INVENTORY (phụ thuộc vào warehouses và parts)
INSERT INTO inventory (warehouse_id, part_id, current_stock, reserved_stock, minimum_stock, maximum_stock, unit_cost, last_updated) VALUES
                                                                                             (1, 1, 50, 0, 10, 100, 5000.00, '2024-01-01 08:00:00'),
                                                                                             (1, 2, 30, 0, 5, 50, 3000.00, '2024-01-01 08:00:00'),
                                                                                             (1, 3, 25, 0, 5, 50, 2500.00, '2024-01-01 08:00:00'),
                                                                                             (1, 4, 100, 0, 20, 200, 100.00, '2024-01-01 08:00:00'),
                                                                                             (2, 1, 35, 0, 8, 80, 5000.00, '2024-01-01 08:00:00'),
                                                                                             (2, 5, 40, 0, 10, 100, 1500.00, '2024-01-01 08:00:00'),
                                                                                             (2, 6, 200, 0, 50, 500, 50.00, '2024-01-01 08:00:00'),
                                                                                             (3, 7, 150, 0, 30, 300, 200.00, '2024-01-01 08:00:00'),
                                                                                             (3, 8, 80, 0, 15, 150, 800.00, '2024-01-01 08:00:00');

-- 8. PART SERIALS (phụ thuộc vào parts và vehicles)
INSERT INTO part_serials (part_id, serial_number, manufacture_date, status, installed_on_vehicle_id, installed_at) VALUES
                                                                                                                       -- Serials đã lắp trên xe
                                                                                                                       (1, 'BAT001-2023-001', '2023-01-15', 'installed', 1, '2023-03-01 10:00:00'),
                                                                                                                       (1, 'BAT001-2023-002', '2023-01-16', 'installed', 2, '2023-03-05 11:00:00'),
                                                                                                                       (1, 'BAT001-2023-003', '2023-01-17', 'in_stock', NULL, NULL),
                                                                                                                       (2, 'MOT001-2023-001', '2023-02-01', 'installed', 1, '2023-03-01 10:00:00'),
                                                                                                                       (2, 'MOT001-2023-002', '2023-02-02', 'installed', 2, '2023-03-05 11:00:00'),
                                                                                                                       (3, 'INV001-2023-001', '2023-02-10', 'installed', 3, '2023-03-10 12:00:00'),
                                                                                                                       (4, 'CHG001-2023-001', '2023-02-15', 'installed', 1, '2023-03-01 10:00:00'),
                                                                                                                       (5, 'MCU001-2023-001', '2023-02-20', 'in_stock', NULL, NULL),

                                                                                                                       -- NEW: Thêm nhiều serials khả dụng cho testing Part Serial Management
                                                                                                                       -- Batteries (part_id = 1)
                                                                                                                       (1, 'BAT001-2024-004', '2024-01-20', 'in_stock', NULL, NULL),
                                                                                                                       (1, 'BAT001-2024-005', '2024-01-21', 'in_stock', NULL, NULL),
                                                                                                                       (1, 'BAT001-2024-006', '2024-01-22', 'in_stock', NULL, NULL),
                                                                                                                       (1, 'BAT001-2024-007', '2024-01-23', 'in_stock', NULL, NULL),
                                                                                                                       (1, 'BAT001-2024-008', '2024-01-24', 'in_stock', NULL, NULL),

                                                                                                                       -- Motors (part_id = 2)
                                                                                                                       (2, 'MOT001-2024-003', '2024-02-05', 'in_stock', NULL, NULL),
                                                                                                                       (2, 'MOT001-2024-004', '2024-02-06', 'in_stock', NULL, NULL),
                                                                                                                       (2, 'MOT001-2024-005', '2024-02-07', 'in_stock', NULL, NULL),

                                                                                                                       -- Inverters (part_id = 3)
                                                                                                                       (3, 'INV001-2024-002', '2024-02-12', 'in_stock', NULL, NULL),
                                                                                                                       (3, 'INV001-2024-003', '2024-02-13', 'in_stock', NULL, NULL),

                                                                                                                       -- Charging Ports (part_id = 4)
                                                                                                                       (4, 'CHG001-2024-002', '2024-02-18', 'in_stock', NULL, NULL),
                                                                                                                       (4, 'CHG001-2024-003', '2024-02-19', 'in_stock', NULL, NULL),

                                                                                                                       -- MCU (part_id = 5)
                                                                                                                       (5, 'MCU001-2024-002', '2024-02-25', 'in_stock', NULL, NULL),
                                                                                                                       (5, 'MCU001-2024-003', '2024-02-26', 'in_stock', NULL, NULL),

                                                                                                                       -- Temperature Sensors (part_id = 6)
                                                                                                                       (6, 'SENS001-2024-001', '2024-03-01', 'in_stock', NULL, NULL),
                                                                                                                       (6, 'SENS001-2024-002', '2024-03-02', 'in_stock', NULL, NULL),

                                                                                                                       -- HV Cables (part_id = 7)
                                                                                                                       (7, 'CABLE001-2024-001', '2024-03-05', 'in_stock', NULL, NULL),
                                                                                                                       (7, 'CABLE001-2024-002', '2024-03-06', 'in_stock', NULL, NULL),

                                                                                                                       -- HV Fuses (part_id = 8)
                                                                                                                       (8, 'FUSE001-2024-001', '2024-03-10', 'in_stock', NULL, NULL),
                                                                                                                       (8, 'FUSE001-2024-002', '2024-03-11', 'in_stock', NULL, NULL);

-- 9. CLAIM STATUSES (độc lập)
INSERT INTO claim_statuses (code, label) VALUES
                                             ('DRAFT', 'Draft'),
                                             ('OPEN', 'Open'),
                                             ('IN_PROGRESS', 'In Progress'),
                                             ('PENDING_PARTS', 'Pending Parts'),
                                             ('WAITING_FOR_PARTS', 'Waiting for Parts'),
                                             ('PENDING_APPROVAL', 'Pending Approval'),
                                             ('PENDING_EVM_APPROVAL', 'Pending EVM Approval'),
                                             ('EVM_APPROVED', 'EVM Approved'),
                                             ('EVM_REJECTED', 'EVM Rejected'),
                                             ('READY_FOR_REPAIR', 'Ready for Repair'),
                                             ('REPAIR_IN_PROGRESS', 'Repair In Progress'),
                                             ('FINAL_INSPECTION', 'Final Inspection'),
                                             ('REPAIR_COMPLETED', 'Repair Completed'),
                                             ('READY_FOR_HANDOVER', 'Ready for Handover'),
                                             ('HANDOVER_PENDING', 'Handover Pending'),
                                             ('COMPLETED', 'Completed'),
                                             ('CLOSED', 'Closed'),
                                             ('WAITING_FOR_CUSTOMER', 'Waiting for Customer'),
                                             ('REJECTED', 'Rejected'),
                                             ('CANCELLED', 'Cancelled'),
                                             -- 🆕 Problem handling statuses
                                             ('PROBLEM_CONFLICT', 'Problem Conflict - Awaiting EVM Resolution'),
                                             ('PROBLEM_SOLVED', 'Problem Solved - Ready to Continue');

-- Ensure INACTIVE exists (idempotent) so status lookups don't fail
IF NOT EXISTS (SELECT 1 FROM claim_statuses WHERE code = 'INACTIVE')
    INSERT INTO claim_statuses (code, label) VALUES ('INACTIVE', 'Inactive');

-- NEW STATUSES for out-of-warranty customer approval flow
IF NOT EXISTS (SELECT 1 FROM claim_statuses WHERE code = 'PENDING_CUSTOMER_APPROVAL')
    INSERT INTO claim_statuses (code, label) VALUES ('PENDING_CUSTOMER_APPROVAL', 'Chờ khách hàng xác nhận');
IF NOT EXISTS (SELECT 1 FROM claim_statuses WHERE code = 'CUSTOMER_APPROVED_THIRD_PARTY')
    INSERT INTO claim_statuses (code, label) VALUES ('CUSTOMER_APPROVED_THIRD_PARTY', 'Khách đồng ý linh kiện bên thứ 3');

-- NEW STATUSES for repair workflow
IF NOT EXISTS (SELECT 1 FROM claim_statuses WHERE code = 'CUSTOMER_PAYMENT_PENDING')
    INSERT INTO claim_statuses (code, label) VALUES ('CUSTOMER_PAYMENT_PENDING', 'Chờ thanh toán từ khách hàng');
IF NOT EXISTS (SELECT 1 FROM claim_statuses WHERE code = 'CUSTOMER_PAID')
    INSERT INTO claim_statuses (code, label) VALUES ('CUSTOMER_PAID', 'Khách hàng đã thanh toán');
IF NOT EXISTS (SELECT 1 FROM claim_statuses WHERE code = 'WORK_DONE')
    INSERT INTO claim_statuses (code, label) VALUES ('WORK_DONE', 'Công việc sửa chữa hoàn thành');
IF NOT EXISTS (SELECT 1 FROM claim_statuses WHERE code = 'CLAIM_DONE')
    INSERT INTO claim_statuses (code, label) VALUES ('CLAIM_DONE', 'Claim đã hoàn tất');

-- 10. CLAIMS (phụ thuộc vào vehicles, users, claim_statuses, customers)
INSERT INTO claims (claim_number, vehicle_id, customer_id, created_by, created_at, reported_failure, initial_diagnosis, status_id, assigned_technician_id, approved_by, approved_at, warranty_cost, is_active) VALUES
('CLM-2024-001', 1, 1, 3, '2024-01-15 09:00:00', 'Battery not charging properly, shows error code B001', 'Potential battery management system failure', 2, 4, NULL, NULL, 0.00, 1),
('CLM-2024-002', 2, 2, 3, '2024-01-20 10:30:00', 'Motor making unusual noise during acceleration', 'Motor bearing inspection required', 1, NULL, NULL, NULL, 0.00, 1),
('CLM-2024-003', 3, 3, 4, '2024-02-01 14:15:00', 'Charging port not accepting CCS connector', 'Charging port mechanism fault', 3, 5, NULL, NULL, 250.00, 1),
('CLM-2024-004', 4, 4, 3, '2024-02-10 11:45:00', 'Vehicle randomly shutting down while driving', 'Main control unit diagnostic needed', 2, 4, 2, '2024-02-12 16:00:00', 1500.00, 1),
('CLM-2024-005', 1, 1, 4, '2024-02-15 08:30:00', 'Temperature warning light constantly on', 'Battery temperature sensor malfunction', 6, 4, 2, '2024-02-18 10:00:00', 75.00, 1),
('CLM-2024-006', 11, 7, 3, '2024-03-01 09:00:00', 'Display screen flickering and unresponsive', 'Main display unit malfunction', 1, NULL, NULL, NULL, 0.00, 1),
('CLM-2024-007', 12, 8, 3, '2024-03-02 10:00:00', 'Regenerative braking not working effectively', 'Motor controller diagnostic required', 2, 4, NULL, NULL, 0.00, 1),
('CLM-2024-008', 13, 9, 6, '2024-03-05 11:00:00', 'Battery capacity reduced by 30% suddenly', 'Battery cell failure suspected', 3, 5, NULL, NULL, 0.00, 1),
('CLM-2024-009', 14, 10, 3, '2024-03-10 12:00:00', 'High voltage warning light stays on', 'HV system insulation fault', 4, 5, NULL, NULL, 0.00, 1),
('CLM-2024-010', 15, 11, 6, '2024-03-12 13:00:00', 'Vehicle will not start, no error codes', 'Main power contactor issue', 5, 4, 2, '2024-03-14 15:00:00', 800.00, 1),
('CLM-2024-011', 16, 12, 3, '2024-03-15 14:00:00', 'Charging extremely slow on all chargers', 'Onboard charger failure', 6, 5, 2, '2024-03-18 16:00:00', 1200.00, 1),
('CLM-2024-012', 5, 5, 3, '2024-03-20 09:30:00', 'Air conditioning not working, compressor noisy', 'AC compressor bearing failure', 7, NULL, 2, '2024-03-21 10:00:00', 0.00, 1),
('CLM-2024-013', 6, 6, 6, '2024-03-22 10:00:00', 'Customer wants to cancel appointment', 'Cancelled by customer request', 8, NULL, NULL, NULL, 0.00, 1),
('CLM-2024-014', 2, 2, 3, '2024-03-25 11:00:00', 'Rear motor overheating during long drives', 'Cooling system inspection needed', 2, 4, NULL, NULL, 0.00, 1),
('CLM-2024-015', 7, 2, 3, '2024-04-01 08:00:00', 'Power inverter failure warning', 'Inverter module replacement required', 4, 5, NULL, NULL, 0.00, 1),
('CLM-2024-016', 8, 3, 6, '2024-04-05 09:00:00', 'Loss of power during acceleration', 'Battery connection issue', 5, 4, 2, '2024-04-07 14:00:00', 450.00, 1),
('CLM-2024-017', 9, 4, 3, '2024-04-10 10:00:00', 'Steering assist warning light on', 'Power steering motor fault', 1, NULL, NULL, NULL, 0.00, 1),
('CLM-2024-018', 10, 5, 3, '2024-04-15 11:00:00', 'Strange vibration at high speed', 'Drivetrain inspection required', 2, 5, NULL, NULL, 0.00, 1),
('CLM-2024-019', 17, 1, 3, '2024-04-20 12:00:00', 'Battery replacement needed', 'Vehicle out of warranty', 7, NULL, 2, '2024-04-20 13:00:00', 0.00, 1),
('CLM-2024-020', 18, 1, 3, '2024-06-01 10:00:00', 'Battery replacement needed - warranty expired 2023', 'Customer informed warranty expired, battery replacement quote provided', 10, 4, 2, '2024-06-01 11:00:00', 8500.00, 1),
('CLM-2024-021', 19, 2, 3, '2024-07-15 14:30:00', 'Motor bearing noise - out of warranty repair', 'Motor bearing replacement required, customer pay', 10, 5, 2, '2024-07-15 15:00:00', 3200.00, 1),
('CLM-2024-022', 20, 3, 6, '2024-08-20 09:45:00', 'Charging port malfunction - post warranty', 'Charging port assembly replacement needed', 10, 4, 2, '2024-08-20 10:15:00', 1200.00, 1),
('CLM-2024-023', 21, 4, 3, '2024-09-10 16:20:00', 'Control unit failure - warranty expired', 'MCU replacement, customer responsible for cost', 10, 5, 2, '2024-09-10 17:00:00', 2800.00, 1),
('CLM-2024-024', 22, 5, 3, '2024-10-01 08:00:00', 'Battery temperature sensor warning - near warranty end', 'Sensor replacement covered under warranty', 6, 4, 2, '2024-10-02 14:00:00', 125.00, 1),
('CLM-2024-025', 23, 6, 6, '2024-10-15 11:30:00', 'Display flickering issue - warranty ending soon', 'Display unit replacement approved', 5, 5, 2, '2024-10-16 09:00:00', 950.00, 1),
('CLM-2024-026', 18, 1, 3, '2024-11-01 13:00:00', 'Follow-up repair after battery replacement', 'Additional cooling system repair needed', 7, 4, 2, '2024-11-01 14:00:00', 450.00, 1),
('CLM-2024-027', 19, 2, 6, '2024-11-15 10:00:00', 'Power inverter replacement - customer pay', 'High voltage inverter module failure', 8, 5, 2, '2024-11-15 11:00:00', 4200.00, 1);

-- 11. RECALL CAMPAIGNS (phụ thuộc vào users)
INSERT INTO recall_campaigns (code, title, description, created_by, released_at, status) VALUES
                                                                                             ('RC-2024-001', 'Battery Management System Update', 'Software update for battery management system to prevent overheating in certain conditions', 2, '2024-01-01 00:00:00', 'active'),
                                                                                             ('RC-2024-002', 'Charging Port Replacement Program', 'Replacement of charging ports manufactured between Jan-Mar 2023 due to connector wear issues', 2, '2024-02-01 00:00:00', 'active'),
                                                                                             ('RC-2024-003', 'Motor Bearing Inspection', 'Inspection and potential replacement of motor bearings in 2022-2023 model year vehicles', 2, NULL, 'draft');

-- 12. SHIPMENTS (phụ thuộc vào warehouses và users)
INSERT INTO shipments (warehouse_id, destination_center_id, created_by, shipped_at, status, tracking_number, carrier, notes, created_at) VALUES
                                                                                                (1, 1, 2, '2024-01-10 08:00:00', 'delivered', 'TRK001', 'FedEx', 'Urgent delivery', '2024-01-09 08:00:00'),
                                                                                                (2, 2, 2, '2024-01-15 09:00:00', 'in_transit', 'TRK002', 'UPS', 'Standard delivery', '2024-01-14 09:00:00'),
                                                                                                (1, 3, 3, NULL, 'pending', 'TRK003', 'DHL', 'Scheduled delivery', '2024-01-20 10:00:00');

-- 13. APPOINTMENTS (phụ thuộc vào vehicles, claims, users)
INSERT INTO appointments (vehicle_id, claim_id, scheduled_at, created_by, status, notified_customer, created_at) VALUES
                                                                                                                     (1, 1, '2024-01-17 10:00:00', 4, 'scheduled', 1, '2024-01-15 08:00:00'),
                                                                                                                     (2, 2, '2024-01-25 14:00:00', 3, 'scheduled', 1, '2024-01-20 09:00:00'),
                                                                                                                     (3, 3, '2024-02-05 09:00:00', 5, 'completed', 1, '2024-02-01 13:00:00'),
                                                                                                                     (4, 4, '2024-02-13 08:00:00', 4, 'completed', 1, '2024-02-10 10:00:00'),
                                                                                                                     (1, 5, '2024-02-17 11:00:00', 4, 'completed', 1, '2024-02-15 07:00:00'),
                                                                                                                     -- NEW: Thêm appointments mới
                                                                                                                     (11, 6, '2024-03-03 09:00:00', 3, 'scheduled', 1, '2024-03-01 08:00:00'),
                                                                                                                     (12, 7, '2024-03-04 10:00:00', 4, 'in_progress', 1, '2024-03-02 09:00:00'),
                                                                                                                     (13, 8, '2024-03-07 11:00:00', 5, 'scheduled', 1, '2024-03-05 10:00:00'),
                                                                                                                     (14, 9, '2024-03-12 14:00:00', 5, 'scheduled', 1, '2024-03-10 11:00:00'),
                                                                                                                     (15, 10, '2024-03-14 08:00:00', 4, 'completed', 1, '2024-03-12 12:00:00'),
                                                                                                                     (16, 11, '2024-03-18 13:00:00', 5, 'completed', 1, '2024-03-15 13:00:00'),
                                                                                                                     (6, 13, '2024-03-23 10:00:00', 6, 'cancelled', 1, '2024-03-22 09:00:00'),
                                                                                                                     (2, 14, '2024-03-27 09:00:00', 4, 'in_progress', 1, '2024-03-25 10:00:00'),
                                                                                                                     (7, 15, '2024-04-03 10:00:00', 5, 'scheduled', 1, '2024-04-01 07:00:00'),
                                                                                                                     (8, 16, '2024-04-08 11:00:00', 4, 'completed', 1, '2024-04-05 08:00:00'),
                                                                                                                     (9, 17, '2024-04-12 14:00:00', 3, 'scheduled', 1, '2024-04-10 09:00:00'),
                                                                                                                     (10, 18, '2024-04-17 09:00:00', 5, 'scheduled', 0, '2024-04-15 10:00:00'),
                                                                                                                     -- THÊM: Appointments cho out-of-warranty repairs
                                                                                                                     (18, 20, '2024-06-02 08:00:00', 3, 'completed', 1, '2024-06-01 12:00:00'),
                                                                                                                     (19, 21, '2024-07-16 09:00:00', 3, 'completed', 1, '2024-07-15 16:00:00'),
                                                                                                                     (20, 22, '2024-08-21 10:00:00', 6, 'completed', 1, '2024-08-20 11:00:00'),
                                                                                                                     (21, 23, '2024-09-11 08:00:00', 3, 'completed', 1, '2024-09-10 18:00:00'),
                                                                                                                     (22, 24, '2024-10-02 08:00:00', 3, 'completed', 1, '2024-10-01 10:00:00'),
                                                                                                                     (23, 25, '2024-10-16 13:00:00', 6, 'completed', 1, '2024-10-15 13:00:00'),
                                                                                                                     (18, 26, '2024-11-02 09:00:00', 3, 'completed', 1, '2024-11-01 15:00:00'),
                                                                                                                     (19, 27, '2024-11-16 08:00:00', 6, 'completed', 1, '2024-11-15 12:00:00');

-- 14. WORK ORDERS (phụ thuộc vào claims và users)
INSERT INTO work_orders (claim_id, technician_id, start_time, end_time, result, labor_hours) VALUES
                                                                                                 (4, 4, '2024-02-13 08:00:00', '2024-02-13 16:30:00', 'Replaced main control unit. System diagnostic passed. Vehicle operational.', 8.5),
                                                                                                 (5, 4, '2024-02-17 11:00:00', '2024-02-17 13:00:00', 'Replaced battery temperature sensor. Temperature readings normal.', 2.0),
                                                                                                 -- NEW: Thêm work orders mới
                                                                                                 (7, 4, '2024-03-04 10:00:00', NULL, 'Diagnostic in progress. Motor controller showing intermittent faults.', NULL),
                                                                                                 (10, 4, '2024-03-14 08:00:00', '2024-03-14 15:00:00', 'Replaced main power contactor. Tested all HV systems. Vehicle starts normally.', 7.0),
                                                                                                 (11, 5, '2024-03-18 13:00:00', '2024-03-18 18:30:00', 'Replaced onboard charger module. Full charge cycle tested successfully.', 5.5),
                                                                                                 (14, 4, '2024-03-27 09:00:00', NULL, 'Cooling system inspection ongoing. Found coolant leak in rear motor cooling circuit.', NULL),
                                                                                                 (16, 4, '2024-04-08 11:00:00', '2024-04-08 15:30:00', 'Tightened all battery HV connections. Verified proper torque specs. Test drive completed.', 4.5),
                                                                                                 -- THÊM: Work orders cho out-of-warranty repairs
                                                                                                 (20, 4, '2024-06-02 08:00:00', '2024-06-02 17:30:00', 'Battery pack replaced with customer-purchased unit. Full system testing completed.', 9.5),
                                                                                                 (21, 5, '2024-07-16 09:00:00', '2024-07-16 16:00:00', 'Motor bearing assembly replaced. Customer paid repair completed successfully.', 7.0),
                                                                                                 (22, 4, '2024-08-21 10:00:00', '2024-08-21 13:30:00', 'Charging port replaced. Tested with all connector types.', 3.5),
                                                                                                 (23, 5, '2024-09-11 08:00:00', '2024-09-11 16:30:00', 'MCU replacement completed. All systems recalibrated and tested.', 8.5),
                                                                                                 (24, 4, '2024-10-02 08:00:00', '2024-10-02 10:00:00', 'Temperature sensor replaced under warranty. System normal.', 2.0),
                                                                                                 (25, 5, '2024-10-16 13:00:00', '2024-10-16 17:00:00', 'Display unit replaced. Software updated and calibrated.', 4.0),
                                                                                                 (26, 4, '2024-11-02 09:00:00', '2024-11-02 12:00:00', 'Cooling system leak repaired. Additional customer-paid work.', 3.0),
                                                                                                 (27, 5, '2024-11-16 08:00:00', '2024-11-16 15:30:00', 'Power inverter module replaced. High voltage testing passed.', 7.5);

-- 15. CLAIM STATUS HISTORY (phụ thuộc vào claims, claim_statuses, users)
INSERT INTO claim_status_history (claim_id, status_id, changed_by, changed_at, note) VALUES
                                                                                         (1, 1, 3, '2024-01-15 09:00:00', 'Initial claim creation'),
                                                                                         (1, 2, 4, '2024-01-16 08:00:00', 'Assigned to technician for diagnosis'),
                                                                                         (2, 1, 3, '2024-01-20 10:30:00', 'Customer reported motor noise issue'),
                                                                                         (3, 1, 4, '2024-02-01 14:15:00', 'Charging port issue reported'),
                                                                                         (3, 3, 5, '2024-02-02 09:00:00', 'Waiting for replacement charging port'),
                                                                                         (4, 1, 3, '2024-02-10 11:45:00', 'Critical safety issue reported'),
                                                                                         (4, 2, 4, '2024-02-11 08:00:00', 'High priority diagnostic started'),
                                                                                         (4, 5, 2, '2024-02-12 16:00:00', 'Approved for MCU replacement'),
                                                                                         (5, 1, 4, '2024-02-15 08:30:00', 'Temperature sensor issue'),
                                                                                         (5, 6, 4, '2024-02-18 10:00:00', 'Sensor replaced and tested'),
                                                                                         -- NEW: Thêm status history cho claims mới
                                                                                         (6, 1, 3, '2024-03-01 09:00:00', 'Customer reported display issues'),
                                                                                         (7, 1, 3, '2024-03-02 10:00:00', 'Regenerative braking issue reported'),
                                                                                         (7, 2, 4, '2024-03-03 08:00:00', 'Assigned to technician Bob Wilson'),
                                                                                         (8, 1, 6, '2024-03-05 11:00:00', 'Battery capacity drop reported'),
                                                                                         (8, 2, 5, '2024-03-06 09:00:00', 'Diagnostic started by Carol Davis'),
                                                                                         (8, 3, 5, '2024-03-06 15:00:00', 'Waiting for replacement battery pack'),
                                                                                         (9, 1, 3, '2024-03-10 12:00:00', 'HV warning light issue'),
                                                                                         (9, 2, 5, '2024-03-11 08:00:00', 'Assigned to technician'),
                                                                                         (9, 4, 5, '2024-03-11 16:00:00', 'Submitted for EVM approval'),
                                                                                         (10, 1, 6, '2024-03-12 13:00:00', 'No start condition reported'),
                                                                                         (10, 2, 4, '2024-03-13 08:00:00', 'Diagnostic in progress'),
                                                                                         (10, 4, 4, '2024-03-13 16:00:00', 'Pending approval for contactor replacement'),
                                                                                         (10, 5, 2, '2024-03-14 15:00:00', 'Approved by EVM staff'),
                                                                                         (10, 6, 4, '2024-03-14 17:00:00', 'Repair completed successfully'),
                                                                                         (11, 1, 3, '2024-03-15 14:00:00', 'Slow charging issue reported'),
                                                                                         (11, 2, 5, '2024-03-16 08:00:00', 'Diagnostic confirmed charger failure'),
                                                                                         (11, 4, 5, '2024-03-16 16:00:00', 'Submitted for approval'),
                                                                                         (11, 5, 2, '2024-03-17 10:00:00', 'Approved'),
                                                                                         (11, 6, 5, '2024-03-18 19:00:00', 'Charger replaced and tested'),
                                                                                         (12, 1, 3, '2024-03-20 09:30:00', 'AC compressor issue'),
                                                                                         (12, 7, 2, '2024-03-21 10:00:00', 'Rejected - AC not covered under powertrain warranty'),
                                                                                         (13, 1, 6, '2024-03-22 10:00:00', 'Customer appointment scheduled'),
                                                                                         (13, 8, 6, '2024-03-22 11:00:00', 'Cancelled by customer request'),
                                                                                         (14, 1, 3, '2024-03-25 11:00:00', 'Motor overheating reported'),
                                                                                         (14, 2, 4, '2024-03-26 08:00:00', 'Diagnosis in progress'),
                                                                                         (15, 1, 3, '2024-04-01 08:00:00', 'Power inverter warning'),
                                                                                         (15, 2, 5, '2024-04-02 09:00:00', 'Diagnostic confirmed inverter failure'),
                                                                                         (15, 4, 5, '2024-04-02 16:00:00', 'Pending approval - high cost repair'),
                                                                                         (16, 1, 6, '2024-04-05 09:00:00', 'Loss of power reported'),
                                                                                         (16, 2, 4, '2024-04-06 08:00:00', 'Found loose HV connections'),
                                                                                         (16, 4, 4, '2024-04-06 15:00:00', 'Submitted for approval'),
                                                                                         (16, 5, 2, '2024-04-07 14:00:00', 'Approved for repair'),
                                                                                         (16, 6, 4, '2024-04-08 16:00:00', 'Completed and tested'),
                                                                                         (17, 1, 3, '2024-04-10 10:00:00', 'Steering assist warning'),
                                                                                         (18, 1, 3, '2024-04-15 11:00:00', 'Vibration issue reported'),
                                                                                         (18, 2, 5, '2024-04-16 08:00:00', 'Drivetrain inspection scheduled'),
                                                                                         (19, 1, 3, '2024-04-20 12:00:00', 'Battery replacement request'),
                                                                                         (19, 7, 2, '2024-04-20 13:00:00', 'Rejected - vehicle warranty expired'),
                                                                                         -- THÊM: Cập nhật claim status history cho out-of-warranty claims
                                                                                         -- CLM-2024-020 (Battery replacement - expired warranty)
                                                                                         (20, 1, 3, '2024-06-01 10:00:00', 'Customer reported battery issues'),
                                                                                         (20, 7, 3, '2024-06-01 10:30:00', 'Warranty check: EXPIRED 2023-01-01'),
                                                                                         (20, 10, 2, '2024-06-01 11:00:00', 'Customer informed of out-of-warranty cost: $8,500'),
                                                                                         -- CLM-2024-021 (Motor bearing - expired warranty)
                                                                                         (21, 1, 3, '2024-07-15 14:30:00', 'Motor bearing noise reported'),
                                                                                         (21, 7, 3, '2024-07-15 14:45:00', 'Warranty expired - customer responsible for repair'),
                                                                                         (21, 10, 2, '2024-07-15 15:00:00', 'Customer approved repair quote: $3,200'),
                                                                                         -- CLM-2024-022 (Charging port - expired warranty)
                                                                                         (22, 1, 6, '2024-08-20 09:45:00', 'Charging port not functioning'),
                                                                                         (22, 7, 6, '2024-08-20 10:00:00', 'Out of warranty repair - customer quote provided'),
                                                                                         (22, 10, 2, '2024-08-20 10:15:00', 'Customer authorized repair: $1,200'),
                                                                                         -- CLM-2024-023 (MCU failure - expired warranty)
                                                                                         (23, 1, 3, '2024-09-10 16:20:00', 'Control unit completely failed'),
                                                                                         (23, 7, 3, '2024-09-10 16:45:00', 'Warranty verification: EXPIRED'),
                                                                                         (23, 10, 2, '2024-09-10 17:00:00', 'Customer agreed to MCU replacement: $2,800'),
                                                                                         -- CLM-2024-024 (Near expiry but still covered)
                                                                                         (24, 1, 3, '2024-10-01 08:00:00', 'Temperature sensor warning light'),
                                                                                         (24, 2, 4, '2024-10-01 09:00:00', 'Warranty valid until 2025-05-01 - repair covered'),
                                                                                         (24, 6, 4, '2024-10-02 14:00:00', 'Sensor replaced under warranty'),
                                                                                         -- CLM-2024-025 (Near expiry but still covered)
                                                                                         (25, 1, 6, '2024-10-15 11:30:00', 'Display screen flickering'),
                                                                                         (25, 2, 5, '2024-10-15 12:00:00', 'Warranty expires 2025-08-01 - covered repair'),
                                                                                         (25, 5, 2, '2024-10-16 09:00:00', 'Display replacement approved'),
                                                                                         -- CLM-2024-026 (Follow-up out-of-warranty)
                                                                                         (26, 1, 3, '2024-11-01 13:00:00', 'Cooling system issue after battery work'),
                                                                                         (26, 7, 3, '2024-11-01 13:30:00', 'Additional repair - customer responsibility'),
                                                                                         -- CLM-2024-027 (Inverter - customer pay)
                                                                                         (27, 1, 6, '2024-11-15 10:00:00', 'Power inverter fault codes'),
                                                                                         (27, 8, 6, '2024-11-15 10:30:00', 'Out of warranty - customer declined initial quote'),
                                                                                         (27, 10, 2, '2024-11-15 11:00:00', 'Customer approved after negotiation: $4,200');

-- 16. CAMPAIGN VEHICLES (phụ thuộc vào recall_campaigns và vehicles)
INSERT INTO campaign_vehicles (campaign_id, vehicle_id, notified, processed, processed_at) VALUES
                                                                                               (1, 1, 1, 1, '2024-01-15 10:00:00'),
                                                                                               (1, 2, 1, 0, NULL),
                                                                                               (1, 4, 1, 0, NULL),
                                                                                               (2, 1, 1, 0, NULL),
                                                                                               (2, 2, 1, 0, NULL),
                                                                                               (2, 3, 0, 0, NULL);

-- 17. SHIPMENT ITEMS (phụ thuộc vào shipments và parts)
INSERT INTO shipment_items (shipment_id, part_id, quantity) VALUES
                                                                (1, 5, 2),  -- MCU units
                                                                (1, 6, 10), -- Temperature sensors
                                                                (2, 4, 5),  -- Charging ports
                                                                (2, 8, 20), -- HV fuses
                                                                (3, 1, 1);  -- Battery pack

-- 18. WORK ORDER PARTS (phụ thuộc vào work_orders, part_serials, parts)
INSERT INTO work_order_parts (work_order_id, part_serial_id, part_id, quantity) VALUES
                                                                                    (1, 8, 5, 1),  -- MCU replacement
                                                                                    (2, NULL, 6, 1),  -- Temperature sensor (no serial tracking for small parts)
                                                                                    -- NEW: Thêm parts cho work orders mới
                                                                                    (4, NULL, 7, 2),  -- HV cables for contactor replacement
                                                                                    (4, NULL, 8, 3),  -- HV fuses for contactor replacement
                                                                                    (5, 19, 3, 1),  -- Inverter (using serial INV001-2024-002)
                                                                                    (7, NULL, 7, 1);  -- HV cable for battery connection

-- 19. CLAIM ATTACHMENTS (phụ thuộc vào claims và users)
INSERT INTO claim_attachments (claim_id, file_path, file_name, original_file_name, file_type, uploaded_by, upload_date) VALUES
    (1, '/uploads/claims/CLM-2024-001/battery_error_screenshot.jpg', 'battery_error_screenshot.jpg', 'battery_error_screenshot.jpg', 'image/jpeg', 3, '2024-01-15 09:15:00'),
    (1, '/uploads/claims/CLM-2024-001/diagnostic_report.pdf', 'diagnostic_report.pdf', 'diagnostic_report.pdf', 'application/pdf', 4, '2024-01-16 10:00:00'),
    (2, '/uploads/claims/CLM-2024-002/motor_noise_video.mp4', 'motor_noise_video.mp4', 'motor_noise_video.mp4', 'video/mp4', 3, '2024-01-20 10:45:00'),
    (3, '/uploads/claims/CLM-2024-003/charging_port_photo.jpg', 'charging_port_photo.jpg', 'charging_port_photo.jpg', 'image/jpeg', 4, '2024-02-01 14:30:00'),
    (4, '/uploads/claims/CLM-2024-004/shutdown_logs.txt', 'shutdown_logs.txt', 'shutdown_logs.txt', 'text/plain', 3, '2024-02-10 12:00:00'),
    (6, '/uploads/claims/CLM-2024-006/display_flicker.mp4', 'display_flicker.mp4', 'display_flicker.mp4', 'video/mp4', 3, '2024-03-01 09:30:00'),
    (7, '/uploads/claims/CLM-2024-007/brake_test_results.pdf', 'brake_test_results.pdf', 'brake_test_results.pdf', 'application/pdf', 4, '2024-03-02 11:00:00'),
    (8, '/uploads/claims/CLM-2024-008/battery_health_report.pdf', 'battery_health_report.pdf', 'battery_health_report.pdf', 'application/pdf', 6, '2024-03-05 12:00:00'),
    (8, '/uploads/claims/CLM-2024-008/capacity_graph.jpg', 'capacity_graph.jpg', 'capacity_graph.jpg', 'image/jpeg', 5, '2024-03-06 10:00:00'),
    (9, '/uploads/claims/CLM-2024-009/hv_warning_photo.jpg', 'hv_warning_photo.jpg', 'hv_warning_photo.jpg', 'image/jpeg', 3, '2024-03-10 13:00:00'),
    (10, '/uploads/claims/CLM-2024-010/no_start_video.mp4', 'no_start_video.mp4', 'no_start_video.mp4', 'video/mp4', 6, '2024-03-12 14:00:00');

-- VEHICLE MODELS
INSERT INTO vehicle_models (code, name, brand, description, active, updated_by, created_at, updated_at) VALUES
('EV-X-PRO-2024','EV Model X Pro','EVOEM','High-performance AWD variant', 1, 'seed', GETDATE(), GETDATE()),
('EV-Y-STD-2023','EV Model Y Standard','EVOEM','Entry-level long range', 1, 'seed', GETDATE(), GETDATE()),
('EV-Z-LUX-2024','EV Model Z Luxury','EVOEM','Luxury trim full options', 1, 'seed', GETDATE(), GETDATE());

-- WARRANTY CONDITIONS (by vehicle model)
-- Vehicle Model 1: EV-X-PRO-2024
INSERT INTO warranty_conditions (vehicle_model_id, coverage_years, coverage_km, conditions_text, effective_from, effective_to, active, created_at, updated_at, updated_by) VALUES
(1, 3, 100000, 'Standard warranty: 3 years or 100,000 km, whichever comes first. Covers all powertrain components, battery system, and electrical systems. Excludes normal wear and tear, tires, and cosmetic damage.', '2024-01-01', NULL, 1, '2024-01-01 08:00:00', '2024-01-01 08:00:00', 'admin'),
(1, 5, 150000, 'Extended warranty: 5 years or 150,000 km for battery pack and motor. Additional coverage for high-voltage components.', '2024-01-01', NULL, 1, '2024-01-01 08:00:00', '2024-01-01 08:00:00', 'admin');

-- Vehicle Model 2: EV-Y-STD-2023
INSERT INTO warranty_conditions (vehicle_model_id, coverage_years, coverage_km, conditions_text, effective_from, effective_to, active, created_at, updated_at, updated_by) VALUES
(2, 3, 100000, 'Standard warranty: 3 years or 100,000 km. Covers powertrain, battery (8 years or 160,000 km), and charging system.', '2023-01-01', NULL, 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00', 'admin'),
(2, 2, 60000, 'Basic warranty: 2 years or 60,000 km for vehicle body and interior components.', '2023-01-01', NULL, 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00', 'admin');

-- Vehicle Model 3: EV-Z-LUX-2024
INSERT INTO warranty_conditions (vehicle_model_id, coverage_years, coverage_km, conditions_text, effective_from, effective_to, active, created_at, updated_at, updated_by) VALUES
(3, 4, 120000, 'Premium warranty: 4 years or 120,000 km comprehensive coverage. Includes all systems, premium roadside assistance, and loaner vehicle program.', '2024-01-01', NULL, 1, '2024-01-01 08:00:00', '2024-01-01 08:00:00', 'admin'),
(3, 8, 200000, 'Battery warranty: 8 years or 200,000 km for battery pack with minimum 70% capacity retention.', '2024-01-01', NULL, 1, '2024-01-01 08:00:00', '2024-01-01 08:00:00', 'admin');

-- THIRD-PARTY PARTS (for each service center)
-- Service Center 1 (SC-HCM-001)
INSERT INTO third_party_parts (part_number, name, category, description, supplier, unit_cost, service_center_id, active, created_at, updated_at, updated_by) VALUES
('TP-HCM-001', 'Battery Charger Adapter', 'Charging', 'Third-party fast charger adapter compatible with CCS Type 2', 'TechParts Co.', 250.00, 1, 1, '2023-01-15 08:00:00', '2023-01-15 08:00:00', 'admin'),
('TP-HCM-002', 'Floor Mats Set', 'Interior', 'Premium all-weather floor mats for EV models', 'AutoAccessories Ltd.', 120.00, 1, 1, '2023-01-15 08:00:00', '2023-01-15 08:00:00', 'admin'),
('TP-HCM-003', 'Tire Pressure Sensor', 'Safety', 'Aftermarket TPMS sensor compatible with EV systems', 'SafeDrive Parts', 85.00, 1, 1, '2023-01-15 08:00:00', '2023-01-15 08:00:00', 'admin');

-- Service Center 2 (SC-HN-001)
INSERT INTO third_party_parts (part_number, name, category, description, supplier, unit_cost, service_center_id, active, created_at, updated_at, updated_by) VALUES
('TP-HN-001', 'LED Headlight Bulb', 'Lighting', 'High-performance LED replacement bulbs', 'BrightLights Inc.', 150.00, 2, 1, '2023-01-15 08:00:00', '2023-01-15 08:00:00', 'admin'),
('TP-HN-002', 'Cabin Air Filter', 'HVAC', 'Premium HEPA cabin air filter', 'CleanAir Filters', 45.00, 2, 1, '2023-01-15 08:00:00', '2023-01-15 08:00:00', 'admin'),
('TP-HN-003', 'Wiper Blades Set', 'Exterior', 'Aero wiper blades for improved visibility', 'RainClear Parts', 35.00, 2, 1, '2023-01-15 08:00:00', '2023-01-15 08:00:00', 'admin');

-- Service Center 3 (SC-DN-001)
INSERT INTO third_party_parts (part_number, name, category, description, supplier, unit_cost, service_center_id, active, created_at, updated_at, updated_by) VALUES
('TP-DN-001', 'Charging Cable Extension', 'Charging', '10-meter extension cable for home charging', 'ChargePro Solutions', 180.00, 3, 1, '2023-01-15 08:00:00', '2023-01-15 08:00:00', 'admin'),
('TP-DN-002', 'Dashboard Cover', 'Interior', 'UV protection dashboard cover', 'SunShield Auto', 95.00, 3, 1, '2023-01-15 08:00:00', '2023-01-15 08:00:00', 'admin'),
('TP-DN-003', 'Brake Pad Set (Front)', 'Brakes', 'Ceramic brake pads for improved stopping power', 'BrakeTech Industries', 220.00, 3, 1, '2023-01-15 08:00:00', '2023-01-15 08:00:00', 'admin');

-- Service Centers 4-10 (branches and additional centers)
INSERT INTO third_party_parts (part_number, name, category, description, supplier, unit_cost, service_center_id, active, created_at, updated_at, updated_by) VALUES
('TP-HCM-002-001', 'Wheel Center Cap', 'Exterior', 'Replacement wheel center cap set', 'WheelAccessories', 25.00, 4, 1, '2023-02-01 08:00:00', '2023-02-01 08:00:00', 'admin'),
('TP-HCM-003-001', 'Door Handle Cover', 'Exterior', 'Chrome door handle covers', 'StyleParts Co.', 40.00, 5, 1, '2023-03-01 08:00:00', '2023-03-01 08:00:00', 'admin'),
('TP-HN-002-001', 'Rearview Mirror', 'Safety', 'Auto-dimming rearview mirror', 'MirrorTech', 180.00, 6, 1, '2023-04-01 08:00:00', '2023-04-01 08:00:00', 'admin'),
('TP-HN-003-001', 'License Plate Frame', 'Exterior', 'Custom license plate frame', 'PlateDesign', 15.00, 7, 1, '2023-05-01 08:00:00', '2023-05-01 08:00:00', 'admin'),
('TP-CT-001', 'Tire Repair Kit', 'Safety', 'Emergency tire repair kit with sealant', 'RoadSafe Tools', 65.00, 8, 1, '2023-06-01 08:00:00', '2023-06-01 08:00:00', 'admin'),
('TP-HP-001', 'Phone Mount', 'Interior', 'Magnetic phone mount for dashboard', 'MountPro', 30.00, 9, 1, '2023-07-01 08:00:00', '2023-07-01 08:00:00', 'admin'),
('TP-DN-002-001', 'Paint Protection Film', 'Exterior', 'PPF for front bumper protection', 'ProtectShield', 350.00, 10, 1, '2023-08-01 08:00:00', '2023-08-01 08:00:00', 'admin');

-- SERVICE HISTORY (for example vehicles and customers)
INSERT INTO service_history (vehicle_id, customer_id, service_type, description, performed_at, performed_by, mileage_km) VALUES
(1, 1, 'warranty_repair', 'Battery management system diagnostic and software update', '2024-01-20 10:00:00', 4, 25000),
(1, 1, 'maintenance', 'Regular maintenance check: tire rotation, fluid top-up, brake inspection', '2024-02-15 14:30:00', 4, 27500),
(2, 2, 'warranty_repair', 'Motor bearing inspection and noise diagnosis', '2024-01-25 09:00:00', 5, 18000),
(3, 3, 'warranty_repair', 'Charging port mechanism replacement', '2024-02-05 11:00:00', 5, 22000),
(4, 4, 'warranty_repair', 'Main control unit replacement and system recalibration', '2024-02-13 08:00:00', 4, 35000),
(5, 5, 'maintenance', 'Annual service: battery health check, cabin filter replacement', '2024-03-01 10:00:00', 4, 8000),
(6, 6, 'recall', 'Battery management system software update (RC-2024-001)', '2024-01-18 13:00:00', 4, 5000),
(11, 7, 'warranty_repair', 'Display screen replacement and calibration', '2024-03-03 09:00:00', 5, 3000),
(12, 8, 'maintenance', 'Pre-delivery inspection and vehicle preparation', '2024-03-05 08:00:00', 4, 2500),
(13, 9, 'warranty_repair', 'Battery capacity diagnostic and cell replacement', '2024-03-07 11:00:00', 5, 2000),
(14, 10, 'warranty_repair', 'High voltage system insulation check and repair', '2024-03-12 14:00:00', 5, 1800),
(15, 11, 'warranty_repair', 'Main power contactor replacement', '2024-03-14 08:00:00', 4, 1500),
(16, 12, 'recall', 'Charging port replacement program (RC-2024-002)', '2024-03-18 10:00:00', 5, 1200);

-- ADDITIONAL RECALL CAMPAIGNS
INSERT INTO recall_campaigns (code, title, description, created_by, released_at, status) VALUES
('RC-2024-004', 'Power Inverter Software Update', 'Software update for power inverters manufactured between Jan 2023 - Mar 2024 to improve efficiency and prevent overheating', 2, '2024-03-01 00:00:00', 'active'),
('RC-2024-005', 'Brake System Calibration', 'Recalibration of regenerative braking system for improved stopping distance in wet conditions', 2, '2024-04-01 00:00:00', 'active'),
('RC-2024-006', 'HV Cable Connector Inspection', 'Inspection and potential replacement of high-voltage cable connectors in vehicles manufactured Q2 2023', 2, NULL, 'draft'),
('RC-2024-007', 'Climate Control Sensor Update', 'Replacement of temperature sensors in climate control system for accurate readings', 2, '2024-05-01 00:00:00', 'active'),
('RC-2024-008', 'Safety Belt Tensioner Check', 'Inspection of safety belt tensioners for proper operation in all seating positions', 2, NULL, 'draft');

-- SERVICE CATALOG (Service Items)
INSERT INTO service_items (service_code, name, description, standard_labor_hours, category, active, created_at, updated_at) VALUES
('SVC-001', 'Battery Diagnostic', 'Comprehensive battery health check including capacity test and cell balance analysis', 2.0, 'Diagnostic', 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00'),
('SVC-002', 'Motor Inspection', 'Complete motor inspection including bearing check, temperature sensors, and performance test', 3.0, 'Inspection', 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00'),
('SVC-003', 'Charging Port Replacement', 'Replacement of charging port assembly including connector and wiring harness', 1.5, 'Repair', 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00'),
('SVC-004', 'Main Control Unit Replacement', 'MCU replacement with system recalibration and software update', 4.0, 'Repair', 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00'),
('SVC-005', 'Battery Pack Replacement', 'Complete battery pack replacement including HV system disconnection and reconnection', 8.0, 'Repair', 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00'),
('SVC-006', 'Software Update', 'Vehicle software update including all ECUs and battery management system', 1.0, 'Software', 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00'),
('SVC-007', 'Annual Maintenance', 'Comprehensive annual service including inspection, fluid check, and component lubrication', 2.5, 'Maintenance', 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00'),
('SVC-008', 'Display Unit Replacement', 'Replacement of main infotainment display with calibration', 2.0, 'Repair', 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00'),
('SVC-009', 'Onboard Charger Replacement', 'Replacement of onboard charging module with full system test', 3.5, 'Repair', 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00'),
('SVC-010', 'Power Inverter Replacement', 'High-voltage power inverter replacement with safety checks', 5.0, 'Repair', 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00');

-- CATALOG PRICES (for service items and parts)
-- Regional prices (region-based)
INSERT INTO catalog_prices (item_type, item_id, price, currency, region, service_center_id, effective_from, effective_to, created_at, updated_at) VALUES
-- Service Items - Regional pricing
('SERVICE', 1, 500000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('SERVICE', 1, 550000, 'VND', 'NORTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('SERVICE', 1, 520000, 'VND', 'CENTRAL', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('SERVICE', 2, 750000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('SERVICE', 2, 800000, 'VND', 'NORTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('SERVICE', 3, 1200000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('SERVICE', 4, 2500000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('SERVICE', 5, 8000000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('SERVICE', 6, 300000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('SERVICE', 7, 1500000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00');

-- Service Center specific pricing (for premium services)
INSERT INTO catalog_prices (item_type, item_id, price, currency, region, service_center_id, effective_from, effective_to, created_at, updated_at) VALUES
('SERVICE', 1, 450000, 'VND', 'SOUTH', 1, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('SERVICE', 2, 700000, 'VND', 'NORTH', 2, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('SERVICE', 3, 1100000, 'VND', 'CENTRAL', 3, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00');

-- Part pricing (for OEM parts)
INSERT INTO catalog_prices (item_type, item_id, price, currency, region, service_center_id, effective_from, effective_to, created_at, updated_at) VALUES
('PART', 1, 50000000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('PART', 2, 30000000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('PART', 3, 25000000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('PART', 4, 1000000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('PART', 5, 15000000, 'VND', 'SOUTH', NULL, '2024-01-01', NULL, '2024-01-01 08:00:00', '2024-01-01 08:00:00');

