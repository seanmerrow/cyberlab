-- Ensure database uses full UTF-8 support
CREATE DATABASE IF NOT EXISTS patient_sim_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE patient_sim_db;

-- -----------------------------------------------------
-- 1. Patients Table (Demographics)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    mrn VARCHAR(20) NOT NULL UNIQUE, -- Medical Record Number
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other', 'Unknown') DEFAULT 'Unknown',
    phone VARCHAR(20),
    email VARCHAR(100),
    address_line1 VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patient_name (last_name, first_name),
    INDEX idx_patient_dob (date_of_birth)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 2. Encounters / Visits Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS encounters (
    encounter_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    encounter_type ENUM('Outpatient', 'Inpatient', 'Emergency', 'Telehealth', 'Routine') NOT NULL,
    visit_start_datetime DATETIME NOT NULL,
    visit_end_datetime DATETIME NULL,
    attending_physician VARCHAR(100) NOT NULL,
    reason_for_visit VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_encounters_patients
        FOREIGN KEY (patient_id)
        REFERENCES patients (patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_encounter_patient (patient_id),
    INDEX idx_encounter_date (visit_start_datetime)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 3. Medical History / Conditions Table (ICD-10 aligned)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_history (
    condition_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    icd10_code VARCHAR(10) NULL, -- Optional standard medical code format (e.g., E11.9)
    condition_name VARCHAR(150) NOT NULL,
    status ENUM('Active', 'Resolved', 'In Remission', 'Recurrent') DEFAULT 'Active',
    diagnosed_date DATE,
    resolved_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medical_history_patients
        FOREIGN KEY (patient_id)
        REFERENCES patients (patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_condition_patient (patient_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 4. Vitals Table (Captured per visit)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS vitals (
    vital_id INT AUTO_INCREMENT PRIMARY KEY,
    encounter_id INT NOT NULL,
    systolic_bp SMALLINT UNSIGNED,    -- mmHg
    diastolic_bp SMALLINT UNSIGNED,   -- mmHg
    heart_rate SMALLINT UNSIGNED,      -- bpm
    respiratory_rate SMALLINT UNSIGNED, -- breaths/min
    temperature_c DECIMAL(4, 1),       -- Celsius
    oxygen_saturation DECIMAL(4, 1),   -- SpO2 %
    weight_kg DECIMAL(5, 2),           -- Weight in kilograms
    height_cm DECIMAL(5, 2),           -- Height in centimeters
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vitals_encounters
        FOREIGN KEY (encounter_id)
        REFERENCES encounters (encounter_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_vitals_encounter (encounter_id)
) ENGINE=InnoDB;
