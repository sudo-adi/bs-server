--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Homebrew)
-- Dumped by pg_dump version 16.8 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: sync_profile_deployment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_profile_deployment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        -- When deployment is created or updated to active status
        IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'active' THEN
          UPDATE profiles SET
            current_project_name = (SELECT project_name FROM projects WHERE id = NEW.project_id),
            current_deployment_start_date = NEW.deployment_date,
            current_deployment_end_date = NEW.expected_end_date,
            current_stage = 'deployed',
            stage_updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.profile_id;
        END IF;

        -- When deployment is completed or deleted
        IF (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active') OR TG_OP = 'DELETE' THEN
          UPDATE profiles SET
            current_project_name = NULL,
            current_deployment_start_date = NULL,
            current_deployment_end_date = NULL,
            current_stage = 'benched',
            stage_updated_at = CURRENT_TIMESTAMP
          WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);
        END IF;

        RETURN COALESCE(NEW, OLD);
      END;
      $$;


--
-- Name: update_batch_enrolled_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_batch_enrolled_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      DECLARE
        affected_batch_id INTEGER;
      BEGIN
        -- Determine which batch to update
        affected_batch_id := COALESCE(NEW.batch_id, OLD.batch_id);

        -- Update the count of enrolled students (not withdrawn)
        UPDATE training_batches SET
          current_enrolled = (
            SELECT COUNT(*)
            FROM batch_enrollments
            WHERE batch_id = affected_batch_id
              AND status != 'withdrawn'
          )
        WHERE id = affected_batch_id;

        RETURN COALESCE(NEW, OLD);
      END;
      $$;


--
-- Name: update_employer_project_requirements_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_employer_project_requirements_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


--
-- Name: update_news_updates_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_news_updates_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_profile_stage_on_completion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_stage_on_completion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Update profile to 'trained' stage
    UPDATE profiles SET
      current_stage = 'trained',
      stage_updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.profile_id
      AND current_stage = 'trainee';
    
    -- Log the stage transition
    INSERT INTO stage_transitions (profile_id, from_stage, to_stage, transitioned_by_user_id, notes)
    SELECT 
      NEW.profile_id,
      'trainee',
      'trained',
      NEW.enrolled_by_user_id,
      'Auto-transitioned on training completion'
    FROM profiles p
    WHERE p.id = NEW.profile_id
      AND p.current_stage = 'trained'; -- Only log if update succeeded
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_profile_stage_on_enrollment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_stage_on_enrollment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'enrolled' THEN
    -- Update profile to 'trainee' stage if in early stages
    UPDATE profiles SET
      current_stage = 'trainee',
      stage_updated_at = CURRENT_TIMESTAMP,
      stage_updated_by_user_id = NEW.enrolled_by_user_id
    WHERE id = NEW.profile_id
      AND current_stage IN ('new registration', 'approved', 'new', 'screening', 'interview');
    
    -- Log the stage transition
    INSERT INTO stage_transitions (profile_id, from_stage, to_stage, transitioned_by_user_id, notes)
    SELECT 
      NEW.profile_id,
      p.current_stage,
      'trainee',
      NEW.enrolled_by_user_id,
      'Auto-transitioned on batch enrollment'
    FROM profiles p
    WHERE p.id = NEW.profile_id
      AND p.current_stage = 'trainee'; -- Only log if update succeeded
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_project_skill_requirements_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_project_skill_requirements_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


--
-- Name: update_project_worker_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_project_worker_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      DECLARE
        affected_project_id INTEGER;
      BEGIN
        -- Determine which project to update
        affected_project_id := COALESCE(NEW.project_id, OLD.project_id);

        -- Update the count of active workers
        UPDATE projects SET
          current_workers = (
            SELECT COUNT(*)
            FROM project_deployments
            WHERE project_id = affected_project_id
              AND status = 'active'
          )
        WHERE id = affected_project_id;

        RETURN COALESCE(NEW, OLD);
      END;
      $$;


--
-- Name: update_scraper_websites_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_scraper_websites_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    module character varying(100) NOT NULL,
    record_id integer,
    old_value text,
    new_value text,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id integer NOT NULL,
    profile_id integer,
    address_type character varying(50) DEFAULT 'permanent'::character varying,
    house_number character varying(100),
    village_or_city character varying(255),
    district character varying(255),
    state character varying(255),
    postal_code character varying(10),
    landmark character varying(255),
    police_station character varying(255),
    post_office character varying(255),
    is_current boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;


