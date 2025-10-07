-- Migration script for SC Technician functionality
-- Add tables for technician tasks, diagnostic reports, and repair progress

-- Create technician_tasks table
CREATE TABLE IF NOT EXISTS technician_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    technician_id INT NOT NULL,
    claim_id INT NOT NULL,
    assigned_by INT NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    description TEXT,
    work_notes TEXT,
    completion_notes TEXT,
    assigned_date DATETIME NOT NULL,
    started_date DATETIME,
    completed_date DATETIME,
    estimated_completion_date DATETIME,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (technician_id) REFERENCES users(id),
    FOREIGN KEY (claim_id) REFERENCES claims(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),

    INDEX idx_technician_tasks_technician (technician_id),
    INDEX idx_technician_tasks_claim (claim_id),
    INDEX idx_technician_tasks_status (status),
    INDEX idx_technician_tasks_priority (priority)
);

-- Create diagnostic_reports table
CREATE TABLE IF NOT EXISTS diagnostic_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    claim_id INT NOT NULL,
    technician_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    report_number VARCHAR(50) NOT NULL UNIQUE,
    symptom_description TEXT,
    visual_inspection TEXT,
    diagnostic_results TEXT,
    trouble_codes TEXT,
    root_cause_analysis TEXT,
    recommended_actions TEXT,
    diagnosis_status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    current_mileage INT,
    battery_status VARCHAR(50),
    motor_status VARCHAR(50),
    controller_status VARCHAR(50),
    charging_system_status VARCHAR(50),
    additional_notes TEXT,
    diagnosis_date DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (claim_id) REFERENCES claims(id),
    FOREIGN KEY (technician_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),

    INDEX idx_diagnostic_reports_claim (claim_id),
    INDEX idx_diagnostic_reports_technician (technician_id),
    INDEX idx_diagnostic_reports_vehicle (vehicle_id),
    INDEX idx_diagnostic_reports_status (diagnosis_status)
);

-- Create repair_progress table
CREATE TABLE IF NOT EXISTS repair_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    claim_id INT NOT NULL,
    technician_id INT NOT NULL,
    progress_step VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    description TEXT,
    work_performed TEXT,
    issues TEXT,
    notes TEXT,
    hours_spent DECIMAL(5,2),
    start_time DATETIME,
    end_time DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (claim_id) REFERENCES claims(id),
    FOREIGN KEY (technician_id) REFERENCES users(id),

    INDEX idx_repair_progress_claim (claim_id),
    INDEX idx_repair_progress_technician (technician_id),
    INDEX idx_repair_progress_status (status),
    INDEX idx_repair_progress_step (progress_step)
);

-- Add additional indexes for performance optimization
CREATE INDEX idx_technician_tasks_assigned_date ON technician_tasks(assigned_date);
CREATE INDEX idx_technician_tasks_estimated_completion ON technician_tasks(estimated_completion_date);
CREATE INDEX idx_diagnostic_reports_report_number ON diagnostic_reports(report_number);
CREATE INDEX idx_repair_progress_start_time ON repair_progress(start_time);

-- Insert sample data for testing (optional)
INSERT INTO technician_tasks (technician_id, claim_id, assigned_by, task_type, priority, description, assigned_date, estimated_hours, estimated_completion_date) VALUES
(2, 1, 1, 'DIAGNOSIS', 'HIGH', 'Perform comprehensive diagnosis on EV battery system', NOW(), 4.0, DATE_ADD(NOW(), INTERVAL 2 DAY)),
(2, 2, 1, 'REPAIR', 'MEDIUM', 'Replace faulty motor controller unit', NOW(), 6.0, DATE_ADD(NOW(), INTERVAL 3 DAY)),
(3, 3, 1, 'INSPECTION', 'LOW', 'Routine inspection of charging system', NOW(), 2.0, DATE_ADD(NOW(), INTERVAL 1 DAY));

INSERT INTO diagnostic_reports (claim_id, technician_id, vehicle_id, report_number, symptom_description, diagnosis_status, current_mileage, diagnosis_date) VALUES
(1, 2, 1, 'DR-20241007120000', 'Vehicle not charging properly, battery indicator shows error', 'IN_PROGRESS', 15000, NOW()),
(2, 2, 2, 'DR-20241007120001', 'Motor making unusual noise during acceleration', 'COMPLETED', 22000, NOW());

INSERT INTO repair_progress (claim_id, technician_id, progress_step, description, start_time) VALUES
(1, 2, 'DIAGNOSIS', 'Started diagnostic process for charging issue', NOW()),
(2, 2, 'PARTS_ORDERED', 'Ordered replacement motor controller', NOW());
