-- =====================================================
-- MIGRATION SCRIPT: Refactor Claim Table
-- Description: Tách table claims thành nhiều table nhỏ hơn
-- Date: 2024
-- =====================================================

-- =====================================================
-- STEP 1: Tạo các table mới
-- =====================================================

-- 1.1. ClaimDiagnostic
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'claim_diagnostics')
BEGIN
    CREATE TABLE claim_diagnostics (
        id INT PRIMARY KEY IDENTITY(1,1),
        claim_id INT NOT NULL UNIQUE,
        reported_failure NVARCHAR(MAX),
        initial_diagnosis NVARCHAR(MAX),
        diagnostic_details NVARCHAR(MAX),
        problem_description NVARCHAR(MAX),
        problem_type VARCHAR(50),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_claim_diagnostics_claim_id ON claim_diagnostics(claim_id);
    PRINT 'Table claim_diagnostics created successfully';
END
ELSE
BEGIN
    PRINT 'Table claim_diagnostics already exists';
END
GO

-- 1.2. ClaimApproval
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'claim_approvals')
BEGIN
    CREATE TABLE claim_approvals (
        id INT PRIMARY KEY IDENTITY(1,1),
        claim_id INT NOT NULL UNIQUE,
        approved_by INT,
        approved_at DATETIME2,
        rejected_by INT,
        rejected_at DATETIME2,
        rejection_reason VARCHAR(50),
        rejection_notes NVARCHAR(MAX),
        rejection_count INT NOT NULL DEFAULT 0,
        resubmit_count INT NOT NULL DEFAULT 0,
        can_resubmit BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id),
        FOREIGN KEY (rejected_by) REFERENCES users(id)
    );
    
    CREATE INDEX idx_claim_approvals_claim_id ON claim_approvals(claim_id);
    CREATE INDEX idx_claim_approvals_approved_by ON claim_approvals(approved_by);
    CREATE INDEX idx_claim_approvals_rejected_by ON claim_approvals(rejected_by);
    PRINT 'Table claim_approvals created successfully';
END
ELSE
BEGIN
    PRINT 'Table claim_approvals already exists';
END
GO

-- 1.3. ClaimCancellation
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'claim_cancellations')
BEGIN
    CREATE TABLE claim_cancellations (
        id INT PRIMARY KEY IDENTITY(1,1),
        claim_id INT NOT NULL UNIQUE,
        cancel_request_count INT NOT NULL DEFAULT 0,
        cancel_previous_status_code VARCHAR(50),
        cancel_requested_by INT,
        cancel_requested_at DATETIME2,
        cancel_handled_by INT,
        cancel_handled_at DATETIME2,
        cancel_reason NVARCHAR(MAX),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
        FOREIGN KEY (cancel_requested_by) REFERENCES users(id),
        FOREIGN KEY (cancel_handled_by) REFERENCES users(id)
    );
    
    CREATE INDEX idx_claim_cancellations_claim_id ON claim_cancellations(claim_id);
    PRINT 'Table claim_cancellations created successfully';
END
ELSE
BEGIN
    PRINT 'Table claim_cancellations already exists';
END
GO

-- 1.4. ClaimWarrantyEligibility
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'claim_warranty_eligibility')
BEGIN
    CREATE TABLE claim_warranty_eligibility (
        id INT PRIMARY KEY IDENTITY(1,1),
        claim_id INT NOT NULL UNIQUE,
        
        -- Auto check results
        auto_warranty_eligible BIT,
        auto_warranty_reasons NVARCHAR(MAX),
        auto_warranty_checked_at DATETIME2,
        auto_warranty_applied_years INT,
        auto_warranty_applied_km INT,
        
        -- Manual assessment
        warranty_eligibility_assessment NVARCHAR(MAX),
        is_warranty_eligible BIT,
        warranty_eligibility_notes NVARCHAR(MAX),
        
        -- Manual override
        manual_warranty_override BIT,
        manual_override_confirmed BIT,
        manual_override_confirmed_at DATETIME2,
        manual_override_confirmed_by INT,
        
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
        FOREIGN KEY (manual_override_confirmed_by) REFERENCES users(id)
    );
    
    CREATE INDEX idx_claim_warranty_eligibility_claim_id ON claim_warranty_eligibility(claim_id);
    PRINT 'Table claim_warranty_eligibility created successfully';
END
ELSE
BEGIN
    PRINT 'Table claim_warranty_eligibility already exists';
END
GO

