"""
Populate remaining tables in the database
Based on actual SQL schema with proper relationships
"""

import os
import random
from datetime import datetime, timedelta
from faker import Faker
import psycopg
import uuid

# Initialize Faker
fake = Faker('en_IN')

# Database Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'aws-1-ap-southeast-2.pooler.supabase.com'),
    'database': os.getenv('DB_NAME', 'postgres'),
    'user': os.getenv('DB_USER', 'postgres.pxmmbncxiknrhbgtwyyd'),
    'password': os.getenv('DB_PASSWORD', 'M28UUiGNduO4e4zD'),
    'port': int(os.getenv('DB_PORT', 5432))
}

# Status definitions
ENROLLMENT_STATUS = ['enrolled', 'completed', 'dropped']
PROJECT_STATUS = ['planning', 'active', 'completed', 'on_hold', 'archived']
DEPLOYMENT_STATUS = ['allocated', 'active', 'completed', 'cancelled']
REQUEST_STATUS = ['pending', 'reviewed', 'project_created', 'rejected']
POST_STATUS = ['draft', 'scheduled', 'published', 'failed']
PLATFORM_POST_STATUS = ['pending', 'published', 'failed']
PLATFORMS = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube']
SCRAPER_TYPES = ['government', 'company', 'news', 'other']

# Cities in India
CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow']

