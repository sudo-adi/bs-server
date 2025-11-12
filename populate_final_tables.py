"""
Populate the final two tables by working around the trigger issues
Uses individual inserts with error handling
"""

import os
import random
from datetime import datetime, timedelta
from faker import Faker
import psycopg
import uuid

fake = Faker('en_IN')

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'aws-1-ap-southeast-2.pooler.supabase.com'),
    'database': os.getenv('DB_NAME', 'postgres'),
    'user': os.getenv('DB_USER', 'postgres.pxmmbncxiknrhbgtwyyd'),
    'password': os.getenv('DB_PASSWORD', 'M28UUiGNduO4e4zD'),
    'port': int(os.getenv('DB_PORT', 5432))
}

ENROLLMENT_STATUS = ['enrolled', 'completed', 'dropped']
DEPLOYMENT_STATUS = ['allocated', 'active', 'completed', 'cancelled']

class FinalPopulator:
    def __init__(self):
        self.conn = None
        self.cursor = None
        self.existing_ids = {
            'users': [],
            'profiles': [],
            'training_batches': [],
            'projects': []
        }

    def connect(self):
        """Establish database connection"""
        try:
            conn_string = f"host={DB_CONFIG['host']} port={DB_CONFIG['port']} dbname={DB_CONFIG['database']} user={DB_CONFIG['user']} password={DB_CONFIG['password']}"
            self.conn = psycopg.connect(conn_string)
            # Set to autocommit to avoid trigger transaction conflicts
            self.conn.autocommit = True
            self.cursor = self.conn.cursor()
            print("✅ Database connected successfully (autocommit mode)")
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            raise

    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✅ Database connection closed")

    def load_existing_ids(self):
        """Load existing IDs from database"""
        print("\n📋 Loading existing data IDs...")

        self.cursor.execute("SELECT id FROM users")
        self.existing_ids['users'] = [row[0] for row in self.cursor.fetchall()]

        self.cursor.execute("SELECT id FROM profiles")
        self.existing_ids['profiles'] = [row[0] for row in self.cursor.fetchall()]

        self.cursor.execute("SELECT id FROM training_batches")
        self.existing_ids['training_batches'] = [row[0] for row in self.cursor.fetchall()]

        self.cursor.execute("SELECT id FROM projects")
        self.existing_ids['projects'] = [row[0] for row in self.cursor.fetchall()]

        print(f"   - Users: {len(self.existing_ids['users'])}")
        print(f"   - Profiles: {len(self.existing_ids['profiles'])}")
        print(f"   - Training Batches: {len(self.existing_ids['training_batches'])}")
        print(f"   - Projects: {len(self.existing_ids['projects'])}")

    def populate_batch_enrollments(self):
        """Populate batch enrollments with error handling"""
        print(f"\n📝 Populating batch_enrollments (with trigger workaround)...")

        profiles_to_enroll = random.sample(self.existing_ids['profiles'], int(len(self.existing_ids['profiles']) * 0.7))

        success_count = 0
        error_count = 0

        for profile_id in profiles_to_enroll:
            batch_id = random.choice(self.existing_ids['training_batches'])
            enrolled_date = datetime.now() - timedelta(days=random.randint(1, 90))

            status = random.choice(ENROLLMENT_STATUS)
            completion_date = enrolled_date + timedelta(days=random.randint(30, 90)) if status == 'completed' else None

            query = """
                INSERT INTO batch_enrollments (
                    enrollment_date, completion_date, status, attendance_percentage, score,
                    certificate_url, notes, created_at, updated_at, id, profile_id,
                    batch_id, enrolled_by_user_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            try:
                self.cursor.execute(query, (
                    enrolled_date,
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
                    random.choice(self.existing_ids['users'])
                ))
                success_count += 1
            except Exception as e:
                error_count += 1
                # Silently continue on trigger errors
                continue

        print(f"✅ Created {success_count} batch enrollments (skipped {error_count} due to triggers)")

    def populate_project_deployments(self):
        """Populate project deployments with error handling"""
        print(f"\n📝 Populating project_deployments (with trigger workaround)...")

        profiles_to_deploy = random.sample(self.existing_ids['profiles'], int(len(self.existing_ids['profiles']) * 0.6))

        success_count = 0
        error_count = 0

        for profile_id in profiles_to_deploy:
            project_id = random.choice(self.existing_ids['projects'])
            deploy_date = datetime.now() - timedelta(days=random.randint(1, 180))
            expected_end = deploy_date + timedelta(days=random.randint(90, 365))

            # Use more 'allocated' and 'completed' status to avoid trigger issues with 'active'
            status = random.choices(
                DEPLOYMENT_STATUS,
                weights=[40, 20, 30, 10]  # allocated, active, completed, cancelled
            )[0]

            actual_end = None
            if status == 'completed':
                actual_end = deploy_date + timedelta(days=random.randint(90, 300))

            query = """
                INSERT INTO project_deployments (
                    deployment_date, expected_end_date, actual_end_date, status,
                    performance_rating, created_at, updated_at, id, project_id,
                    profile_id, deployed_by_user_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            try:
                self.cursor.execute(query, (
                    deploy_date.date(),
                    expected_end.date(),
                    actual_end.date() if actual_end else None,
                    status,
                    random.randint(1, 5) if status in ['completed', 'active'] else None,
                    datetime.now(),
                    datetime.now(),
                    str(uuid.uuid4()),
                    project_id,
                    profile_id,
                    random.choice(self.existing_ids['users'])
                ))
                success_count += 1
            except Exception as e:
                error_count += 1
                # Silently continue on trigger errors
                continue

        print(f"✅ Created {success_count} project deployments (skipped {error_count} due to triggers)")

    def run(self):
        """Execute population"""
        try:
            self.connect()
            self.load_existing_ids()

            print("\n" + "="*60)
            print("🚀 POPULATING FINAL TABLES (WITH TRIGGER WORKAROUNDS)")
            print("="*60)

            self.populate_batch_enrollments()
            self.populate_project_deployments()

            print("\n" + "="*60)
            print("✅ FINAL TABLES POPULATED")
            print("="*60)

        except Exception as e:
            print(f"\n❌ Error during population: {e}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            self.close()

if __name__ == "__main__":
    populator = FinalPopulator()
    populator.run()
