-- Tạo database và chuyển sang database đó
IF DB_ID('Manager_System') IS NULL
    CREATE DATABASE Manager_System;
GO

USE Manager_System;
GO

-- Roles
CREATE TABLE dbo.roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL
);
GO

-- Users
CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    full_name VARCHAR(150) NULL,
    phone VARCHAR(30) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

ALTER TABLE dbo.users
    ADD CONSTRAINT FK_users_roles FOREIGN KEY (role_id) REFERENCES dbo.roles(id);
GO

-- Customers and Vehicles
CREATE TABLE dbo.customers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(30) NULL,
    address VARCHAR(300) NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.vehicles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    vin VARCHAR(50) NOT NULL UNIQUE,
    model VARCHAR(100) NULL,
    year INT NULL,
    customer_id INT NOT NULL,
    registration_date DATE NULL,
    warranty_start DATE NULL,
    warranty_end DATE NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

ALTER TABLE dbo.vehicles
    ADD CONSTRAINT FK_vehicles_customers FOREIGN KEY (customer_id) REFERENCES dbo.customers(id);
GO

-- Parts and inventory
CREATE TABLE dbo.parts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    part_number VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NULL,
    description TEXT NULL
);
GO

CREATE TABLE dbo.part_serials (
    id INT IDENTITY(1,1) PRIMARY KEY,
    part_id INT NOT NULL,
    serial_number VARCHAR(150) NOT NULL UNIQUE,
    manufacture_date DATE NULL,
    status VARCHAR(50) DEFAULT 'in_stock', -- in_stock / allocated / installed / returned
    installed_on_vehicle_id INT NULL,
    installed_at DATETIME NULL
);
GO

ALTER TABLE dbo.part_serials
    ADD CONSTRAINT FK_partserials_parts FOREIGN KEY (part_id) REFERENCES dbo.parts(id);
GO

ALTER TABLE dbo.part_serials
    ADD CONSTRAINT FK_partserials_vehicles FOREIGN KEY (installed_on_vehicle_id) REFERENCES dbo.vehicles(id);
GO

CREATE TABLE dbo.warehouses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(300) NULL
);
GO

CREATE TABLE dbo.inventory (
    id INT IDENTITY(1,1) PRIMARY KEY,
    warehouse_id INT NOT NULL,
    part_id INT NOT NULL,
    quantity INT DEFAULT 0,
    reorder_threshold INT DEFAULT 0,
    last_updated DATETIME DEFAULT GETDATE()
);
GO

ALTER TABLE dbo.inventory
    ADD CONSTRAINT FK_inventory_warehouses FOREIGN KEY (warehouse_id) REFERENCES dbo.warehouses(id),
        CONSTRAINT FK_inventory_parts FOREIGN KEY (part_id) REFERENCES dbo.parts(id);
GO

-- Shipments
CREATE TABLE dbo.shipments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    warehouse_id INT NOT NULL,
    destination_center_id INT NULL, -- could point to service center
    created_by INT NULL,
    shipped_at DATETIME NULL,
    status VARCHAR(50) DEFAULT 'pending'
);
GO

ALTER TABLE dbo.shipments
    ADD CONSTRAINT FK_shipments_warehouses FOREIGN KEY (warehouse_id) REFERENCES dbo.warehouses(id),
        CONSTRAINT FK_shipments_users_createdby FOREIGN KEY (created_by) REFERENCES dbo.users(id);
GO

CREATE TABLE dbo.shipment_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    shipment_id INT NOT NULL,
    part_id INT NOT NULL,
    quantity INT NOT NULL
);
GO

ALTER TABLE dbo.shipment_items
    ADD CONSTRAINT FK_shipmentitems_shipments FOREIGN KEY (shipment_id) REFERENCES dbo.shipments(id),
        CONSTRAINT FK_shipmentitems_parts FOREIGN KEY (part_id) REFERENCES dbo.parts(id);
GO

-- Claim statuses and claims
CREATE TABLE dbo.claim_statuses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NULL
);
GO

CREATE TABLE dbo.claims (
    id INT IDENTITY(1,1) PRIMARY KEY,
    claim_number VARCHAR(100) NOT NULL UNIQUE,
    vehicle_id INT NOT NULL,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    reported_failure TEXT NULL,
    initial_diagnosis TEXT NULL,
    status_id INT NOT NULL,
    assigned_technician_id INT NULL,
    approved_by INT NULL,
    approved_at DATETIME NULL,
    warranty_cost DECIMAL(12,2) DEFAULT 0
);
GO

ALTER TABLE dbo.claims
    ADD CONSTRAINT FK_claims_vehicles FOREIGN KEY (vehicle_id) REFERENCES dbo.vehicles(id),
        CONSTRAINT FK_claims_users_createdby FOREIGN KEY (created_by) REFERENCES dbo.users(id),
        CONSTRAINT FK_claims_status FOREIGN KEY (status_id) REFERENCES dbo.claim_statuses(id),
        CONSTRAINT FK_claims_assignedtech FOREIGN KEY (assigned_technician_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_claims_approvedby FOREIGN KEY (approved_by) REFERENCES dbo.users(id);
GO

CREATE TABLE dbo.claim_attachments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    claim_id INT NOT NULL,
    file_path VARCHAR(500) NULL,
    file_type VARCHAR(50) NULL,
    uploaded_by INT NULL,
    uploaded_at DATETIME DEFAULT GETDATE()
);
GO