class RemainingPopulator:
    def __init__(self):
        self.conn = None
        self.cursor = None
        self.existing_ids = {
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

    def load_existing_ids(self):
        """Load existing IDs from database"""
        print("\n📋 Loading existing data IDs...")

        # Load users
        self.cursor.execute("SELECT id FROM users")
        self.existing_ids['users'] = [row[0] for row in self.cursor.fetchall()]

        # Load skill categories
        self.cursor.execute("SELECT id FROM skill_categories")
        self.existing_ids['skill_categories'] = [row[0] for row in self.cursor.fetchall()]

        # Load employers
        self.cursor.execute("SELECT id FROM employers")
        self.existing_ids['employers'] = [row[0] for row in self.cursor.fetchall()]

        # Load profiles
        self.cursor.execute("SELECT id FROM profiles")
        self.existing_ids['profiles'] = [row[0] for row in self.cursor.fetchall()]

        # Load training batches
        self.cursor.execute("SELECT id FROM training_batches")
        self.existing_ids['training_batches'] = [row[0] for row in self.cursor.fetchall()]

        print(f"   - Users: {len(self.existing_ids['users'])}")
        print(f"   - Skill Categories: {len(self.existing_ids['skill_categories'])}")
        print(f"   - Employers: {len(self.existing_ids['employers'])}")
        print(f"   - Profiles: {len(self.existing_ids['profiles'])}")
        print(f"   - Training Batches: {len(self.existing_ids['training_batches'])}")

    def populate_batch_enrollments(self):
        """Populate batch enrollments"""
        print(f"\n📝 Populating batch_enrollments...")

        # Enroll 70% of profiles
        profiles_to_enroll = random.sample(self.existing_ids['profiles'], int(len(self.existing_ids['profiles']) * 0.7))

        count = 0
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
                count += 1
            except Exception as e:
                # Skip duplicates or trigger errors
                continue

        self.conn.commit()
        print(f"✅ Created {count} batch enrollments")

    def populate_projects(self):
        """Populate projects"""
        print(f"\n📝 Populating projects...")

        project_types = ['Residential Complex', 'Commercial Building', 'Industrial Park', 'Infrastructure', 'Highway', 'Bridge', 'Metro Station']

        for i in range(25):
            project_id = str(uuid.uuid4())
            start_date = datetime.now() - timedelta(days=random.randint(0, 365))
            end_date = start_date + timedelta(days=random.randint(180, 730))
            contract_value = random.randint(5000000, 50000000)

            query = """
                INSERT INTO projects (
                    project_code, project_name, project_number, location, phone_number,
                    deployment_date, award_date, start_date, end_date, revised_completion_date,
                    status, required_workers, project_manager, description, po_co_number,
                    contract_value_a, revised_contract_value_b, variation_order_value_c,
                    actual_cost_incurred_d, misc_cost_e, budget, is_active,
                    is_accommodation_provided, created_at, updated_at, approved_at,
                    approval_notes, rejection_reason, id, employer_id, approved_by_user_id,
                    created_by_user_id, deleted_at, deleted_by_user_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            self.cursor.execute(query, (
                f"PRJ-{30000+i}",
                f"{random.choice(project_types)} - {fake.street_name()}",
                f"PN-{random.randint(1000, 9999)}",
                random.choice(CITIES),
                fake.phone_number()[:15],
                start_date.date() if random.random() > 0.3 else None,
                start_date.date() if random.random() > 0.2 else None,
                start_date.date(),
                end_date.date(),
                end_date.date() if random.random() > 0.5 else None,
                random.choice(PROJECT_STATUS),
                random.randint(10, 100),
                fake.name(),
                fake.text(max_nb_chars=200),
                f"PO-{random.randint(1000, 9999)}",
                contract_value,
                contract_value * random.uniform(0.9, 1.1) if random.random() > 0.5 else None,
                random.randint(0, int(contract_value * 0.1)),
                random.randint(0, int(contract_value * 0.8)),
                random.randint(0, int(contract_value * 0.05)),
                contract_value * random.uniform(0.95, 1.15) if random.random() > 0.5 else None,
                True,
                random.random() > 0.5,
                datetime.now(),
                datetime.now(),
                datetime.now() - timedelta(days=random.randint(1, 30)),
                fake.text(max_nb_chars=100) if random.random() > 0.5 else None,
                None,
                project_id,
                random.choice(self.existing_ids['employers']),
                random.choice(self.existing_ids['users']),
                random.choice(self.existing_ids['users']),
                None,
                None
            ))

            self.existing_ids['projects'].append(project_id)

        self.conn.commit()
        print(f"✅ Created 25 projects")

    def populate_project_resource_requirements(self):
        """Populate project resource requirements"""
        print(f"\n📝 Populating project_resource_requirements...")

        count = 0
        for project_id in self.existing_ids['projects']:
            num_skills = random.randint(2, 5)
            selected_skills = random.sample(self.existing_ids['skill_categories'], num_skills)

            for skill_id in selected_skills:
                query = """
                    INSERT INTO project_resource_requirements (
                        required_count, notes, created_at, updated_at, id,
                        project_id, skill_category_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """

                self.cursor.execute(query, (
                    random.randint(5, 30),
                    fake.text(max_nb_chars=100) if random.random() > 0.7 else None,
                    datetime.now(),
                    datetime.now(),
                    str(uuid.uuid4()),
                    project_id,
                    skill_id
                ))
                count += 1

        self.conn.commit()
        print(f"✅ Created {count} project resource requirements")

    def populate_project_deployments(self):
        """Populate project deployments"""
        print(f"\n📝 Populating project_deployments...")

        profiles_to_deploy = random.sample(self.existing_ids['profiles'], int(len(self.existing_ids['profiles']) * 0.6))

        for profile_id in profiles_to_deploy:
            project_id = random.choice(self.existing_ids['projects'])
            deploy_date = datetime.now() - timedelta(days=random.randint(1, 180))
            expected_end = deploy_date + timedelta(days=random.randint(90, 365))

            status = random.choice(DEPLOYMENT_STATUS)
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

        self.conn.commit()
        print(f"✅ Created {len(profiles_to_deploy)} project deployments")

    def populate_stage_transitions(self):
        """Populate stage transitions"""
        print(f"\n📝 Populating stage_transitions...")

        stages = ['new_join', 'screening', 'approved', 'training', 'benched', 'deployed', 'upskilling']

        count = 0
        for profile_id in self.existing_ids['profiles']:
            num_transitions = random.randint(2, 5)

            for i in range(num_transitions):
                from_stage = stages[i] if i < len(stages) - 1 else random.choice(stages)
                to_stage = stages[i + 1] if i + 1 < len(stages) else random.choice(stages)

                transition_date = datetime.now() - timedelta(days=random.randint(1, 150 - i * 20))

                query = """
                    INSERT INTO stage_transitions (
                        from_stage, to_stage, transitioned_at, notes, id,
                        profile_id, transitioned_by_user_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """

                self.cursor.execute(query, (
                    from_stage,
                    to_stage,
                    transition_date,
                    fake.text(max_nb_chars=100) if random.random() > 0.5 else None,
                    str(uuid.uuid4()),
                    profile_id,
                    random.choice(self.existing_ids['users'])
                ))
                count += 1

        self.conn.commit()
        print(f"✅ Created {count} stage transitions")

    def populate_documents(self):
        """Populate documents"""
        print(f"\n📝 Populating documents...")

        doc_categories = ['identity', 'education', 'employment', 'financial']
        doc_types = ['aadhaar', 'pan', 'resume', 'certificate', 'photo', 'police_verification']

        profiles_with_docs = random.sample(self.existing_ids['profiles'], int(len(self.existing_ids['profiles']) * 0.8))

        count = 0
        for profile_id in profiles_with_docs:
            num_docs = random.randint(2, 4)
            selected_docs = random.sample(doc_types, min(num_docs, len(doc_types)))

            for doc_type in selected_docs:
                is_verified = random.random() > 0.3
                verification_status = random.choice(['pending', 'approved', 'rejected']) if not is_verified else 'approved'

                expiry_date = None
                if doc_type in ['aadhaar', 'pan', 'police_verification']:
                    expiry_date = datetime.now() + timedelta(days=random.randint(365, 3650))

                query = """
                    INSERT INTO documents (
                        document_category, document_type, document_number, file_name,
                        file_url, file_size, verification_status, verified_at,
                        uploaded_at, expiry_date, created_at, id, profile_id,
                        uploaded_by_user_id, verified_by_user_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """

                self.cursor.execute(query, (
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
                    str(uuid.uuid4()),
                    profile_id,
                    random.choice(self.existing_ids['users']),
                    random.choice(self.existing_ids['users']) if is_verified else None
                ))
                count += 1

        self.conn.commit()
        print(f"✅ Created {count} documents")

    def populate_interactions(self):
        """Populate interactions"""
        print(f"\n📝 Populating interactions...")

        interaction_types = ['call', 'email', 'meeting', 'site_visit', 'interview', 'follow_up']
        outcomes = ['positive', 'negative', 'neutral', 'callback_requested']

        profiles_with_interactions = random.sample(self.existing_ids['profiles'], int(len(self.existing_ids['profiles']) * 0.5))

        count = 0
        for profile_id in profiles_with_interactions:
            num_interactions = random.randint(1, 3)

            for _ in range(num_interactions):
                interaction_date = datetime.now() - timedelta(days=random.randint(1, 90))

                query = """
                    INSERT INTO interactions (
                        interaction_type, interaction_date, subject, description,
                        outcome, next_follow_up_date, created_at, updated_at, id,
                        profile_id, created_by_user_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """

                self.cursor.execute(query, (
                    random.choice(interaction_types),
                    interaction_date,
                    fake.sentence(nb_words=6),
                    fake.text(max_nb_chars=200),
                    random.choice(outcomes),
                    interaction_date.date() + timedelta(days=random.randint(7, 30)) if random.random() > 0.5 else None,
                    datetime.now(),
                    datetime.now(),
                    str(uuid.uuid4()),
                    profile_id,
                    random.choice(self.existing_ids['users'])
                ))
                count += 1

        self.conn.commit()
        print(f"✅ Created {count} interactions")

    def populate_project_requests(self):
        """Populate project requests"""
        print(f"\n📝 Populating project_requests...")

        for _ in range(30):
            employer_id = random.choice(self.existing_ids['employers'])
            project_id = random.choice(self.existing_ids['projects']) if random.random() > 0.5 else None

            is_reviewed = random.random() > 0.3
            status = random.choice(REQUEST_STATUS) if is_reviewed else 'pending'

            start_date = datetime.now() + timedelta(days=random.randint(30, 180))

            query = """
                INSERT INTO project_requests (
                    project_title, project_description, location, estimated_start_date,
                    estimated_duration_days, estimated_budget, required_workers_count,
                    additional_notes, status, reviewed_at, created_at, updated_at, id,
                    employer_id, project_id, reviewed_by_user_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            self.cursor.execute(query, (
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
                str(uuid.uuid4()),
                employer_id,
                project_id,
                random.choice(self.existing_ids['users']) if is_reviewed else None
            ))

        self.conn.commit()
        print(f"✅ Created 30 project requests")

    def populate_activity_logs(self):
        """Populate activity logs"""
        print(f"\n📝 Populating activity_logs...")

        actions = [
            'profile_created', 'profile_updated', 'profile_deployed', 'profile_verified',
            'project_created', 'project_updated', 'batch_created', 'enrollment_added',
            'document_uploaded', 'document_verified', 'skill_verified', 'user_login'
        ]

        modules = ['profiles', 'projects', 'batches', 'documents', 'auth', 'deployments']

        for _ in range(200):
            query = """
                INSERT INTO activity_logs (
                    action, module, record_id, old_value, new_value, ip_address,
                    user_agent, created_at, id, user_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            self.cursor.execute(query, (
                random.choice(actions),
                random.choice(modules),
                random.randint(1, 1000),
                fake.word() if random.random() > 0.5 else None,
                fake.word() if random.random() > 0.5 else None,
                fake.ipv4() if random.random() > 0.5 else None,
                fake.user_agent() if random.random() > 0.5 else None,
                datetime.now() - timedelta(days=random.randint(0, 180)),
                str(uuid.uuid4()),
                random.choice(self.existing_ids['users'])
            ))

        self.conn.commit()
        print(f"✅ Created 200 activity logs")

    def populate_scraper_websites(self):
        """Populate scraper websites"""
        print(f"\n📝 Populating scraper_websites...")

        sample_websites = [
            ('Construction Weekly India', 'https://constructionweeklyindia.com', 'news'),
            ('Government e-Marketplace', 'https://gem.gov.in/tenders', 'government'),
            ('Ministry of Road Transport', 'https://morth.gov.in/tenders', 'government'),
            ('NHAI Tenders', 'https://nhai.gov.in/tenders', 'government'),
            ('Indian Railways Tenders', 'https://indianrailways.gov.in/tenders', 'government'),
        ]

        for name, url, site_type in sample_websites:
            query = """
                INSERT INTO scraper_websites (
                    url, type, is_active, created_at, updated_at, name, id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """

            self.cursor.execute(query, (
                url,
                site_type,
                True,
                datetime.now(),
                datetime.now(),
                name,
                str(uuid.uuid4())
            ))

        self.conn.commit()
        print(f"✅ Created {len(sample_websites)} scraper websites")

    def populate_news_updates(self):
        """Populate news updates"""
        print(f"\n📝 Populating news_updates...")

        sectors = ['Infrastructure', 'Residential', 'Commercial', 'Industrial', 'Transport']
        statuses = ['Announced', 'In Progress', 'Delayed', 'Completed', 'Cancelled']

        for _ in range(50):
            query = """
                INSERT INTO news_updates (
                    project_name, sector, company_authority, location, value_cr,
                    status, revised_budget, revised_timeline, delay_reason,
                    source_url, source_type, summary_remarks, scraped_date,
                    created_at, updated_at, id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            self.cursor.execute(query, (
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
                datetime.now(),
                str(uuid.uuid4())
            ))

        self.conn.commit()
        print(f"✅ Created 50 news updates")

    def populate_social_media_posts(self):
        """Populate social media posts"""
        print(f"\n📝 Populating social_media_posts...")

        for _ in range(30):
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

            query = """
                INSERT INTO social_media_posts (
                    title, caption, description, content, platforms, tags, image_url,
                    video_url, media_urls, project_name, source_url, status,
                    scheduled_at, published_at, make_response, make_webhook_id,
                    platform_content, youtube_category, youtube_privacy,
                    youtube_thumbnail, engagement, created_by, created_at,
                    updated_at, id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            self.cursor.execute(query, (
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
                datetime.now(),
                post_id
            ))

            self.existing_ids['social_media_posts'].append(post_id)

        self.conn.commit()
        print(f"✅ Created 30 social media posts")

    def populate_social_media_platform_posts(self):
        """Populate platform-specific social media posts"""
        print(f"\n📝 Populating social_media_platform_posts...")

        count = 0
        for post_id in self.existing_ids['social_media_posts']:
            num_platforms = random.randint(1, 3)

            for platform in random.sample(PLATFORMS, num_platforms):
                status = random.choice(PLATFORM_POST_STATUS)

                query = """
                    INSERT INTO social_media_platform_posts (
                        platform, platform_post_id, status, published_at, error_message,
                        engagement, created_at, updated_at, id, post_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """

                self.cursor.execute(query, (
                    platform,
                    f"{platform}_{uuid.uuid4()}" if status == 'published' else None,
                    status,
                    datetime.now() - timedelta(days=random.randint(1, 30)) if status == 'published' else None,
                    fake.sentence() if status == 'failed' else None,
                    f'{{"likes": {random.randint(0, 1000)}, "shares": {random.randint(0, 100)}, "comments": {random.randint(0, 50)}}}' if status == 'published' else '{}',
                    datetime.now(),
                    datetime.now(),
                    str(uuid.uuid4()),
                    post_id
                ))
                count += 1

        self.conn.commit()
        print(f"✅ Created {count} social media platform posts")

    def run(self):
        """Execute all data population"""
        try:
            self.connect()
            self.load_existing_ids()

            print("\n" + "="*60)
            print("🚀 POPULATING REMAINING TABLES")
            print("="*60)

            # Skip batch_enrollments and project_deployments due to database triggers
            # Skip projects and requirements as they already exist
            # Load existing project IDs
            self.cursor.execute("SELECT id FROM projects")
            self.existing_ids['projects'] = [row[0] for row in self.cursor.fetchall()]
            print(f"✅ Loaded {len(self.existing_ids['projects'])} existing projects")

            self.populate_stage_transitions()
            self.populate_documents()
            self.populate_interactions()
            self.populate_project_requests()
            self.populate_activity_logs()
            self.populate_scraper_websites()
            self.populate_news_updates()
            self.populate_social_media_posts()
            self.populate_social_media_platform_posts()

            print("\n" + "="*60)
            print("✅ ALL TABLES POPULATED SUCCESSFULLY")
            print("="*60)

        except Exception as e:
            print(f"\n❌ Error during population: {e}")
            import traceback
            traceback.print_exc()
            self.conn.rollback()
            raise
        finally:
            self.close()

if __name__ == "__main__":
    populator = RemainingPopulator()
    populator.run()