-- 1.5. ClaimCost
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'claim_costs')
BEGIN
    CREATE TABLE claim_costs (
        id INT PRIMARY KEY IDENTITY(1,1),
        claim_id INT NOT NULL UNIQUE,
        warranty_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
        company_paid_cost DECIMAL(12,2),
        total_service_cost DECIMAL(12,2),
        total_third_party_parts_cost DECIMAL(12,2),
        total_estimated_cost DECIMAL(12,2),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_claim_costs_claim_id ON claim_costs(claim_id);
    PRINT 'Table claim_costs created successfully';
END
ELSE
BEGIN
    PRINT 'Table claim_costs already exists';
END
GO

-- 1.6. ClaimRepairConfiguration
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'claim_repair_configurations')
BEGIN
    CREATE TABLE claim_repair_configurations (
        id INT PRIMARY KEY IDENTITY(1,1),
        claim_id INT NOT NULL UNIQUE,
        repair_type VARCHAR(50),
        service_catalog_items NVARCHAR(MAX),
        customer_payment_status VARCHAR(50),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_claim_repair_configurations_claim_id ON claim_repair_configurations(claim_id);
    PRINT 'Table claim_repair_configurations created successfully';
END
ELSE
BEGIN
    PRINT 'Table claim_repair_configurations already exists';
END
GO

-- 1.7. ClaimAssignment
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'claim_assignments')
BEGIN
    CREATE TABLE claim_assignments (
        id INT PRIMARY KEY IDENTITY(1,1),
        claim_id INT NOT NULL UNIQUE,
        assigned_technician_id INT,
        assigned_at DATETIME2,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_technician_id) REFERENCES users(id)
    );
    
    CREATE INDEX idx_claim_assignments_claim_id ON claim_assignments(claim_id);
    CREATE INDEX idx_claim_assignments_technician_id ON claim_assignments(assigned_technician_id);
    PRINT 'Table claim_assignments created successfully';
END
ELSE
BEGIN
    PRINT 'Table claim_assignments already exists';
END
GO

-- =====================================================
-- STEP 2: Migrate dữ liệu từ claims sang các table mới
-- =====================================================

PRINT 'Starting data migration...';
GO

-- 2.1. Migrate Diagnostic data
INSERT INTO claim_diagnostics (claim_id, reported_failure, initial_diagnosis, diagnostic_details, problem_description, problem_type, created_at, updated_at)
SELECT 
    id,
    reported_failure,
    initial_diagnosis,
    diagnostic_details,
    problem_description,
    problem_type,
    created_at,
    updated_at
FROM claims
WHERE id NOT IN (SELECT claim_id FROM claim_diagnostics WHERE claim_id IS NOT NULL)
  AND (reported_failure IS NOT NULL 
       OR initial_diagnosis IS NOT NULL 
       OR diagnostic_details IS NOT NULL 
       OR problem_description IS NOT NULL 
       OR problem_type IS NOT NULL);
PRINT 'Migrated diagnostic data';
GO

-- 2.2. Migrate Approval data
INSERT INTO claim_approvals (
    claim_id, approved_by, approved_at, rejected_by, rejected_at, 
    rejection_reason, rejection_notes, rejection_count, resubmit_count, 
    can_resubmit, created_at, updated_at
)
SELECT 
    id,
    approved_by,
    approved_at,
    rejected_by,
    rejected_at,
    rejection_reason,
    rejection_notes,
    ISNULL(rejection_count, 0),
    ISNULL(resubmit_count, 0),
    ISNULL(can_resubmit, 1),
    created_at,
    updated_at
FROM claims
WHERE id NOT IN (SELECT claim_id FROM claim_approvals WHERE claim_id IS NOT NULL)
  AND (approved_by IS NOT NULL 
       OR approved_at IS NOT NULL 
       OR rejected_by IS NOT NULL 
       OR rejected_at IS NOT NULL 
       OR rejection_reason IS NOT NULL 
       OR rejection_notes IS NOT NULL
       OR ISNULL(rejection_count, 0) > 0
       OR ISNULL(resubmit_count, 0) > 0);
PRINT 'Migrated approval data';
GO

-- 2.3. Migrate Cancellation data
INSERT INTO claim_cancellations (
    claim_id, cancel_request_count, cancel_previous_status_code,
    cancel_requested_by, cancel_requested_at, cancel_handled_by,
    cancel_handled_at, cancel_reason, created_at, updated_at
)
SELECT 
    id,
    ISNULL(cancel_request_count, 0),
    cancel_previous_status_code,
    cancel_requested_by,
    cancel_requested_at,
    cancel_handled_by,
    cancel_handled_at,
    cancel_reason,
    created_at,
    updated_at
