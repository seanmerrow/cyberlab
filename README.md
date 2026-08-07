# cyberlab
Cyber lab on Proxmox

## Proxmox installation


## Disable Proxmox Enterprise repository
1. Select the Proxmox host (ie. cyberlab)
2. In the **Updates** menu, select **Repositories**
3. Select the respository `https://enterprise.proxmox.com/debian/pve`
4. Click on **Disable**
5. Click **Add** and select the **No-Subscription** repository from the dropdown menu, then click **Add** again
6. Select the respository `https://enterprise.proxmox.com/debian/ceph-squid`
7. Click on **Disable**
8. Click **Add** and select the **Ceph Squid No-Subscription** repository from the dropdown menu, then click **Add** again

### Add Open vSwitch
Install openvswitch on the Proxmox host.

1. Right-click on the Proxmox host
2. Select **Shell**

```
apt update
apt install openvswitch-switch
```


## Database server
Update packages on the VM, and install MariaDB

```
sudo dnf upgrade --refresh -y
sudo dnf install mariadb-server -y
```

Start the `mariadb` service and enable it to start at boot up
```
sudo systemctl enable --now mariadb

# Verify it is running
systemctl status mariadb
```
Execute the MariaDB security script to secure root access, drop default anonymous users, and remove test databases
```
sudo mariadb-secure-installation
```
Follow the interactive prompts:

- **Enter current password for root**: Press Enter (default is blank).
- **Switch to unix_socket authentication**: Y.
- **Change root password**: Y (set a strong administrative password).
- **Remove anonymous users**: Y.
- **Disallow root login remotely**: Y.
- **Remove test database and access to it**: Y.
- **Reload privilege tables now**: Y.

Create the Medical Application Database & User
```
# Log in as root
sudo mariadb -u root -p
```
Inside the MariaDB shell, create a dedicated database using utf8mb4 encoding (essential for handling complex medical records and international patient names) and a non-root application user:
```
CREATE DATABASE patient_sim_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'med_app_user'@'localhost' IDENTIFIED BY 'YourStrongPasswordHere!';

GRANT ALL PRIVILEGES ON patient_sim_db.* TO 'med_app_user'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```
Confirm that the new application user can log into the database without root privileges:
```
mariadb -u med_app_user -p patient_sim_db
```

### Create database schema
To create the database schema, which includes all the tables, fields and data definitions, copy the content below into a file called `patients_schema.sql`.

```
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
```

Enter the following command to import the schema into the database.
```
mariadb -u med_app_user -p patient_sim_db < patients_schema.sql
```







