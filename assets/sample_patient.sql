-- Insert a test patient
INSERT INTO patients (mrn, first_name, last_name, date_of_birth, gender, phone, email, city, state, postal_code)
VALUES ('MRN-100201', 'Jane', 'Doe', '1985-04-12', 'Female', '555-0199', 'jane.doe@example.com', 'Seattle', 'WA', '98101');

SET @patient_id = LAST_INSERT_ID();

-- Add active medical condition
INSERT INTO medical_history (patient_id, icd10_code, condition_name, status, diagnosed_date)
VALUES (@patient_id, 'E11.9', 'Type 2 diabetes mellitus without complications', 'Active', '2021-06-15');

-- Add a visit record
INSERT INTO encounters (patient_id, encounter_type, visit_start_datetime, visit_end_datetime, attending_physician, reason_for_visit, notes)
VALUES (
    @patient_id, 
    'Outpatient', 
    '2026-02-10 09:30:00', 
    '2026-02-10 10:15:00', 
    'Dr. Sarah Lin, MD', 
    'Routine Diabetes Follow-up', 
    'Patient reports steady blood sugar levels. Routine lab work ordered.'
);

SET @encounter_id = LAST_INSERT_ID();

-- Add vitals for the visit
INSERT INTO vitals (encounter_id, systolic_bp, diastolic_bp, heart_rate, respiratory_rate, temperature_c, oxygen_saturation, weight_kg, height_cm)
VALUES (@encounter_id, 122, 78, 72, 16, 36.8, 98.5, 68.50, 165.00);