FROM claims
WHERE id NOT IN (SELECT claim_id FROM claim_cancellations WHERE claim_id IS NOT NULL)
  AND (ISNULL(cancel_request_count, 0) > 0
       OR cancel_previous_status_code IS NOT NULL
       OR cancel_requested_by IS NOT NULL
       OR cancel_requested_at IS NOT NULL
       OR cancel_handled_by IS NOT NULL
       OR cancel_handled_at IS NOT NULL
       OR cancel_reason IS NOT NULL);
PRINT 'Migrated cancellation data';
GO

-- 2.4. Migrate Warranty Eligibility data
INSERT INTO claim_warranty_eligibility (
    claim_id, auto_warranty_eligible, auto_warranty_reasons, auto_warranty_checked_at,
    auto_warranty_applied_years, auto_warranty_applied_km,
    warranty_eligibility_assessment, is_warranty_eligible, warranty_eligibility_notes,
    manual_warranty_override, manual_override_confirmed, manual_override_confirmed_at,
    manual_override_confirmed_by, created_at, updated_at
)
SELECT 
    id,
    auto_warranty_eligible,
    auto_warranty_reasons,
    auto_warranty_checked_at,
    auto_warranty_applied_years,
    auto_warranty_applied_km,
    warranty_eligibility_assessment,
    is_warranty_eligible,
    warranty_eligibility_notes,
    manual_warranty_override,
    manual_override_confirmed,
    manual_override_confirmed_at,
    manual_override_confirmed_by,
    created_at,
    updated_at
FROM claims
WHERE id NOT IN (SELECT claim_id FROM claim_warranty_eligibility WHERE claim_id IS NOT NULL)
  AND (auto_warranty_eligible IS NOT NULL
       OR auto_warranty_reasons IS NOT NULL
       OR auto_warranty_checked_at IS NOT NULL
       OR auto_warranty_applied_years IS NOT NULL
       OR auto_warranty_applied_km IS NOT NULL
       OR warranty_eligibility_assessment IS NOT NULL
       OR is_warranty_eligible IS NOT NULL
       OR warranty_eligibility_notes IS NOT NULL
       OR manual_warranty_override IS NOT NULL
       OR manual_override_confirmed IS NOT NULL
       OR manual_override_confirmed_at IS NOT NULL
       OR manual_override_confirmed_by IS NOT NULL);
PRINT 'Migrated warranty eligibility data';
GO

-- 2.5. Migrate Cost data
INSERT INTO claim_costs (
    claim_id, warranty_cost, company_paid_cost, total_service_cost,
    total_third_party_parts_cost, total_estimated_cost, created_at, updated_at
)
SELECT 
    id,
    ISNULL(warranty_cost, 0),
    company_paid_cost,
    total_service_cost,
    total_third_party_parts_cost,
    total_estimated_cost,
    created_at,
    updated_at
FROM claims
WHERE id NOT IN (SELECT claim_id FROM claim_costs WHERE claim_id IS NOT NULL)
  AND (ISNULL(warranty_cost, 0) > 0
       OR company_paid_cost IS NOT NULL
       OR total_service_cost IS NOT NULL
       OR total_third_party_parts_cost IS NOT NULL
       OR total_estimated_cost IS NOT NULL);
PRINT 'Migrated cost data';
GO

-- 2.6. Migrate Repair Configuration data
INSERT INTO claim_repair_configurations (
    claim_id, repair_type, service_catalog_items, customer_payment_status,
    created_at, updated_at
)
SELECT 
    id,
    repair_type,
    service_catalog_items,
    customer_payment_status,
    created_at,
    updated_at
FROM claims
WHERE id NOT IN (SELECT claim_id FROM claim_repair_configurations WHERE claim_id IS NOT NULL)
  AND (repair_type IS NOT NULL
       OR service_catalog_items IS NOT NULL
       OR customer_payment_status IS NOT NULL);
PRINT 'Migrated repair configuration data';
GO

-- 2.7. Migrate Assignment data
INSERT INTO claim_assignments (
    claim_id, assigned_technician_id, assigned_at, created_at, updated_at
)
SELECT 
    id,
    assigned_technician_id,
    NULL, -- assigned_at không có trong claims table, set NULL
    created_at,
    updated_at
FROM claims
WHERE id NOT IN (SELECT claim_id FROM claim_assignments WHERE claim_id IS NOT NULL)
  AND assigned_technician_id IS NOT NULL;
PRINT 'Migrated assignment data';
GO

PRINT 'Data migration completed successfully!';
GO

-- =====================================================
-- STEP 3: Verify migration (Optional - uncomment to run)
-- =====================================================

