"""
Workforce Management Database - Dummy Data Generator
Generates realistic records across all tables matching the current Prisma schema
"""

import os
import random
from datetime import datetime, timedelta
from faker import Faker
import psycopg
import uuid

def execute_values(cursor, query, values):
    """Execute batch insert for psycopg3"""
    placeholders = ','.join(['%s'] * len(values))
    formatted_query = query.replace('%s', f'({",".join(["%s"] * len(values[0]))})') if values else query

    for row in values:
        cursor.execute(query.replace('VALUES %s', f'VALUES ({",".join(["%s"] * len(row))})'), row)

# Initialize Faker
fake = Faker('en_IN')  # Indian locale for realistic data

# Database Configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'aws-1-ap-southeast-2.pooler.supabase.com'),
    'database': os.getenv('DB_NAME', 'postgres'),
    'user': os.getenv('DB_USER', 'postgres.pxmmbncxiknrhbgtwyyd'),
    'password': os.getenv('DB_PASSWORD', 'M28UUiGNduO4e4zD'),
    'port': int(os.getenv('DB_PORT', 5432))
}

# ENUM/Status definitions based on schema
GENDER_TYPE = ['male', 'female', 'other']
ACCOUNT_TYPE = ['savings', 'current']
ADDRESS_TYPE = ['permanent', 'current', 'temporary']
VERIFICATION_STATUS = ['pending', 'approved', 'rejected']
BATCH_STATUS = ['upcoming', 'ongoing', 'completed', 'cancelled']
ENROLLMENT_STATUS = ['enrolled', 'completed', 'dropped']
PROJECT_STATUS = ['planning', 'active', 'completed', 'on_hold', 'archived']
DEPLOYMENT_STATUS = ['allocated', 'active', 'completed', 'cancelled']
REQUEST_STATUS = ['pending', 'approved', 'rejected']
POST_STATUS = ['draft', 'scheduled', 'published', 'failed']
PLATFORM_POST_STATUS = ['pending', 'published', 'failed']
PLATFORMS = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube']

# Skill categories
SKILLS = [
    'Carpentry', 'Masonry', 'Plumbing', 'Electrical', 'Welding',
    'Painting', 'Tiling', 'Steel Fixing', 'Shuttering', 'Machine Operation',
    'Heavy Equipment Operation', 'Safety Management', 'Site Supervision',
    'Quality Control', 'Civil Engineering'
]

# Cities in India
CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow']