ALTER TABLE dbo.claim_attachments
    ADD CONSTRAINT FK_claimattachments_claims FOREIGN KEY (claim_id) REFERENCES dbo.claims(id),
        CONSTRAINT FK_claimattachments_users FOREIGN KEY (uploaded_by) REFERENCES dbo.users(id);
GO

CREATE TABLE dbo.claim_status_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    claim_id INT NOT NULL,
    status_id INT NOT NULL,
    changed_by INT NULL,
    changed_at DATETIME DEFAULT GETDATE(),
    note TEXT NULL
);
GO

ALTER TABLE dbo.claim_status_history
    ADD CONSTRAINT FK_chstatus_claims FOREIGN KEY (claim_id) REFERENCES dbo.claims(id),
        CONSTRAINT FK_chstatus_status FOREIGN KEY (status_id) REFERENCES dbo.claim_statuses(id),
        CONSTRAINT FK_chstatus_users FOREIGN KEY (changed_by) REFERENCES dbo.users(id);
GO

-- Work orders and parts used
CREATE TABLE dbo.work_orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    claim_id INT NOT NULL,
    technician_id INT NOT NULL,
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    result TEXT NULL,
    labor_hours DECIMAL(6,2) DEFAULT 0
);
GO

ALTER TABLE dbo.work_orders
    ADD CONSTRAINT FK_workorders_claims FOREIGN KEY (claim_id) REFERENCES dbo.claims(id),
        CONSTRAINT FK_workorders_users FOREIGN KEY (technician_id) REFERENCES dbo.users(id);
GO

CREATE TABLE dbo.work_order_parts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    work_order_id INT NOT NULL,
    part_serial_id INT NULL,
    part_id INT NOT NULL,
    quantity INT DEFAULT 1
);
GO

ALTER TABLE dbo.work_order_parts
    ADD CONSTRAINT FK_woparts_workorders FOREIGN KEY (work_order_id) REFERENCES dbo.work_orders(id),
        CONSTRAINT FK_woparts_partserials FOREIGN KEY (part_serial_id) REFERENCES dbo.part_serials(id),
        CONSTRAINT FK_woparts_parts FOREIGN KEY (part_id) REFERENCES dbo.parts(id);
GO

-- Appointments
CREATE TABLE dbo.appointments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    vehicle_id INT NOT NULL,
    claim_id INT NULL,
    scheduled_at DATETIME NOT NULL,
    created_by INT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notified_customer BIT DEFAULT 0
);
GO

ALTER TABLE dbo.appointments
    ADD CONSTRAINT FK_appointments_vehicles FOREIGN KEY (vehicle_id) REFERENCES dbo.vehicles(id),
        CONSTRAINT FK_appointments_claims FOREIGN KEY (claim_id) REFERENCES dbo.claims(id),
        CONSTRAINT FK_appointments_users FOREIGN KEY (created_by) REFERENCES dbo.users(id);
GO

-- Recall / Campaigns
CREATE TABLE dbo.recall_campaigns (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NULL,
    description TEXT NULL,
    created_by INT NULL,
    released_at DATETIME NULL,
    status VARCHAR(50) DEFAULT 'draft'
);
GO

ALTER TABLE dbo.recall_campaigns
    ADD CONSTRAINT FK_recallcampaigns_users FOREIGN KEY (created_by) REFERENCES dbo.users(id);
GO

CREATE TABLE dbo.campaign_vehicles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    campaign_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    notified BIT DEFAULT 0,
    processed BIT DEFAULT 0,
    processed_at DATETIME NULL
);
GO

ALTER TABLE dbo.campaign_vehicles
    ADD CONSTRAINT FK_campaignvehicles_campaigns FOREIGN KEY (campaign_id) REFERENCES dbo.recall_campaigns(id),
        CONSTRAINT FK_campaignvehicles_vehicles FOREIGN KEY (vehicle_id) REFERENCES dbo.vehicles(id);
GO

-- Audit logs
CREATE TABLE dbo.audit_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(200) NULL,
    object_type VARCHAR(100) NULL,
    object_id VARCHAR(100) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    details TEXT NULL
);
GO

ALTER TABLE dbo.audit_logs
    ADD CONSTRAINT FK_auditlogs_users FOREIGN KEY (user_id) REFERENCES dbo.users(id);
GO

-- Seed claim_statuses
INSERT INTO dbo.claim_statuses (code, label) VALUES
('created','Created'),
('submitted','Submitted'),
('validated','Validated'),
('approved','Approved'),
('rejected','Rejected'),
('in_progress','In Progress'),
('completed','Completed');
GO

-- Trigger example to keep users.updated_at refreshed on UPDATE
IF OBJECT_ID('dbo.trg_users_updated_at','TR') IS NOT NULL
    DROP TRIGGER dbo.trg_users_updated_at;
GO

CREATE TRIGGER dbo.trg_users_updated_at
ON dbo.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE u
    SET updated_at = GETDATE()
    FROM dbo.users u
    INNER JOIN inserted i ON u.id = i.id;
END;
GO

-- (Optional) You can add similar triggers for other tables with updated_at / last_updated fields,
-- e.g., inventory.last_updated, part_serials.installed_at logic, etc.