/*
-- Verify counts
SELECT 'claims' AS table_name, COUNT(*) AS record_count FROM claims
UNION ALL
SELECT 'claim_diagnostics', COUNT(*) FROM claim_diagnostics
UNION ALL
SELECT 'claim_approvals', COUNT(*) FROM claim_approvals
UNION ALL
SELECT 'claim_cancellations', COUNT(*) FROM claim_cancellations
UNION ALL
SELECT 'claim_warranty_eligibility', COUNT(*) FROM claim_warranty_eligibility
UNION ALL
SELECT 'claim_costs', COUNT(*) FROM claim_costs
UNION ALL
SELECT 'claim_repair_configurations', COUNT(*) FROM claim_repair_configurations
UNION ALL
SELECT 'claim_assignments', COUNT(*) FROM claim_assignments;
*/

-- =====================================================
-- STEP 4: Drop old columns (CHỈ CHẠY SAU KHI VERIFY VÀ TEST)
-- =====================================================

/*
-- ⚠️ WARNING: Chỉ uncomment và chạy sau khi đã verify migration thành công!

-- Drop diagnostic columns
ALTER TABLE claims DROP COLUMN reported_failure;
ALTER TABLE claims DROP COLUMN initial_diagnosis;
ALTER TABLE claims DROP COLUMN diagnostic_details;
ALTER TABLE claims DROP COLUMN problem_description;
ALTER TABLE claims DROP COLUMN problem_type;

-- Drop approval columns
ALTER TABLE claims DROP COLUMN approved_by;
ALTER TABLE claims DROP COLUMN approved_at;
ALTER TABLE claims DROP COLUMN rejected_by;
ALTER TABLE claims DROP COLUMN rejected_at;
ALTER TABLE claims DROP COLUMN rejection_reason;
ALTER TABLE claims DROP COLUMN rejection_notes;
ALTER TABLE claims DROP COLUMN rejection_count;
ALTER TABLE claims DROP COLUMN resubmit_count;
ALTER TABLE claims DROP COLUMN can_resubmit;

-- Drop cancellation columns
ALTER TABLE claims DROP COLUMN cancel_request_count;
ALTER TABLE claims DROP COLUMN cancel_previous_status_code;
ALTER TABLE claims DROP COLUMN cancel_requested_by;
ALTER TABLE claims DROP COLUMN cancel_requested_at;
ALTER TABLE claims DROP COLUMN cancel_handled_by;
ALTER TABLE claims DROP COLUMN cancel_handled_at;
ALTER TABLE claims DROP COLUMN cancel_reason;

-- Drop warranty eligibility columns
ALTER TABLE claims DROP COLUMN warranty_eligibility_assessment;
ALTER TABLE claims DROP COLUMN is_warranty_eligible;
ALTER TABLE claims DROP COLUMN warranty_eligibility_notes;
ALTER TABLE claims DROP COLUMN auto_warranty_eligible;
ALTER TABLE claims DROP COLUMN auto_warranty_reasons;
ALTER TABLE claims DROP COLUMN auto_warranty_checked_at;
ALTER TABLE claims DROP COLUMN manual_warranty_override;
ALTER TABLE claims DROP COLUMN manual_override_confirmed;
ALTER TABLE claims DROP COLUMN manual_override_confirmed_at;
ALTER TABLE claims DROP COLUMN manual_override_confirmed_by;
ALTER TABLE claims DROP COLUMN auto_warranty_applied_years;
ALTER TABLE claims DROP COLUMN auto_warranty_applied_km;

-- Drop cost columns
ALTER TABLE claims DROP COLUMN warranty_cost;
ALTER TABLE claims DROP COLUMN company_paid_cost;
ALTER TABLE claims DROP COLUMN total_service_cost;
ALTER TABLE claims DROP COLUMN total_third_party_parts_cost;
ALTER TABLE claims DROP COLUMN total_estimated_cost;

-- Drop repair configuration columns
ALTER TABLE claims DROP COLUMN repair_type;
ALTER TABLE claims DROP COLUMN service_catalog_items;
ALTER TABLE claims DROP COLUMN customer_payment_status;

-- Drop assignment columns
ALTER TABLE claims DROP COLUMN assigned_technician_id;

PRINT 'Old columns dropped successfully';
*/

PRINT 'Migration script completed!';
PRINT 'Next steps:';
PRINT '1. Verify data migration';
PRINT '2. Update application code to use new entities';
PRINT '3. Test thoroughly';
PRINT '4. Uncomment STEP 4 to drop old columns after verification';