--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_accounts (
    id integer NOT NULL,
    profile_id integer,
    account_holder_name character varying(255) NOT NULL,
    account_number character varying(50) NOT NULL,
    ifsc_code character varying(20) NOT NULL,
    bank_name character varying(255),
    branch_name character varying(255),
    account_type character varying(50) DEFAULT 'savings'::character varying,
    is_primary boolean DEFAULT false,
    is_verified boolean DEFAULT false,
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    verified_by_user_id integer,
    verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: bank_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bank_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bank_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bank_accounts_id_seq OWNED BY public.bank_accounts.id;


--
-- Name: batch_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batch_enrollments (
    id integer NOT NULL,
    batch_id integer,
    profile_id integer,
    enrollment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completion_date date,
    status character varying(50) DEFAULT 'enrolled'::character varying,
    attendance_percentage numeric(5,2),
    score numeric(5,2),
    certificate_url character varying(500),
    notes text,
    enrolled_by_user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: batch_enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.batch_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: batch_enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.batch_enrollments_id_seq OWNED BY public.batch_enrollments.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    profile_id integer,
    document_category character varying(100),
    document_type character varying(100),
    document_number character varying(100),
    file_name character varying(255) NOT NULL,
    file_url character varying(500) NOT NULL,
    file_size integer,
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    verified_by_user_id integer,
    verified_at timestamp without time zone,
    uploaded_by_user_id integer,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expiry_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: employer_project_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employer_project_requirements (
    id integer NOT NULL,
    employer_id integer NOT NULL,
    project_title character varying(255) NOT NULL,
    project_description text,
    location character varying(255),
    estimated_start_date date,
    estimated_duration_days integer,
    estimated_budget numeric(15,2),
    required_workers_count integer,
    additional_notes text,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by_user_id integer,
    reviewed_at timestamp without time zone,
    project_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT employer_project_requirements_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'project_created'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: TABLE employer_project_requirements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.employer_project_requirements IS 'Stores initial project requirements from employer signup before project creation';


--
-- Name: employer_project_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employer_project_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employer_project_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employer_project_requirements_id_seq OWNED BY public.employer_project_requirements.id;


--
-- Name: employers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employers (
    id integer NOT NULL,
    employer_code character varying(50) NOT NULL,
    company_name character varying(255) NOT NULL,
    client_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone_number character varying(20) NOT NULL,
    alternative_phone character varying(20),
    registered_address text,
    company_registration_number character varying(100),
    gst_number character varying(20),
    authorized_person_name character varying(255),
    authorized_person_designation character varying(100),
    authorized_person_email character varying(255),
    authorized_person_contact character varying(20),
    authorized_person_address text,
    is_approved boolean DEFAULT false,
    approved_by_user_id integer,
    approved_at timestamp without time zone,
    approval_notes text,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    verified_at timestamp without time zone,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: employers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employers_id_seq OWNED BY public.employers.id;


--
-- Name: interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactions (
    id integer NOT NULL,
    profile_id integer,
    interaction_type character varying(100),
    interaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    subject character varying(255),
    description text,
    outcome character varying(100),
    next_follow_up_date date,
    created_by_user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.interactions_id_seq OWNED BY public.interactions.id;


--
-- Name: news_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_updates (
    id integer NOT NULL,
    project_name character varying(500) NOT NULL,
    sector character varying(200) DEFAULT 'N/A'::character varying NOT NULL,
    company_authority character varying(300),
    location character varying(300),
    value_cr numeric(15,2) DEFAULT 0 NOT NULL,
    status character varying(100),
    revised_budget numeric(15,2),
    revised_timeline character varying(200),
    delay_reason text,
    source_url character varying(1000) NOT NULL,
    source_type character varying(100),
    summary_remarks text DEFAULT 'N/A'::text NOT NULL,
    scraped_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT news_updates_value_cr_check CHECK ((value_cr >= (0)::numeric))
);


--
-- Name: TABLE news_updates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.news_updates IS 'Stores infrastructure news updates scraped daily from various sources';


--
-- Name: COLUMN news_updates.project_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.project_name IS 'Name of the infrastructure project';


--
-- Name: COLUMN news_updates.sector; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.sector IS 'Sector category (Roads, Railways, Power, etc.)';


--
-- Name: COLUMN news_updates.company_authority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.company_authority IS 'Company or government authority handling the project';


--
-- Name: COLUMN news_updates.location; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.location IS 'Project location (City, State, etc.)';


--
-- Name: COLUMN news_updates.value_cr; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.value_cr IS 'Project value in crores (minimum 1000 crore)';


--
-- Name: COLUMN news_updates.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.status IS 'Project status (Approved, Under Construction, Delayed, etc.)';


--
-- Name: COLUMN news_updates.revised_budget; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.revised_budget IS 'Revised budget if applicable';


--
-- Name: COLUMN news_updates.revised_timeline; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.revised_timeline IS 'Revised timeline if applicable';


--
-- Name: COLUMN news_updates.delay_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.delay_reason IS 'Reason for project delay if applicable';


--
-- Name: COLUMN news_updates.source_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.source_url IS 'Original source URL of the news article (unique)';


--
-- Name: COLUMN news_updates.source_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.source_type IS 'Type of source (Government, News Media, Company)';


--
-- Name: COLUMN news_updates.summary_remarks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.summary_remarks IS 'Brief summary of the news update';


--
-- Name: COLUMN news_updates.scraped_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news_updates.scraped_date IS 'Date when the news was scraped';


--
-- Name: news_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_updates_id_seq OWNED BY public.news_updates.id;


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id integer NOT NULL,
    profile_id integer,
    note_category character varying(100),
    content text NOT NULL,
    is_pinned boolean DEFAULT false,
    is_important boolean DEFAULT false,
    created_by_user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;


--
-- Name: profile_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_skills (
    id integer NOT NULL,
    profile_id integer,
    skill_category_id integer,
    proficiency_level character varying(50) DEFAULT 'beginner'::character varying,
    years_of_experience integer DEFAULT 0,
    is_primary boolean DEFAULT false,
    verified_by_user_id integer,
    verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: profile_skills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profile_skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profile_skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profile_skills_id_seq OWNED BY public.profile_skills.id;


--
-- Name: profile_trainings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_trainings (
    id integer NOT NULL,
    profile_id integer,
    training_name character varying(255) NOT NULL,
    training_provider character varying(255),
    training_type character varying(100),
    is_mandatory boolean DEFAULT false,
    start_date date,
    completion_date date,
    status character varying(50) DEFAULT 'pending'::character varying,
    score numeric(5,2),
    certificate_url character varying(500),
    trainer_name character varying(255),
    duration_days integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: profile_trainings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profile_trainings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profile_trainings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profile_trainings_id_seq OWNED BY public.profile_trainings.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id integer NOT NULL,
    profile_code character varying(50) NOT NULL,
    mobile_number character varying(20) NOT NULL,
    alternative_whatsapp_number character varying(20),
    email character varying(255),
    first_name character varying(255) NOT NULL,
    middle_name character varying(255),
    last_name character varying(255),
    fathers_name character varying(255),
    aadhar_number character varying(12),
    gender character varying(20),
    date_of_birth date,
    current_stage character varying(50) DEFAULT 'new registration'::character varying,
    stage_updated_at timestamp without time zone,
    stage_updated_by_user_id integer,
    current_project_name character varying(255),
    current_deployment_start_date date,
    current_deployment_end_date date,
    is_active boolean DEFAULT true,
    is_employee boolean DEFAULT false,
    employee_code character varying(50),
    is_blacklisted boolean DEFAULT false,
    blacklist_reason text,
    blacklisted_at timestamp without time zone,
    blacklisted_by_user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    profile_photo_url character varying(500)
);


--
-- Name: profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profiles_id_seq OWNED BY public.profiles.id;


--
-- Name: project_deployments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_deployments (
    id integer NOT NULL,
    project_id integer,
    profile_id integer,
    deployment_date date NOT NULL,
    expected_end_date date,
    actual_end_date date,
    role character varying(100),
    daily_rate numeric(10,2),
    status character varying(50) DEFAULT 'active'::character varying,
    performance_rating integer,
    remarks text,
    deployed_by_user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: COLUMN project_deployments.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.project_deployments.status IS 'Worker deployment status: onboarded (assigned but not deployed) or deployed (actively working)';


--
-- Name: project_deployments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_deployments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_deployments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_deployments_id_seq OWNED BY public.project_deployments.id;


--
-- Name: project_skill_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_skill_requirements (
    id integer NOT NULL,
    project_id integer NOT NULL,
    skill_category_id integer NOT NULL,
    required_count integer DEFAULT 0 NOT NULL,
    allocated_count integer DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE project_skill_requirements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.project_skill_requirements IS 'Tracks required worker counts by skill category for each project';


--
-- Name: project_skill_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_skill_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_skill_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_skill_requirements_id_seq OWNED BY public.project_skill_requirements.id;


--
-- Name: project_worker_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_worker_requirements (
    id integer NOT NULL,
    project_id integer,
    worker_category character varying(100) NOT NULL,
    required_count integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: project_worker_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_worker_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_worker_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_worker_requirements_id_seq OWNED BY public.project_worker_requirements.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    project_code character varying(50) NOT NULL,
    project_name character varying(255) NOT NULL,
    project_number character varying(100),
    employer_id integer,
    location character varying(255),
    phone_number character varying(20),
    deployment_date date,
    award_date date,
    start_date date,
    end_date date,
    revised_completion_date date,
    status character varying(50) DEFAULT 'planning'::character varying,
    required_workers integer DEFAULT 0,
    current_workers integer DEFAULT 0,
    project_manager character varying(255),
    description text,
    po_co_number character varying(100),
    contract_value_a numeric(15,2),
    revised_contract_value_b numeric(15,2),
    variation_order_value_c numeric(15,2),
    actual_cost_incurred_d numeric(15,2),
    misc_cost_e numeric(15,2),
    total_expense_against_contract_f numeric(15,2),
    profit_loss_g numeric(15,2),
    budget numeric(15,2),
    is_active boolean DEFAULT true,
    is_accommodation_provided boolean DEFAULT false,
    created_by_user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approved_by_user_id integer,
    approved_at timestamp without time zone,
    approval_notes text,
    rejection_reason text,
    CONSTRAINT projects_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'preparing'::character varying, 'prepared'::character varying, 'deployed'::character varying, 'over'::character varying])::text[])))
);


--
-- Name: COLUMN projects.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.status IS 'Project operational status: preparing (onboarding workers), prepared (ready to deploy), deployed (active with employer), over (completed)';


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: qualifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qualifications (
    id integer NOT NULL,
    profile_id integer,
    qualification_type character varying(255),
    institution_name character varying(255),
    field_of_study character varying(255),
    year_of_completion integer,
    percentage_or_grade character varying(50),
    certificate_url character varying(500),
    verified_by_user_id integer,
    verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: qualifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.qualifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: qualifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.qualifications_id_seq OWNED BY public.qualifications.id;


--
-- Name: scraper_websites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scraper_websites (
    id integer NOT NULL,
    url character varying(1000) NOT NULL,
    type character varying(20) DEFAULT 'other'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(300),
    CONSTRAINT scraper_websites_type_check CHECK (((type)::text = ANY ((ARRAY['government'::character varying, 'company'::character varying, 'news'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: scraper_websites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scraper_websites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scraper_websites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scraper_websites_id_seq OWNED BY public.scraper_websites.id;


--
-- Name: skill_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: skill_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skill_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skill_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skill_categories_id_seq OWNED BY public.skill_categories.id;


--
-- Name: stage_transitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stage_transitions (
    id integer NOT NULL,
    profile_id integer,
    from_stage character varying(50),
    to_stage character varying(50) NOT NULL,
    transitioned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    transitioned_by_user_id integer,
    notes text
);


--
-- Name: stage_transitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stage_transitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stage_transitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stage_transitions_id_seq OWNED BY public.stage_transitions.id;


--
-- Name: training_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_batches (
    id integer NOT NULL,
    batch_code character varying(50) NOT NULL,
    batch_name character varying(255) NOT NULL,
    training_program_name character varying(255) NOT NULL,
    training_provider character varying(255),
    trainer_name character varying(255),
    start_date date,
    end_date date,
    duration_days integer,
    max_capacity integer,
    current_enrolled integer DEFAULT 0,
    status character varying(50) DEFAULT 'upcoming'::character varying,
    location character varying(255),
    description text,
    created_by_user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: training_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.training_batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: training_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.training_batches_id_seq OWNED BY public.training_batches.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255),
    phone_number character varying(20),
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


--
-- Name: bank_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts ALTER COLUMN id SET DEFAULT nextval('public.bank_accounts_id_seq'::regclass);


--
-- Name: batch_enrollments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_enrollments ALTER COLUMN id SET DEFAULT nextval('public.batch_enrollments_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: employer_project_requirements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employer_project_requirements ALTER COLUMN id SET DEFAULT nextval('public.employer_project_requirements_id_seq'::regclass);


--
-- Name: employers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employers ALTER COLUMN id SET DEFAULT nextval('public.employers_id_seq'::regclass);


--
-- Name: interactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions ALTER COLUMN id SET DEFAULT nextval('public.interactions_id_seq'::regclass);


--
-- Name: news_updates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_updates ALTER COLUMN id SET DEFAULT nextval('public.news_updates_id_seq'::regclass);


--
-- Name: notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);


--
-- Name: profile_skills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_skills ALTER COLUMN id SET DEFAULT nextval('public.profile_skills_id_seq'::regclass);


--
-- Name: profile_trainings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_trainings ALTER COLUMN id SET DEFAULT nextval('public.profile_trainings_id_seq'::regclass);


--
-- Name: profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles ALTER COLUMN id SET DEFAULT nextval('public.profiles_id_seq'::regclass);


--
-- Name: project_deployments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_deployments ALTER COLUMN id SET DEFAULT nextval('public.project_deployments_id_seq'::regclass);


--
-- Name: project_skill_requirements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_skill_requirements ALTER COLUMN id SET DEFAULT nextval('public.project_skill_requirements_id_seq'::regclass);


--
-- Name: project_worker_requirements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_worker_requirements ALTER COLUMN id SET DEFAULT nextval('public.project_worker_requirements_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: qualifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qualifications ALTER COLUMN id SET DEFAULT nextval('public.qualifications_id_seq'::regclass);


--
-- Name: scraper_websites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraper_websites ALTER COLUMN id SET DEFAULT nextval('public.scraper_websites_id_seq'::regclass);


--
-- Name: skill_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_categories ALTER COLUMN id SET DEFAULT nextval('public.skill_categories_id_seq'::regclass);


--
-- Name: stage_transitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stage_transitions ALTER COLUMN id SET DEFAULT nextval('public.stage_transitions_id_seq'::regclass);


--
-- Name: training_batches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_batches ALTER COLUMN id SET DEFAULT nextval('public.training_batches_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: batch_enrollments batch_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_enrollments
    ADD CONSTRAINT batch_enrollments_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: employer_project_requirements employer_project_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employer_project_requirements
    ADD CONSTRAINT employer_project_requirements_pkey PRIMARY KEY (id);


--
-- Name: employers employers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_email_key UNIQUE (email);


--
-- Name: employers employers_employer_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_employer_code_key UNIQUE (employer_code);


--
-- Name: employers employers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_pkey PRIMARY KEY (id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: news_updates news_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_updates
    ADD CONSTRAINT news_updates_pkey PRIMARY KEY (id);


--
-- Name: news_updates news_updates_source_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_updates
    ADD CONSTRAINT news_updates_source_url_key UNIQUE (source_url);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: profile_skills profile_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_skills
    ADD CONSTRAINT profile_skills_pkey PRIMARY KEY (id);


--
-- Name: profile_trainings profile_trainings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_trainings
    ADD CONSTRAINT profile_trainings_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_employee_code_key UNIQUE (employee_code);


--
-- Name: profiles profiles_mobile_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_mobile_number_key UNIQUE (mobile_number);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_profile_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_profile_code_key UNIQUE (profile_code);


--
-- Name: project_deployments project_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_deployments
    ADD CONSTRAINT project_deployments_pkey PRIMARY KEY (id);


--
-- Name: project_skill_requirements project_skill_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_skill_requirements
    ADD CONSTRAINT project_skill_requirements_pkey PRIMARY KEY (id);


--
-- Name: project_skill_requirements project_skill_requirements_project_id_skill_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_skill_requirements
    ADD CONSTRAINT project_skill_requirements_project_id_skill_category_id_key UNIQUE (project_id, skill_category_id);


--
-- Name: project_worker_requirements project_worker_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_worker_requirements
    ADD CONSTRAINT project_worker_requirements_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: projects projects_project_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_project_code_key UNIQUE (project_code);


--
-- Name: qualifications qualifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qualifications
    ADD CONSTRAINT qualifications_pkey PRIMARY KEY (id);


--
-- Name: scraper_websites scraper_websites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraper_websites
    ADD CONSTRAINT scraper_websites_pkey PRIMARY KEY (id);


--
-- Name: scraper_websites scraper_websites_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraper_websites
    ADD CONSTRAINT scraper_websites_url_key UNIQUE (url);


--
-- Name: skill_categories skill_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_name_key UNIQUE (name);


--
-- Name: skill_categories skill_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_pkey PRIMARY KEY (id);


--
-- Name: stage_transitions stage_transitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stage_transitions
    ADD CONSTRAINT stage_transitions_pkey PRIMARY KEY (id);


--
-- Name: training_batches training_batches_batch_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_batches
    ADD CONSTRAINT training_batches_batch_code_key UNIQUE (batch_code);


--
-- Name: training_batches training_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_batches
    ADD CONSTRAINT training_batches_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_employer_project_requirements_employer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employer_project_requirements_employer ON public.employer_project_requirements USING btree (employer_id);


--
-- Name: idx_employer_project_requirements_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employer_project_requirements_project ON public.employer_project_requirements USING btree (project_id);


--
-- Name: idx_employer_project_requirements_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employer_project_requirements_status ON public.employer_project_requirements USING btree (status);


--
-- Name: idx_news_updates_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_updates_created_at ON public.news_updates USING btree (created_at);


--
-- Name: idx_news_updates_scraped_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_updates_scraped_date ON public.news_updates USING btree (scraped_date);


--
-- Name: idx_news_updates_sector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_updates_sector ON public.news_updates USING btree (sector);


--
-- Name: idx_news_updates_source_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_updates_source_url ON public.news_updates USING btree (source_url);


--
-- Name: idx_news_updates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_updates_status ON public.news_updates USING btree (status);


--
-- Name: idx_news_updates_value_cr; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_updates_value_cr ON public.news_updates USING btree (value_cr);


--
-- Name: idx_project_deployments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_deployments_status ON public.project_deployments USING btree (status);


--
-- Name: idx_project_skill_requirements_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_skill_requirements_project ON public.project_skill_requirements USING btree (project_id);


--
-- Name: idx_project_skill_requirements_skill; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_skill_requirements_skill ON public.project_skill_requirements USING btree (skill_category_id);


--
-- Name: idx_scraper_websites_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraper_websites_is_active ON public.scraper_websites USING btree (is_active);


--
-- Name: idx_scraper_websites_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraper_websites_type ON public.scraper_websites USING btree (type);


--
-- Name: project_deployments sync_deployment_to_profile; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_deployment_to_profile AFTER INSERT OR DELETE OR UPDATE ON public.project_deployments FOR EACH ROW EXECUTE FUNCTION public.sync_profile_deployment();


--
-- Name: scraper_websites trigger_scraper_websites_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_scraper_websites_updated_at BEFORE UPDATE ON public.scraper_websites FOR EACH ROW EXECUTE FUNCTION public.update_scraper_websites_updated_at();


--
-- Name: employer_project_requirements trigger_update_employer_project_requirements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_employer_project_requirements_updated_at BEFORE UPDATE ON public.employer_project_requirements FOR EACH ROW EXECUTE FUNCTION public.update_employer_project_requirements_updated_at();


--
-- Name: news_updates trigger_update_news_updates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_news_updates_updated_at BEFORE UPDATE ON public.news_updates FOR EACH ROW EXECUTE FUNCTION public.update_news_updates_updated_at();


--
-- Name: project_skill_requirements trigger_update_project_skill_requirements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_project_skill_requirements_updated_at BEFORE UPDATE ON public.project_skill_requirements FOR EACH ROW EXECUTE FUNCTION public.update_project_skill_requirements_updated_at();


--
-- Name: batch_enrollments update_batch_enrollments; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_batch_enrollments AFTER INSERT OR DELETE OR UPDATE ON public.batch_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_batch_enrolled_count();


--
-- Name: project_deployments update_project_workers; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_project_workers AFTER INSERT OR DELETE OR UPDATE ON public.project_deployments FOR EACH ROW EXECUTE FUNCTION public.update_project_worker_count();


--
-- Name: batch_enrollments update_stage_on_completion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_stage_on_completion AFTER UPDATE ON public.batch_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_profile_stage_on_completion();


--
-- Name: batch_enrollments update_stage_on_enrollment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_stage_on_enrollment AFTER INSERT ON public.batch_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_profile_stage_on_enrollment();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: addresses addresses_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: bank_accounts bank_accounts_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: bank_accounts bank_accounts_verified_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_verified_by_user_id_fkey FOREIGN KEY (verified_by_user_id) REFERENCES public.users(id);


--
-- Name: batch_enrollments batch_enrollments_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_enrollments
    ADD CONSTRAINT batch_enrollments_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.training_batches(id) ON DELETE CASCADE;


--
-- Name: batch_enrollments batch_enrollments_enrolled_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_enrollments
    ADD CONSTRAINT batch_enrollments_enrolled_by_user_id_fkey FOREIGN KEY (enrolled_by_user_id) REFERENCES public.users(id);


--
-- Name: batch_enrollments batch_enrollments_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_enrollments
    ADD CONSTRAINT batch_enrollments_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: documents documents_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: documents documents_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id);


--
-- Name: documents documents_verified_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_verified_by_user_id_fkey FOREIGN KEY (verified_by_user_id) REFERENCES public.users(id);


--
-- Name: employer_project_requirements employer_project_requirements_employer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employer_project_requirements
    ADD CONSTRAINT employer_project_requirements_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES public.employers(id) ON DELETE CASCADE;


--
-- Name: employer_project_requirements employer_project_requirements_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employer_project_requirements
    ADD CONSTRAINT employer_project_requirements_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: employer_project_requirements employer_project_requirements_reviewed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employer_project_requirements
    ADD CONSTRAINT employer_project_requirements_reviewed_by_user_id_fkey FOREIGN KEY (reviewed_by_user_id) REFERENCES public.users(id);


--
-- Name: employers employers_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: interactions interactions_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: interactions interactions_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notes notes_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: notes notes_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profile_skills profile_skills_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_skills
    ADD CONSTRAINT profile_skills_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profile_skills profile_skills_skill_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_skills
    ADD CONSTRAINT profile_skills_skill_category_id_fkey FOREIGN KEY (skill_category_id) REFERENCES public.skill_categories(id) ON DELETE CASCADE;


--
-- Name: profile_skills profile_skills_verified_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_skills
    ADD CONSTRAINT profile_skills_verified_by_user_id_fkey FOREIGN KEY (verified_by_user_id) REFERENCES public.users(id);


--
-- Name: profiles profiles_blacklisted_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_blacklisted_by_user_id_fkey FOREIGN KEY (blacklisted_by_user_id) REFERENCES public.users(id);


--
-- Name: profiles profiles_stage_updated_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_stage_updated_by_user_id_fkey FOREIGN KEY (stage_updated_by_user_id) REFERENCES public.users(id);


--
-- Name: project_deployments project_deployments_deployed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_deployments
    ADD CONSTRAINT project_deployments_deployed_by_user_id_fkey FOREIGN KEY (deployed_by_user_id) REFERENCES public.users(id);


--
-- Name: project_deployments project_deployments_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_deployments
    ADD CONSTRAINT project_deployments_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: project_deployments project_deployments_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_deployments
    ADD CONSTRAINT project_deployments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_skill_requirements project_skill_requirements_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_skill_requirements
    ADD CONSTRAINT project_skill_requirements_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_skill_requirements project_skill_requirements_skill_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_skill_requirements
    ADD CONSTRAINT project_skill_requirements_skill_category_id_fkey FOREIGN KEY (skill_category_id) REFERENCES public.skill_categories(id) ON DELETE CASCADE;


--
-- Name: project_worker_requirements project_worker_requirements_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_worker_requirements
    ADD CONSTRAINT project_worker_requirements_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: projects projects_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: projects projects_employer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES public.employers(id) ON DELETE CASCADE;


--
-- Name: qualifications qualifications_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qualifications
    ADD CONSTRAINT qualifications_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: qualifications qualifications_verified_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qualifications
    ADD CONSTRAINT qualifications_verified_by_user_id_fkey FOREIGN KEY (verified_by_user_id) REFERENCES public.users(id);


--
-- Name: stage_transitions stage_transitions_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stage_transitions
    ADD CONSTRAINT stage_transitions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: stage_transitions stage_transitions_transitioned_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stage_transitions
    ADD CONSTRAINT stage_transitions_transitioned_by_user_id_fkey FOREIGN KEY (transitioned_by_user_id) REFERENCES public.users(id);


--
-- Name: training_batches training_batches_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_batches
    ADD CONSTRAINT training_batches_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

