INSERT INTO dbo.roles (role_name, description) VALUES
                                                   ('SC_STAFF','Service Center staff'),
                                                   ('SC_TECHNICIAN','Service Center technician'),
                                                   ('EVM_STAFF','OEM staff'),
                                                   ('ADMIN','System administrator');
INSERT INTO dbo.users (username, email, password, role_id, fullname, phone)
VALUES
    ('sc_staff_01', 'sc.staff1@vinfast.example', '<hash>', (SELECT id FROM dbo.roles WHERE role_name='SC_STAFF'), 'SC Staff 1', '0901000001'),
    ('tech_01', 'tech1@vinfast.example', '<hash>', (SELECT id FROM dbo.roles WHERE role_name='SC_TECHNICIAN'), 'Technician 1', '0901000002'),
    ('evm_01', 'evm1@vinfast.example', '<hash>', (SELECT id FROM dbo.roles WHERE role_name='EVM_STAFF'), 'EVM Staff 1', '0901000003'),
    ('admin_01', 'admin@vinfast.example', '<hash>', (SELECT id FROM dbo.roles WHERE role_name='ADMIN'), 'System Admin', '0901000000');
-- create service_centers nếu chưa có
IF OBJECT_ID('dbo.service_centers','U') IS NULL
BEGIN
CREATE TABLE dbo.service_centers (
                                     id INT IDENTITY(1,1) PRIMARY KEY,
                                     code VARCHAR(50) NOT NULL UNIQUE,
                                     name VARCHAR(200) NOT NULL,
                                     address VARCHAR(300) NULL
);
END

INSERT INTO dbo.service_centers (code, name, address)
VALUES ('SC-HN-01','VinFast SC Hanoi','123 Le Loi, Hanoi');

INSERT INTO dbo.warehouses (name, address)
VALUES ('WH-HN-01','VinFast Warehouse Hanoi');

-- Parts
INSERT INTO dbo.parts (part_number, name, category, description)
VALUES
    ('BAT-1000','Battery Pack 48V','Battery','Battery pack for VF eScooter'),
    ('MTR-2000','Motor 3kW','Motor','BLDC motor');

-- Inventory (set quantity > 0)
INSERT INTO dbo.inventory (warehouse_id, part_id, quantity, reorder_threshold, last_updated)
VALUES (
           (SELECT TOP 1 id FROM dbo.warehouses WHERE name LIKE '%Hanoi%'),
           (SELECT TOP 1 id FROM dbo.parts WHERE part_number='BAT-1000'),
           10, 2, GETDATE()
       ),
       (
           (SELECT TOP 1 id FROM dbo.warehouses WHERE name LIKE '%Hanoi%'),
           (SELECT TOP 1 id FROM dbo.parts WHERE part_number='MTR-2000'),
           5, 1, GETDATE()
       );

-- Part serials (traceable units)
INSERT INTO dbo.part_serials (part_id, serial_number, manufacture_date, status)
VALUES
    ((SELECT id FROM dbo.parts WHERE part_number='BAT-1000'),'BAT-1000-0001',GETDATE(),'in_stock'),
    ((SELECT id FROM dbo.parts WHERE part_number='BAT-1000'),'BAT-1000-0002',GETDATE(),'in_stock');

-- only if not exists
IF NOT EXISTS (SELECT 1 FROM dbo.claim_statuses WHERE code='created')
BEGIN
INSERT INTO dbo.claim_statuses (code, label) VALUES
                                                 ('created','Created'),
                                                 ('submitted','Submitted'),
                                                 ('validated','Validated'),
                                                 ('approved','Approved'),
                                                 ('rejected','Rejected'),
                                                 ('in_progress','In Progress'),
                                                 ('completed','Completed');
END

INSERT INTO dbo.customers (name, email, phone, address, created_at)
VALUES ('Nguyen Van A','a@example.com','0912345678','Hanoi',GETDATE());

-- in-warranty vehicle
INSERT INTO dbo.vehicles (vin, model, year, customer_id, registration_date, warranty_start, warranty_end, created_at)
VALUES ('VFVIN0000000001','VF eScooter X',2024,(SELECT TOP 1 id FROM dbo.customers WHERE phone='0912345678'), GETDATE(), DATEADD(year, -1, GETDATE()), DATEADD(year, 2, GETDATE()), GETDATE());

-- out-of-warranty vehicle (example older)
INSERT INTO dbo.customers (name, email, phone, address, created_at)
VALUES ('Le Thi B','b@example.com','0912345679','Hanoi',GETDATE());

INSERT INTO dbo.vehicles (vin, model, year, customer_id, registration_date, warranty_start, warranty_end, created_at)
VALUES ('VFVIN0000000002','VF eScooter Y',2018,(SELECT TOP 1 id FROM dbo.customers WHERE phone='0912345679'), GETDATE(), '2018-01-01','2020-01-01', GETDATE());
