import random
from datetime import datetime, timedelta
import mysql.connector
from faker import Faker

# Initialize Faker
fake = Faker()

# Database Connection Settings
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'med_app_user',
    'password': 'YourStrongPasswordHere!',  # Update with your password
    'database': 'patient_sim_db'
}

# Common ICD-10 medical conditions for realistic sample data
COMMON_CONDITIONS = [
    ('E11.9', 'Type 2 diabetes mellitus without complications'),
    ('I10', 'Essential (primary) hypertension'),
    ('J45.909', 'Unspecified asthma, uncomplicated'),
    ('E78.5', 'Hyperlipidemia, unspecified'),
    ('M54.50', 'Low back pain, unspecified'),
    ('F41.1', 'Generalized anxiety disorder'),
    ('F32.9', 'Major depressive disorder, single episode, unspecified'),
    ('K21.9', 'Gastro-esophageal reflux disease without esophagitis'),
]

ENCOUNTER_TYPES = ['Outpatient', 'Inpatient', 'Emergency', 'Telehealth', 'Routine']
CONDITION_STATUSES = ['Active', 'Resolved', 'In Remission', 'Recurrent']

def generate_patient_data():
    """Generate demographic data for a single patient."""
    gender = random.choice(['Male', 'Female', 'Other'])
    
    if gender == 'Male':
        first_name = fake.first_name_male()
    elif gender == 'Female':
        first_name = fake.first_name_female()
    else:
        first_name = fake.first_name()

    return (
        f"MRN-{fake.numerify(text='######')}",
        first_name,
        fake.last_name(),
        fake.date_of_birth(minimum_age=18, maximum_age=90),
        gender,
        fake.phone_number()[:20],
        fake.email(),
        fake.street_address()[:100],
        fake.city()[:50],
        fake.state_abbr()[:50],
        fake.zipcode()[:20]
    )

def main():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("Connected to MariaDB successfully. Seeding data...")

        total_patients = 1000

        for i in range(total_patients):
            # 1. Insert Patient Demographics
            patient_data = generate_patient_data()
            insert_patient_sql = """
                INSERT INTO patients 
                (mrn, first_name, last_name, date_of_birth, gender, phone, email, address_line1, city, state, postal_code)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_patient_sql, patient_data)
            patient_id = cursor.lastrowid

            # 2. Insert Medical History (0 to 3 conditions per patient)
            num_conditions = random.randint(0, 3)
            selected_conditions = random.sample(COMMON_CONDITIONS, num_conditions)
            
            for icd_code, cond_name in selected_conditions:
                diag_date = fake.date_between(start_date='-5y', end_date='today')
                status = random.choice(CONDITION_STATUSES)
                resolved_date = fake.date_between(start_date=diag_date, end_date='today') if status == 'Resolved' else None

                insert_history_sql = """
                    INSERT INTO medical_history 
                    (patient_id, icd10_code, condition_name, status, diagnosed_date, resolved_date, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(insert_history_sql, (
                    patient_id, icd_code, cond_name, status, diag_date, resolved_date, fake.sentence()
                ))

            # 3. Insert Encounters (1 to 4 visits per patient)
            num_encounters = random.randint(1, 4)
            for _ in range(num_encounters):
                visit_start = fake.date_time_between(start_date='-2y', end_date='now')
                visit_end = visit_start + timedelta(minutes=random.randint(20, 90))
                
                insert_encounter_sql = """
                    INSERT INTO encounters 
                    (patient_id, encounter_type, visit_start_datetime, visit_end_datetime, attending_physician, reason_for_visit, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(insert_encounter_sql, (
                    patient_id,
                    random.choice(ENCOUNTER_TYPES),
                    visit_start,
                    visit_end,
                    f"Dr. {fake.first_name()} {fake.last_name()}, MD",
                    fake.catch_phrase()[:255],
                    fake.paragraph(nb_sentences=2)
                ))
                encounter_id = cursor.lastrowid

                # 4. Insert Vitals for the encounter
                systolic = random.randint(100, 150)
                diastolic = random.randint(60, 95)
                heart_rate = random.randint(58, 105)
                resp_rate = random.randint(12, 20)
                temp = round(random.uniform(36.1, 38.2), 1)
                o2_sat = round(random.uniform(94.0, 100.0), 1)
                weight = round(random.uniform(50.0, 120.0), 2)
                height = round(random.uniform(150.0, 195.0), 2)

                insert_vitals_sql = """
                    INSERT INTO vitals 
                    (encounter_id, systolic_bp, diastolic_bp, heart_rate, respiratory_rate, temperature_c, oxygen_saturation, weight_kg, height_cm)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(insert_vitals_sql, (
                    encounter_id, systolic, diastolic, heart_rate, resp_rate, temp, o2_sat, weight, height
                ))

            # Progress feedback every 200 patients
            if (i + 1) % 200 == 0:
                conn.commit()  # Batch commit
                print(f"[{i + 1}/1000] Patient records seeded...")

        # Final commit for remaining records
        conn.commit()
        print("\nSuccess! 1,000 synthetic patient records (plus encounters, vitals, and histories) inserted.")

    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    main()
