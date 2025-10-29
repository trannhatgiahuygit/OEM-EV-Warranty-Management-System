INSERT INTO roles (role_name, description) VALUES
                                               ('SC_STAFF','Service Center Staff'),
                                               ('SC_TECHNICIAN','Service Center Technician'),
                                               ('EVM_STAFF','EVM Staff'),
                                               ('ADMIN','Administrator');

-- 2. USERS (phụ thuộc vào roles)
INSERT INTO users (username, email, password_hash, role_id, full_name, phone, active, created_at, updated_at) VALUES
                                                                                                                  ('admin_user', 'admin@evwarranty.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 4, 'System Administrator', '+1234567890', 1, '2023-01-01 08:00:00', '2023-01-01 08:00:00'),
                                                                                                                  ('evm_staff1', 'evm1@evwarranty.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 3, 'John Smith', '+1234567891', 1, '2023-01-05 09:00:00', '2023-01-05 09:00:00'),
                                                                                                                  ('sc_staff1', 'scstaff1@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 1, 'Alice Johnson', '+1234567892', 1, '2023-01-10 10:00:00', '2023-01-10 10:00:00'),
                                                                                                                  ('tech1', 'tech1@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 2, 'Bob Wilson', '+1234567893', 1, '2023-01-15 11:00:00', '2023-01-15 11:00:00'),
                                                                                                                  ('tech2', 'tech2@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 2, 'Carol Davis', '+1234567894', 1, '2023-01-20 12:00:00', '2023-01-20 12:00:00'),
                                                                                                                  ('sc_staff2', 'scstaff2@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 1, 'David Brown', '+1234567895', 1, '2023-01-25 13:00:00', '2023-01-25 13:00:00'),
                                                                                                                  ('former_tech', 'former@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 2, 'Former Technician', '+1234567896', 0, '2022-01-01 08:00:00', '2024-01-01 08:00:00'),
                                                                                                                  ('suspended_staff', 'suspended@service.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 1, 'Suspended Staff', '+1234567897', 0, '2023-06-01 08:00:00', '2024-02-01 08:00:00'),
                                                                                                                  ('trannhatgiahuygit', 'trannhatgiahuygit@gmail.com', '$2a$10$9sLq1dBmrnboloQtt4vYb.xgDn570tGSfrMGr/Em0t/Te/b4c0IxO', 1, 'Tran Nhat Gia Huy', '+84912345678', 1, '2024-01-01 08:00:00', '2024-01-01 08:00:00');
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
                                                                                -- NEW: Thêm khách hàng mới để test
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
                                             ('COMPLETED', 'Completed'),
                                             ('CLOSED', 'Closed'),
                                             ('WAITING_FOR_CUSTOMER', 'Waiting for Customer'),
                                             ('REJECTED', 'Rejected'),
                                             ('CANCELLED', 'Cancelled');

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
                                                                                                (1, 101, 2, '2024-01-10 08:00:00', 'delivered', 'TRK001', 'FedEx', 'Urgent delivery', '2024-01-09 08:00:00'),
                                                                                                (2, 102, 2, '2024-01-15 09:00:00', 'in_transit', 'TRK002', 'UPS', 'Standard delivery', '2024-01-14 09:00:00'),
                                                                                                (1, 103, 3, NULL, 'pending', 'TRK003', 'DHL', 'Scheduled delivery', '2024-01-20 10:00:00');

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
INSERT INTO claim_attachments (claim_id, file_path, file_type, uploaded_by, uploaded_at) VALUES
                                                                                             (1, '/uploads/claims/CLM-2024-001/battery_error_screenshot.jpg', 'image/jpeg', 3, '2024-01-15 09:15:00'),
                                                                                             (1, '/uploads/claims/CLM-2024-001/diagnostic_report.pdf', 'application/pdf', 4, '2024-01-16 10:00:00'),
                                                                                             (2, '/uploads/claims/CLM-2024-002/motor_noise_video.mp4', 'video/mp4', 3, '2024-01-20 10:45:00'),
                                                                                             (3, '/uploads/claims/CLM-2024-003/charging_port_photo.jpg', 'image/jpeg', 4, '2024-02-01 14:30:00'),
                                                                                             (4, '/uploads/claims/CLM-2024-004/shutdown_logs.txt', 'text/plain', 3, '2024-02-10 12:00:00'),
                                                                                             -- NEW: Thêm attachments cho claims mới
                                                                                             (6, '/uploads/claims/CLM-2024-006/display_flicker.mp4', 'video/mp4', 3, '2024-03-01 09:30:00'),
                                                                                             (7, '/uploads/claims/CLM-2024-007/brake_test_results.pdf', 'application/pdf', 4, '2024-03-02 11:00:00'),
                                                                                             (8, '/uploads/claims/CLM-2024-008/battery_health_report.pdf', 'application/pdf', 6, '2024-03-05 12:00:00'),
                                                                                             (8, '/uploads/claims/CLM-2024-008/capacity_graph.jpg', 'image/jpeg', 5, '2024-03-06 10:00:00'),
                                                                                             (9, '/uploads/claims/CLM-2024-009/hv_warning_photo.jpg', 'image/jpeg', 3, '2024-03-10 13:00:00'),
                                                                                             (10, '/uploads/claims/CLM-2024-010/no_start_video.mp4', 'video/mp4', 6, '2024-03-12 14:00:00');