class DatabasePopulator:
    def __init__(self):
        self.conn = None
        self.cursor = None
        self.data_ids = {
            'users': [],
            'skill_categories': [],
            'employers': [],
            'profiles': [],
            'training_batches': [],
            'projects': [],
            'social_media_posts': []
        }

    def connect(self):
        """Establish database connection"""
        try:
            conn_string = f"host={DB_CONFIG['host']} port={DB_CONFIG['port']} dbname={DB_CONFIG['database']} user={DB_CONFIG['user']} password={DB_CONFIG['password']}"
            self.conn = psycopg.connect(conn_string)
            self.cursor = self.conn.cursor()
            print("✅ Database connected successfully")
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            raise

    def close(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✅ Database connection closed")

    def generate_users(self, count=10):
        """Generate admin and staff users"""
        print(f"\n📝 Generating {count} users...")
        users = []

        for i in range(count):
            user_id = str(uuid.uuid4())
            users.append((
                user_id,
                f"user{i+1}",
                fake.email(),
                f"$2b$10${''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=53))}",
                fake.name(),
                fake.phone_number()[:15],
                True,
                datetime.now() - timedelta(days=random.randint(1, 30)),
                datetime.now(),
                datetime.now()
            ))
            self.data_ids['users'].append(user_id)

        query = """
            INSERT INTO users (id, username, email, password_hash, full_name, phone_number,
                             is_active, last_login, created_at, updated_at)
            VALUES %s
        """
        execute_values(self.cursor, query, users)
        self.conn.commit()
        print(f"✅ Created {count} users")

    def generate_skill_categories(self):
        """Generate skill categories"""
        print(f"\n📝 Generating {len(SKILLS)} skill categories...")
        skills = []

        for idx, skill in enumerate(SKILLS):
            skill_id = str(uuid.uuid4())
            skills.append((
                skill_id,
                skill,
                f"Professional {skill.lower()} services",
                True,
                idx,
                datetime.now(),
                datetime.now()
            ))
            self.data_ids['skill_categories'].append(skill_id)

        query = """
            INSERT INTO skill_categories (id, name, description, is_active, display_order,
                                        created_at, updated_at)
            VALUES %s
        """
        execute_values(self.cursor, query, skills)
        self.conn.commit()
        print(f"✅ Created {len(SKILLS)} skill categories")

    def generate_employers(self, count=20):
        """Generate employer companies"""
        print(f"\n🏢 Generating {count} employers...")
        employers = []

        for i in range(count):
            employer_id = str(uuid.uuid4())
            is_approved = random.choice([True, False])
            is_verified = is_approved and random.random() > 0.3

            employers.append((
                employer_id,
                f"EMPLR-{1000+i}",
                fake.company(),
                fake.name(),
                fake.email(),
                f"$2b$10${''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=53))}",
                fake.phone_number()[:15],
                fake.phone_number()[:15] if random.random() > 0.5 else None,
                fake.address(),
                f"{random.randint(1000000, 9999999)}{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=3))}{random.randint(1000, 9999)}" if random.random() > 0.3 else None,
                f"{random.randint(10, 35)}{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=5))}{random.randint(1000, 9999)}{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=1))}{random.randint(1, 9)}{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=1))}{random.randint(1, 9)}" if random.random() > 0.5 else None,
                fake.name(),
                random.choice(['CEO', 'Director', 'Manager', 'HR Head']),
                fake.email(),
                fake.phone_number()[:15],
                fake.address() if random.random() > 0.5 else None,
                is_approved,
                True,
                is_verified,
                datetime.now() - timedelta(days=random.randint(1, 60)) if is_verified else None,
                datetime.now() - timedelta(days=random.randint(1, 30)) if random.random() > 0.5 else None,
                datetime.now() - timedelta(days=random.randint(30, 365)),
                datetime.now(),
                random.choice(self.data_ids['users']) if is_verified else None,
                None,
                None
            ))
            self.data_ids['employers'].append(employer_id)

        query = """
            INSERT INTO employers (id, employer_code, company_name, client_name, email, password_hash,
                                 phone_number, alternative_phone, registered_address,
                                 company_registration_number, gst_number, authorized_person_name,
                                 authorized_person_designation, authorized_person_email,
                                 authorized_person_contact, authorized_person_address,
                                 is_approved, is_active, is_verified, verified_at, last_login,
                                 created_at, updated_at, verified_by_user_id, deleted_at,
                                 deleted_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, employers)
        self.conn.commit()
        print(f"✅ Created {count} employers")

    def generate_profiles(self, count=120):
        """Generate worker profiles"""
        print(f"\n📝 Generating {count} profiles...")
        profiles = []

        for i in range(count):
            profile_id = str(uuid.uuid4())
            dob = fake.date_of_birth(minimum_age=20, maximum_age=60)
            is_blacklisted = random.random() < 0.05

            profiles.append((
                profile_id,
                f"PRF-{10000+i}",
                fake.phone_number()[:15],
                fake.phone_number()[:15] if random.random() > 0.5 else None,
                fake.email() if random.random() > 0.5 else None,
                fake.first_name(),
                fake.first_name() if random.random() > 0.5 else None,
                fake.last_name(),
                fake.name(),
                str(fake.unique.random_number(digits=12)),
                random.choice(GENDER_TYPE),
                dob,
                True,
                f"EMP-{5000+i}" if random.random() > 0.3 else None,
                is_blacklisted,
                fake.sentence() if is_blacklisted else None,
                datetime.now() - timedelta(days=random.randint(1, 90)) if is_blacklisted else None,
                datetime.now() - timedelta(days=random.randint(1, 180)),
                datetime.now(),
                f"https://storage.example.com/photos/{uuid.uuid4()}.jpg" if random.random() > 0.5 else None,
                random.choice(self.data_ids['users']) if is_blacklisted else None,
                None,
                None
            ))
            self.data_ids['profiles'].append(profile_id)

        query = """
            INSERT INTO profiles (id, profile_code, mobile_number, alternative_whatsapp_number,
                                email, first_name, middle_name, last_name, fathers_name,
                                aadhar_number, gender, date_of_birth, is_active, employee_code,
                                is_blacklisted, blacklist_reason, blacklisted_at, created_at,
                                updated_at, profile_photo_url, blacklisted_by_user_id,
                                deleted_at, deleted_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, profiles)
        self.conn.commit()
        print(f"✅ Created {count} profiles")

    def generate_addresses(self):
        """Generate addresses for profiles"""
        print(f"\n📝 Generating addresses...")
        addresses = []

        for profile_id in self.data_ids['profiles']:
            num_addresses = random.choices([1, 2], weights=[0.7, 0.3])[0]

            for idx in range(num_addresses):
                addresses.append((
                    str(uuid.uuid4()),
                    profile_id,
                    ADDRESS_TYPE[idx] if idx < len(ADDRESS_TYPE) else 'permanent',
                    fake.building_number(),
                    fake.street_name()[:100],
                    fake.state()[:50],
                    fake.postcode()[:10],
                    fake.city() if random.random() > 0.5 else None,
                    fake.city() if random.random() > 0.5 else None,
                    fake.city() if random.random() > 0.5 else None,
                    idx == 0,
                    datetime.now(),
                    datetime.now()
                ))

        query = """
            INSERT INTO addresses (id, profile_id, address_type, house_number, village_or_city,
                                 state, postal_code, landmark, police_station, post_office,
                                 is_current, created_at, updated_at)
            VALUES %s
        """
        execute_values(self.cursor, query, addresses)
        self.conn.commit()
        print(f"✅ Created {len(addresses)} addresses")

    def generate_bank_accounts(self):
        """Generate bank accounts for profiles"""
        print(f"\n📝 Generating bank accounts...")
        accounts = []

        profiles_with_accounts = random.sample(self.data_ids['profiles'], int(len(self.data_ids['profiles']) * 0.7))

        for profile_id in profiles_with_accounts:
            is_verified = random.random() > 0.3
            verification_status = random.choice(VERIFICATION_STATUS) if not is_verified else 'approved'

            accounts.append((
                str(uuid.uuid4()),
                profile_id,
                fake.name(),
                f"{random.randint(10000000000, 99999999999)}",
                fake.swift()[:11],
                fake.company()[:50],
                fake.street_name()[:100],
                random.choice(ACCOUNT_TYPE),
                True,
                is_verified,
                verification_status,
                datetime.now() - timedelta(days=random.randint(1, 90)) if is_verified else None,
                datetime.now(),
                datetime.now(),
                random.choice(self.data_ids['users']) if is_verified else None
            ))

        query = """
            INSERT INTO bank_accounts (id, profile_id, account_holder_name, account_number,
                                     ifsc_code, bank_name, branch_name, account_type, is_primary,
                                     is_verified, verification_status, verified_at, created_at,
                                     updated_at, verified_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, accounts)
        self.conn.commit()
        print(f"✅ Created {len(accounts)} bank accounts")

    def generate_qualifications(self):
        """Generate educational qualifications"""
        print(f"\n📝 Generating qualifications...")
        qualifications = []

        qual_types = ['10th', '12th', 'ITI', 'Diploma', 'B.E', 'B.Tech', 'Certificate Course']
        institutions = ['Government ITI', 'Industrial Training Center', 'Technical Institute', 'University']
        fields = ['Civil Engineering', 'Mechanical', 'Electrical', 'Electronics', 'Construction']

        profiles_with_qual = random.sample(self.data_ids['profiles'], int(len(self.data_ids['profiles']) * 0.6))

        for profile_id in profiles_with_qual:
            num_quals = random.choices([1, 2], weights=[0.7, 0.3])[0]

            for _ in range(num_quals):
                year = random.randint(2000, 2024)
                is_verified = random.random() > 0.5

                qualifications.append((
                    str(uuid.uuid4()),
                    profile_id,
                    random.choice(qual_types),
                    random.choice(institutions),
                    random.choice(fields) if random.random() > 0.3 else None,
                    year,
                    f"{random.randint(50, 95)}%" if random.random() > 0.3 else None,
                    f"https://storage.example.com/certificates/{uuid.uuid4()}.pdf" if random.random() > 0.5 else None,
                    datetime.now() - timedelta(days=random.randint(1, 60)) if is_verified else None,
                    datetime.now(),
                    random.choice(self.data_ids['users']) if is_verified else None
                ))

        query = """
            INSERT INTO qualifications (id, profile_id, qualification_type, institution_name,
                                      field_of_study, year_of_completion, percentage_or_grade,
                                      certificate_url, verified_at, created_at, verified_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, qualifications)
        self.conn.commit()
        print(f"✅ Created {len(qualifications)} qualifications")

    def generate_profile_skills(self):
        """Generate skills for profiles"""
        print(f"\n📝 Generating profile skills...")
        profile_skills = []

        for profile_id in self.data_ids['profiles']:
            num_skills = random.randint(2, 5)
            selected_skills = random.sample(self.data_ids['skill_categories'], num_skills)

            for idx, skill_id in enumerate(selected_skills):
                is_verified = random.random() > 0.5

                profile_skills.append((
                    str(uuid.uuid4()),
                    profile_id,
                    skill_id,
                    random.randint(0, 20),
                    idx == 0,
                    datetime.now() - timedelta(days=random.randint(1, 60)) if is_verified else None,
                    datetime.now(),
                    datetime.now(),
                    random.choice(self.data_ids['users']) if is_verified else None
                ))

        query = """
            INSERT INTO profile_skills (id, profile_id, skill_category_id, years_of_experience,
                                      is_primary, verified_at, created_at, updated_at,
                                      verified_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, profile_skills)
        self.conn.commit()
        print(f"✅ Created {len(profile_skills)} profile skills")

    def generate_training_batches(self, count=8):
        """Generate training batches"""
        print(f"\n📝 Generating {count} training batches...")
        batches = []

        for i in range(count):
            batch_id = str(uuid.uuid4())
            start_date = datetime.now() - timedelta(days=random.randint(0, 180))
            duration = random.randint(30, 90)
            end_date = start_date + timedelta(days=duration)

            status = random.choice(BATCH_STATUS)
            if end_date < datetime.now():
                status = 'completed'
            elif start_date < datetime.now() < end_date:
                status = 'ongoing'
            else:
                status = 'upcoming'

            batches.append((
                batch_id,
                f"BATCH-{2000+i}",
                f"Batch {i+1} - {random.choice(SKILLS)} Training",
                random.choice(SKILLS),
                fake.company(),
                fake.name(),
                start_date.date(),
                end_date.date(),
                duration,
                random.randint(20, 50),
                status,
                random.choice(CITIES),
                fake.text(max_nb_chars=200),
                datetime.now(),
                datetime.now(),
                random.choice(self.data_ids['users'])
            ))
            self.data_ids['training_batches'].append(batch_id)

        query = """
            INSERT INTO training_batches (id, batch_code, batch_name, training_program_name,
                                        training_provider, trainer_name, start_date, end_date,
                                        duration_days, max_capacity, status, location, description,
                                        created_at, updated_at, created_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, batches)
        self.conn.commit()
        print(f"✅ Created {count} training batches")

    def generate_batch_enrollments(self):
        """Generate batch enrollments"""
        print(f"\n📝 Generating batch enrollments...")
        enrollments = []

        profiles_to_enroll = random.sample(self.data_ids['profiles'], int(len(self.data_ids['profiles']) * 0.7))

        for profile_id in profiles_to_enroll:
            batch_id = random.choice(self.data_ids['training_batches'])
            enrolled_date = datetime.now() - timedelta(days=random.randint(1, 90))

            status = random.choice(ENROLLMENT_STATUS)
            completion_date = enrolled_date + timedelta(days=random.randint(30, 90)) if status == 'completed' else None

            enrollments.append((
                enrolled_date.date(),
                completion_date.date() if completion_date else None,
                status,
                random.randint(60, 100) if random.random() > 0.3 else None,
                random.randint(50, 95) if status == 'completed' else None,
                f"https://storage.example.com/certificates/{uuid.uuid4()}.pdf" if status == 'completed' and random.random() > 0.5 else None,
                fake.text(max_nb_chars=100) if random.random() > 0.7 else None,
                datetime.now(),
                datetime.now(),
                str(uuid.uuid4()),
                profile_id,
                batch_id,
                random.choice(self.data_ids['users'])
            ))

        query = """
            INSERT INTO batch_enrollments (enrollment_date, completion_date, status,
                                         attendance_percentage, score, certificate_url, notes,
                                         created_at, updated_at, id, profile_id, batch_id,
                                         enrolled_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, enrollments)
        self.conn.commit()
        print(f"✅ Created {len(enrollments)} batch enrollments")

    def generate_projects(self, count=25):
        """Generate construction projects"""
        print(f"\n📝 Generating {count} projects...")
        projects = []

        project_types = ['Residential', 'Commercial', 'Industrial', 'Infrastructure']

        for i in range(count):
            project_id = str(uuid.uuid4())
            start_date = datetime.now() - timedelta(days=random.randint(0, 365))
            end_date = start_date + timedelta(days=random.randint(180, 730))

            status = random.choice(PROJECT_STATUS)
            contract_value = random.randint(5000000, 50000000)

            projects.append((
                project_id,
                f"PRJ-{30000+i}",
                f"{random.choice(project_types)} Project - {fake.street_name()}",
                f"PN-{random.randint(1000, 9999)}",
                random.choice(CITIES),
                fake.phone_number()[:15],
                start_date.date() if random.random() > 0.3 else None,
                start_date.date() if random.random() > 0.2 else None,
                start_date.date(),
                end_date.date(),
                end_date.date() if random.random() > 0.5 else None,
                status,
                random.randint(10, 100),
                fake.name(),
                fake.text(max_nb_chars=200),
                f"PO-{random.randint(1000, 9999)}",
                contract_value,
                contract_value * random.uniform(0.9, 1.1) if random.random() > 0.5 else None,
                random.randint(0, int(contract_value * 0.1)),
                random.randint(0, int(contract_value * 0.8)) if status in ['active', 'completed'] else 0,
                random.randint(0, int(contract_value * 0.05)),
                contract_value * random.uniform(0.95, 1.15) if random.random() > 0.5 else None,
                True,
                random.random() > 0.5,
                datetime.now(),
                datetime.now(),
                datetime.now() - timedelta(days=random.randint(1, 30)),
                fake.text(max_nb_chars=100) if random.random() > 0.5 else None,
                None,
                random.choice(self.data_ids['employers']),
                random.choice(self.data_ids['users']),
                random.choice(self.data_ids['users']),
                None,
                None
            ))
            self.data_ids['projects'].append(project_id)

        query = """
            INSERT INTO projects (id, project_code, project_name, project_number, location,
                                phone_number, deployment_date, award_date, start_date, end_date,
                                revised_completion_date, status, required_workers, project_manager,
                                description, po_co_number, contract_value_a, revised_contract_value_b,
                                variation_order_value_c, actual_cost_incurred_d, misc_cost_e, budget,
                                is_active, is_accommodation_provided, created_at, updated_at,
                                approved_at, approval_notes, rejection_reason, employer_id,
                                approved_by_user_id, created_by_user_id, deleted_at, deleted_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, projects)
        self.conn.commit()
        print(f"✅ Created {count} projects")

    def generate_project_resource_requirements(self):
        """Generate project resource requirements"""
        print(f"\n📝 Generating project resource requirements...")
        requirements = []

        for project_id in self.data_ids['projects']:
            num_skills = random.randint(2, 5)
            selected_skills = random.sample(self.data_ids['skill_categories'], num_skills)

            for skill_id in selected_skills:
                requirements.append((
                    str(uuid.uuid4()),
                    project_id,
                    skill_id,
                    random.randint(5, 30),
                    fake.text(max_nb_chars=100) if random.random() > 0.7 else None,
                    datetime.now(),
                    datetime.now()
                ))

        query = """
            INSERT INTO project_resource_requirements (id, project_id, skill_category_id,
                                                     required_count, notes, created_at, updated_at)
            VALUES %s
        """
        execute_values(self.cursor, query, requirements)
        self.conn.commit()
        print(f"✅ Created {len(requirements)} project resource requirements")

    def generate_project_deployments(self):
        """Generate project deployments"""
        print(f"\n📝 Generating project deployments...")
        deployments = []

        profiles_to_deploy = random.sample(self.data_ids['profiles'], int(len(self.data_ids['profiles']) * 0.6))

        for profile_id in profiles_to_deploy:
            project_id = random.choice(self.data_ids['projects'])
            deploy_date = datetime.now() - timedelta(days=random.randint(1, 180))
            expected_end = deploy_date + timedelta(days=random.randint(90, 365))

            status = random.choice(DEPLOYMENT_STATUS)
            actual_end = None
            if status == 'completed':
                actual_end = deploy_date + timedelta(days=random.randint(90, 300))

            deployments.append((
                str(uuid.uuid4()),
                project_id,
                profile_id,
                deploy_date.date(),
                expected_end.date(),
                actual_end.date() if actual_end else None,
                status,
                random.randint(1, 5) if status in ['completed', 'active'] else None,
                datetime.now(),
                datetime.now(),
                random.choice(self.data_ids['users'])
            ))

        query = """
            INSERT INTO project_deployments (id, project_id, profile_id, deployment_date,
                                           expected_end_date, actual_end_date, status,
                                           performance_rating, created_at, updated_at,
                                           deployed_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, deployments)
        self.conn.commit()
        print(f"✅ Created {len(deployments)} project deployments")

    def generate_stage_transitions(self):
        """Generate stage transition history"""
        print(f"\n📝 Generating stage transitions...")
        transitions = []

        stages = ['new_join', 'screening', 'approved', 'training', 'benched', 'deployed', 'upskilling']

        for profile_id in self.data_ids['profiles']:
            num_transitions = random.randint(2, 5)

            for i in range(num_transitions):
                from_stage = stages[i] if i < len(stages) - 1 else random.choice(stages)
                to_stage = stages[i + 1] if i + 1 < len(stages) else random.choice(stages)

                transition_date = datetime.now() - timedelta(days=random.randint(1, 150 - i * 20))

                transitions.append((
                    str(uuid.uuid4()),
                    profile_id,
                    from_stage,
                    to_stage,
                    transition_date,
                    fake.text(max_nb_chars=100) if random.random() > 0.5 else None,
                    random.choice(self.data_ids['users'])
                ))

        query = """
            INSERT INTO stage_transitions (id, profile_id, from_stage, to_stage, transitioned_at,
                                         notes, transitioned_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, transitions)
        self.conn.commit()
        print(f"✅ Created {len(transitions)} stage transitions")

    def generate_documents(self):
        """Generate profile documents"""
        print(f"\n📝 Generating documents...")
        documents = []

        doc_categories = ['identity', 'education', 'employment', 'financial']
        doc_types = ['aadhaar', 'pan', 'resume', 'certificate', 'photo', 'police_verification']

        profiles_with_docs = random.sample(self.data_ids['profiles'], int(len(self.data_ids['profiles']) * 0.8))

        for profile_id in profiles_with_docs:
            num_docs = random.randint(2, 4)
            selected_docs = random.sample(doc_types, min(num_docs, len(doc_types)))

            for doc_type in selected_docs:
                is_verified = random.random() > 0.3
                verification_status = random.choice(VERIFICATION_STATUS) if not is_verified else 'approved'

                expiry_date = None
                if doc_type in ['aadhaar', 'pan', 'police_verification']:
                    expiry_date = datetime.now() + timedelta(days=random.randint(365, 3650))

                documents.append((
                    str(uuid.uuid4()),
                    profile_id,
                    random.choice(doc_categories),
                    doc_type,
                    f"DOC-{random.randint(100000, 999999)}" if random.random() > 0.5 else None,
                    f"{doc_type}_{uuid.uuid4()}.pdf",
                    f"https://storage.example.com/{uuid.uuid4()}.pdf",
                    random.randint(100000, 5000000),
                    verification_status,
                    datetime.now() - timedelta(days=random.randint(1, 60)) if is_verified else None,
                    datetime.now() - timedelta(days=random.randint(1, 90)),
                    expiry_date.date() if expiry_date else None,
                    datetime.now(),
                    random.choice(self.data_ids['users']),
                    random.choice(self.data_ids['users']) if is_verified else None
                ))

        query = """
            INSERT INTO documents (id, profile_id, document_category, document_type, document_number,
                                 file_name, file_url, file_size, verification_status, verified_at,
                                 uploaded_at, expiry_date, created_at, uploaded_by_user_id,
                                 verified_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, documents)
        self.conn.commit()
        print(f"✅ Created {len(documents)} documents")

    def generate_interactions(self):
        """Generate profile interactions"""
        print(f"\n📝 Generating interactions...")
        interactions = []

        interaction_types = ['call', 'email', 'meeting', 'site_visit', 'interview', 'follow_up']
        outcomes = ['positive', 'negative', 'neutral', 'callback_requested']

        profiles_with_interactions = random.sample(self.data_ids['profiles'], int(len(self.data_ids['profiles']) * 0.5))

        for profile_id in profiles_with_interactions:
            num_interactions = random.randint(1, 3)

            for _ in range(num_interactions):
                interaction_date = datetime.now() - timedelta(days=random.randint(1, 90))

                interactions.append((
                    str(uuid.uuid4()),
                    profile_id,
                    random.choice(interaction_types),
                    interaction_date,
                    fake.sentence(nb_words=6),
                    fake.text(max_nb_chars=200),
                    random.choice(outcomes),
                    interaction_date.date() + timedelta(days=random.randint(7, 30)) if random.random() > 0.5 else None,
                    datetime.now(),
                    datetime.now(),
                    random.choice(self.data_ids['users'])
                ))

        query = """
            INSERT INTO interactions (id, profile_id, interaction_type, interaction_date, subject,
                                    description, outcome, next_follow_up_date, created_at,
                                    updated_at, created_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, interactions)
        self.conn.commit()
        print(f"✅ Created {len(interactions)} interactions")

    def generate_project_requests(self):
        """Generate project requests from employers"""
        print(f"\n📝 Generating project requests...")
        requests = []

        for _ in range(30):
            employer_id = random.choice(self.data_ids['employers'])
            project_id = random.choice(self.data_ids['projects']) if random.random() > 0.5 else None

            is_reviewed = random.random() > 0.3
            status = random.choice(REQUEST_STATUS) if is_reviewed else 'pending'

            start_date = datetime.now() + timedelta(days=random.randint(30, 180))

            requests.append((
                str(uuid.uuid4()),
                employer_id,
                project_id,
                fake.sentence(nb_words=10),
                fake.text(max_nb_chars=300),
                random.choice(CITIES),
                start_date.date(),
                random.randint(30, 365),
                random.randint(5000000, 50000000),
                random.randint(10, 100),
                fake.text(max_nb_chars=200) if random.random() > 0.5 else None,
                status,
                datetime.now() - timedelta(days=random.randint(1, 30)) if is_reviewed else None,
                datetime.now(),
                datetime.now(),
                random.choice(self.data_ids['users']) if is_reviewed else None
            ))

        query = """
            INSERT INTO project_requests (id, employer_id, project_id, project_title,
                                        project_description, location, estimated_start_date,
                                        estimated_duration_days, estimated_budget,
                                        required_workers_count, additional_notes, status,
                                        reviewed_at, created_at, updated_at, reviewed_by_user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, requests)
        self.conn.commit()
        print(f"✅ Created {len(requests)} project requests")

    def generate_activity_logs(self):
        """Generate activity logs"""
        print(f"\n📝 Generating activity logs...")
        logs = []

        actions = [
            'profile_created', 'profile_updated', 'profile_deployed', 'profile_verified',
            'project_created', 'project_updated', 'batch_created', 'enrollment_added',
            'document_uploaded', 'document_verified', 'skill_verified', 'user_login'
        ]

        modules = ['profiles', 'projects', 'batches', 'documents', 'auth', 'deployments']

        for _ in range(200):
            logs.append((
                str(uuid.uuid4()),
                random.choice(actions),
                random.choice(modules),
                random.randint(1, 1000),
                fake.word() if random.random() > 0.5 else None,
                fake.word() if random.random() > 0.5 else None,
                fake.ipv4() if random.random() > 0.5 else None,
                fake.user_agent() if random.random() > 0.5 else None,
                datetime.now() - timedelta(days=random.randint(0, 180)),
                random.choice(self.data_ids['users'])
            ))

        query = """
            INSERT INTO activity_logs (id, action, module, record_id, old_value, new_value,
                                     ip_address, user_agent, created_at, user_id)
            VALUES %s
        """
        execute_values(self.cursor, query, logs)
        self.conn.commit()
        print(f"✅ Created {len(logs)} activity logs")

    def generate_scraper_websites(self):
        """Generate scraper websites"""
        print(f"\n📝 Generating scraper websites...")
        websites = []

        website_types = ['news', 'tender', 'government', 'other']
        sample_websites = [
            ('Construction Weekly India', 'https://constructionweeklyindia.com', 'news'),
            ('Government e-Marketplace', 'https://gem.gov.in/tenders', 'tender'),
            ('Ministry of Road Transport', 'https://morth.gov.in/tenders', 'government'),
            ('NHAI Tenders', 'https://nhai.gov.in/tenders', 'tender'),
            ('Indian Railways Tenders', 'https://indianrailways.gov.in/tenders', 'government'),
        ]

        for name, url, site_type in sample_websites:
            websites.append((
                str(uuid.uuid4()),
                url,
                site_type,
                True,
                datetime.now(),
                datetime.now(),
                name
            ))

        query = """
            INSERT INTO scraper_websites (id, url, type, is_active, created_at, updated_at, name)
            VALUES %s
        """
        execute_values(self.cursor, query, websites)
        self.conn.commit()
        print(f"✅ Created {len(websites)} scraper websites")

    def generate_news_updates(self):
        """Generate news updates"""
        print(f"\n📝 Generating news updates...")
        updates = []

        sectors = ['Infrastructure', 'Residential', 'Commercial', 'Industrial', 'Transport']
        statuses = ['Announced', 'In Progress', 'Delayed', 'Completed', 'Cancelled']

        for i in range(50):
            updates.append((
                str(uuid.uuid4()),
                f"{random.choice(sectors)} Project - {fake.street_name()}",
                random.choice(sectors),
                fake.company() if random.random() > 0.3 else None,
                random.choice(CITIES) if random.random() > 0.2 else None,
                random.randint(10, 5000),
                random.choice(statuses) if random.random() > 0.3 else None,
                random.randint(10, 5000) if random.random() > 0.5 else None,
                f"{random.randint(12, 60)} months" if random.random() > 0.5 else None,
                fake.text(max_nb_chars=200) if random.random() > 0.5 else None,
                f"https://example.com/news/{uuid.uuid4()}",
                random.choice(['news_portal', 'government_site', 'company_website']),
                fake.text(max_nb_chars=300),
                datetime.now() - timedelta(days=random.randint(0, 30)),
                datetime.now(),
                datetime.now()
            ))

        query = """
            INSERT INTO news_updates (id, project_name, sector, company_authority, location,
                                    value_cr, status, revised_budget, revised_timeline, delay_reason,
                                    source_url, source_type, summary_remarks, scraped_date,
                                    created_at, updated_at)
            VALUES %s
        """
        execute_values(self.cursor, query, updates)
        self.conn.commit()
        print(f"✅ Created {len(updates)} news updates")

    def generate_social_media_posts(self):
        """Generate social media posts"""
        print(f"\n📝 Generating social media posts...")
        posts = []

        for i in range(30):
            num_platforms = random.randint(1, 3)
            selected_platforms = random.sample(PLATFORMS, num_platforms)
            tags = random.sample(['construction', 'hiring', 'jobs', 'infrastructure', 'training', 'skilled_workers'], random.randint(2, 4))

            status = random.choice(POST_STATUS)
            scheduled_at = None
            published_at = None

            if status == 'scheduled':
                scheduled_at = datetime.now() + timedelta(days=random.randint(1, 30))
            elif status == 'published':
                published_at = datetime.now() - timedelta(days=random.randint(1, 30))

            post_id = str(uuid.uuid4())

            posts.append((
                post_id,
                fake.sentence(nb_words=10),
                fake.sentence(nb_words=20) if random.random() > 0.5 else None,
                fake.text(max_nb_chars=200) if random.random() > 0.5 else None,
                fake.text(max_nb_chars=500),
                selected_platforms,
                tags,
                f"https://storage.example.com/images/{uuid.uuid4()}.jpg" if random.random() > 0.5 else None,
                f"https://storage.example.com/videos/{uuid.uuid4()}.mp4" if random.random() > 0.3 else None,
                [f"https://storage.example.com/media/{uuid.uuid4()}.jpg" for _ in range(random.randint(0, 3))],
                fake.sentence(nb_words=8) if random.random() > 0.5 else None,
                f"https://example.com/source/{uuid.uuid4()}" if random.random() > 0.5 else None,
                status,
                scheduled_at,
                published_at,
                None,
                None,
                None,
                random.choice(['Education', 'Science & Technology', 'People & Blogs']) if 'youtube' in selected_platforms else None,
                random.choice(['public', 'unlisted', 'private']) if 'youtube' in selected_platforms else 'public',
                f"https://storage.example.com/thumbnails/{uuid.uuid4()}.jpg" if 'youtube' in selected_platforms and random.random() > 0.5 else None,
                '{}',
                fake.name(),
                datetime.now(),
                datetime.now()
            ))
            self.data_ids['social_media_posts'].append(post_id)

        query = """
            INSERT INTO social_media_posts (id, title, caption, description, content, platforms,
                                          tags, image_url, video_url, media_urls, project_name,
                                          source_url, status, scheduled_at, published_at,
                                          make_response, make_webhook_id, platform_content,
                                          youtube_category, youtube_privacy, youtube_thumbnail,
                                          engagement, created_by, created_at, updated_at)
            VALUES %s
        """
        execute_values(self.cursor, query, posts)
        self.conn.commit()
        print(f"✅ Created {len(posts)} social media posts")

    def generate_social_media_platform_posts(self):
        """Generate platform-specific social media posts"""
        print(f"\n📝 Generating social media platform posts...")
        platform_posts = []

        for post_id in self.data_ids['social_media_posts']:
            num_platforms = random.randint(1, 3)

            for platform in random.sample(PLATFORMS, num_platforms):
                status = random.choice(PLATFORM_POST_STATUS)

                platform_posts.append((
                    str(uuid.uuid4()),
                    post_id,
                    platform,
                    f"{platform}_{uuid.uuid4()}" if status == 'published' else None,
                    status,
                    datetime.now() - timedelta(days=random.randint(1, 30)) if status == 'published' else None,
                    fake.sentence() if status == 'failed' else None,
                    f'{{"likes": {random.randint(0, 1000)}, "shares": {random.randint(0, 100)}, "comments": {random.randint(0, 50)}}}' if status == 'published' else '{}',
                    datetime.now(),
                    datetime.now()
                ))

        query = """
            INSERT INTO social_media_platform_posts (id, post_id, platform, platform_post_id,
                                                    status, published_at, error_message, engagement,
                                                    created_at, updated_at)
            VALUES %s
        """
        execute_values(self.cursor, query, platform_posts)
        self.conn.commit()
        print(f"✅ Created {len(platform_posts)} social media platform posts")

    def run(self):
        """Execute all data generation in proper order"""
        try:
            self.connect()

            print("\n" + "="*60)
            print("🚀 STARTING DATABASE POPULATION")
            print("="*60)

            # Generate data in FK dependency order
            self.generate_users()
            self.generate_skill_categories()
            self.generate_employers()
            self.generate_profiles()
            self.generate_addresses()
            self.generate_bank_accounts()
            self.generate_qualifications()
            self.generate_profile_skills()
            self.generate_training_batches()
            self.generate_batch_enrollments()
            self.generate_projects()
            self.generate_project_resource_requirements()
            self.generate_project_deployments()
            self.generate_stage_transitions()
            self.generate_documents()
            self.generate_interactions()
            self.generate_project_requests()
            self.generate_activity_logs()
            self.generate_scraper_websites()
            self.generate_news_updates()
            self.generate_social_media_posts()
            self.generate_social_media_platform_posts()

            print("\n" + "="*60)
            print("✅ DATABASE POPULATION COMPLETED SUCCESSFULLY")
            print("="*60)
            print(f"\n📊 Summary:")
            print(f"   - Users: 10")
            print(f"   - Skill Categories: {len(SKILLS)}")
            print(f"   - Employers: 20")
            print(f"   - Profiles: 120")
            print(f"   - Projects: 25")
            print(f"   - Training Batches: 8")
            print(f"   - News Updates: 50")
            print(f"   - Social Media Posts: 30")
            print(f"   - Total Records: 500+")
            print("\n🎉 Ready for testing!\n")

        except Exception as e:
            print(f"\n❌ Error during population: {e}")
            import traceback
            traceback.print_exc()
            self.conn.rollback()
            raise
        finally:
            self.close()

if __name__ == "__main__":
    populator = DatabasePopulator()
    populator.run()
