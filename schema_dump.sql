--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  year_month TEXT;
  sequence_num INTEGER;
  invoice_num TEXT;
BEGIN
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 12) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_month || '-%';
  
  invoice_num := 'INV-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$$;


--
-- Name: get_current_usage(uuid, character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_usage(sub_id uuid, sub_type character varying, feature character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  current_usage INTEGER;
BEGIN
  SELECT COALESCE(usage_count, 0) INTO current_usage
  FROM subscription_usage
  WHERE subscription_id = sub_id
    AND subscription_type = sub_type
    AND feature_key = feature
    AND period_start <= NOW()
    AND period_end > NOW();
  
  RETURN COALESCE(current_usage, 0);
END;
$$;


--
-- Name: is_subscription_active(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_subscription_active(sub_id uuid, sub_type character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  sub_status VARCHAR;
  sub_end TIMESTAMP;
BEGIN
  IF sub_type = 'user' THEN
    SELECT status, current_period_end INTO sub_status, sub_end
    FROM user_subscriptions WHERE id = sub_id;
  ELSE
    SELECT status, current_period_end INTO sub_status, sub_end
    FROM company_subscriptions WHERE id = sub_id;
  END IF;
  
  RETURN sub_status = 'active' AND sub_end > NOW();
END;
$$;


--
-- Name: set_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_invoice_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_job_applications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_job_applications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_job_postings_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_job_postings_timestamp() RETURNS trigger
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
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id integer NOT NULL,
    user_id integer NOT NULL,
    activity_type character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activities_id_seq OWNED BY public.activities.id;


--
-- Name: ai_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_name character varying(50) NOT NULL,
    operation_type character varying(100) NOT NULL,
    user_id uuid,
    user_type character varying(20),
    request_type character varying(50),
    prompt_length integer,
    prompt_hash character varying(64),
    contains_pii boolean DEFAULT false,
    pii_redacted boolean DEFAULT false,
    response_length integer,
    response_status character varying(20),
    error_message text,
    latency_ms integer,
    tokens_used integer,
    cost_estimate numeric(10,6),
    data_categories text[],
    redacted_fields text[],
    ip_address character varying(45),
    user_agent text,
    session_id character varying(255),
    resume_id uuid,
    job_posting_id uuid,
    application_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE ai_audit_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_audit_logs IS 'Audit trail for all external AI service interactions';


--
-- Name: COLUMN ai_audit_logs.operation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_audit_logs.operation_type IS 'Type of operation: resume_parsing, ats_scoring, ats_improvement, job_description, job_search, ai_chat, section_improvement, resume_optimization';


--
-- Name: COLUMN ai_audit_logs.contains_pii; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_audit_logs.contains_pii IS 'Whether the request contained personally identifiable information';


--
-- Name: COLUMN ai_audit_logs.pii_redacted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_audit_logs.pii_redacted IS 'Whether PII was redacted before sending to AI service';


--
-- Name: COLUMN ai_audit_logs.data_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_audit_logs.data_categories IS 'Categories of data sent: skills, experience, education, projects, certifications, languages';


--
-- Name: COLUMN ai_audit_logs.redacted_fields; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_audit_logs.redacted_fields IS 'Fields that were redacted: email, phone, name, linkedin, github, website';


--
-- Name: ai_chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_chat_messages (
    id integer NOT NULL,
    session_id integer NOT NULL,
    user_id uuid NOT NULL,
    message_type text DEFAULT 'user'::text NOT NULL,
    content text NOT NULL,
    ai_type text,
    use_premium boolean DEFAULT false,
    processing_time_ms integer,
    context_data jsonb,
    memory_references jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ai_chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_chat_messages_id_seq OWNED BY public.ai_chat_messages.id;


--
-- Name: ai_chat_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_chat_sessions (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    user_type text DEFAULT 'user'::text NOT NULL,
    session_name text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


--
-- Name: ai_chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_chat_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_chat_sessions_id_seq OWNED BY public.ai_chat_sessions.id;


--
-- Name: ai_conversation_context; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_conversation_context (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    session_id integer,
    context_type text NOT NULL,
    context_key text NOT NULL,
    context_value jsonb NOT NULL,
    importance_score integer DEFAULT 50,
    usage_count integer DEFAULT 0,
    last_used timestamp without time zone,
    expires_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ai_conversation_context_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_conversation_context_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_conversation_context_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_conversation_context_id_seq OWNED BY public.ai_conversation_context.id;


--
-- Name: ai_resume_memory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_resume_memory (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    resume_id integer,
    resume_content text,
    resume_hash text,
    analysis_summary text,
    strengths jsonb,
    improvements jsonb,
    skills_extracted jsonb,
    experience_summary text,
    career_level text,
    overall_score integer,
    ats_score integer,
    completeness_score integer,
    industry_focus jsonb,
    role_targets jsonb,
    salary_range text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ai_resume_memory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_resume_memory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_resume_memory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_resume_memory_id_seq OWNED BY public.ai_resume_memory.id;


--
-- Name: ai_user_memory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_user_memory (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    career_stage text,
    primary_skills jsonb,
    industries jsonb,
    job_titles jsonb,
    locations jsonb,
    career_goals text,
    job_search_status text,
    salary_expectations text,
    work_preferences jsonb,
    common_questions jsonb,
    preferred_ai_style text,
    interaction_count integer DEFAULT 0,
    last_resume_analysis timestamp without time zone,
    last_job_search timestamp without time zone,
    last_career_advice timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ai_user_memory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_user_memory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_user_memory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_user_memory_id_seq OWNED BY public.ai_user_memory.id;


--
-- Name: certifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certifications (
    id uuid NOT NULL,
    resume_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    issuer character varying(255) NOT NULL,
    issue_date timestamp without time zone NOT NULL,
    expiry_date timestamp without time zone,
    credential_id character varying(255),
    credential_url character varying(255),
    order_index integer NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    website character varying(255),
    logo text,
    description text,
    industry character varying(100),
    size character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    slug character varying(255),
    founded_year integer,
    employee_count integer,
    company_type character varying(50),
    size_range character varying(50),
    work_environment character varying(50),
    company_values text,
    social_links jsonb,
    specialties jsonb,
    benefits jsonb,
    cover_image_url text,
    cover_image_position character varying(50) DEFAULT 'center'::character varying,
    clients jsonb DEFAULT '[]'::jsonb,
    projects jsonb DEFAULT '[]'::jsonb,
    awards jsonb DEFAULT '[]'::jsonb,
    achievements jsonb DEFAULT '[]'::jsonb,
    assets jsonb DEFAULT '[]'::jsonb,
    team_members jsonb DEFAULT '[]'::jsonb,
    culture_values jsonb DEFAULT '[]'::jsonb,
    testimonials jsonb DEFAULT '[]'::jsonb,
    location character varying(255),
    is_verified boolean DEFAULT false,
    logo_url text DEFAULT false,
    created_by integer
);


--
-- Name: TABLE companies; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.companies IS 'Normalized company data - single source of truth for all company information';


--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: company_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    billing_cycle character varying(20) DEFAULT 'monthly'::character varying,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    current_period_start timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    current_period_end timestamp without time zone NOT NULL,
    cancelled_at timestamp without time zone,
    expires_at timestamp without time zone,
    trial_ends_at timestamp without time zone,
    payment_method character varying(50),
    payment_id character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT company_subscriptions_billing_cycle_check CHECK (((billing_cycle)::text = ANY ((ARRAY['monthly'::character varying, 'yearly'::character varying, 'lifetime'::character varying])::text[]))),
    CONSTRAINT company_subscriptions_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'suspended'::character varying, 'trial'::character varying])::text[])))
);


--
-- Name: customization_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customization_settings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    settings jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: customization_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customization_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customization_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customization_settings_id_seq OWNED BY public.customization_settings.id;


--
-- Name: early_bird_waitlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.early_bird_waitlist (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    contact character varying(50),
    company_name character varying(255),
    company_size character varying(50),
    use_case text,
    interested_features text[],
    additional_info text,
    source character varying(100) DEFAULT 'landing_page'::character varying,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    notified_at timestamp without time zone
);


--
-- Name: TABLE early_bird_waitlist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.early_bird_waitlist IS 'Stores early bird signup and enterprise waitlist information';


--
-- Name: early_bird_waitlist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.early_bird_waitlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: early_bird_waitlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.early_bird_waitlist_id_seq OWNED BY public.early_bird_waitlist.id;


--
-- Name: fake_job_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fake_job_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    ip_address character varying(45),
    user_agent text,
    job_title character varying(500),
    job_description_snippet text,
    is_fake boolean NOT NULL,
    confidence_score integer NOT NULL,
    risk_level character varying(20) NOT NULL,
    red_flags_count integer DEFAULT 0,
    red_flags jsonb,
    reasoning text,
    analysis_duration_ms integer,
    model_version character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fake_job_analyses_confidence_score_check CHECK (((confidence_score >= 0) AND (confidence_score <= 100))),
    CONSTRAINT fake_job_analyses_risk_level_check CHECK (((risk_level)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])))
);


--
-- Name: TABLE fake_job_analyses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fake_job_analyses IS 'Tracks all fake job detection analyses for usage statistics and analytics';


--
-- Name: fake_job_analysis_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.fake_job_analysis_stats AS
 SELECT date(created_at) AS analysis_date,
    count(*) AS total_analyses,
    count(DISTINCT user_id) AS unique_users,
    count(DISTINCT ip_address) AS unique_ips,
    sum(
        CASE
            WHEN is_fake THEN 1
            ELSE 0
        END) AS fake_jobs_detected,
    sum(
        CASE
            WHEN (NOT is_fake) THEN 1
            ELSE 0
        END) AS legitimate_jobs,
    avg(confidence_score) AS avg_confidence,
    sum(
        CASE
            WHEN ((risk_level)::text = 'high'::text) THEN 1
            ELSE 0
        END) AS high_risk_count,
    sum(
        CASE
            WHEN ((risk_level)::text = 'medium'::text) THEN 1
            ELSE 0
        END) AS medium_risk_count,
    sum(
        CASE
            WHEN ((risk_level)::text = 'low'::text) THEN 1
            ELSE 0
        END) AS low_risk_count,
    avg(analysis_duration_ms) AS avg_duration_ms
   FROM public.fake_job_analyses
  GROUP BY (date(created_at))
  ORDER BY (date(created_at)) DESC;


--
-- Name: interview_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interview_feedback (
    id integer NOT NULL,
    interview_id integer NOT NULL,
    provided_by uuid NOT NULL,
    rating integer,
    technical_skills_rating integer,
    communication_rating integer,
    cultural_fit_rating integer,
    feedback_text text,
    strengths text,
    areas_for_improvement text,
    recommendation character varying(50),
    next_steps text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT interview_feedback_communication_rating_check CHECK (((communication_rating >= 1) AND (communication_rating <= 5))),
    CONSTRAINT interview_feedback_cultural_fit_rating_check CHECK (((cultural_fit_rating >= 1) AND (cultural_fit_rating <= 5))),
    CONSTRAINT interview_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT interview_feedback_technical_skills_rating_check CHECK (((technical_skills_rating >= 1) AND (technical_skills_rating <= 5)))
);


--
-- Name: TABLE interview_feedback; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.interview_feedback IS 'Stores post-interview feedback and ratings';


--
-- Name: COLUMN interview_feedback.recommendation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_feedback.recommendation IS 'Final recommendation: hire, no_hire, maybe, next_round';


--
-- Name: interview_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.interview_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: interview_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.interview_feedback_id_seq OWNED BY public.interview_feedback.id;


--
-- Name: interview_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interview_invitations (
    id integer NOT NULL,
    recruiter_id uuid NOT NULL,
    candidate_id uuid,
    resume_id integer,
    job_posting_id integer,
    title character varying(255) NOT NULL,
    description text,
    interview_type character varying(50) DEFAULT 'video_call'::character varying,
    proposed_datetime timestamp without time zone NOT NULL,
    duration_minutes integer DEFAULT 60,
    timezone character varying(100) DEFAULT 'UTC'::character varying,
    meeting_link character varying(500),
    meeting_location text,
    meeting_instructions text,
    status character varying(50) DEFAULT 'pending'::character varying,
    candidate_response text,
    recruiter_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    responded_at timestamp without time zone,
    guest_candidate_name character varying(255),
    guest_candidate_email character varying(255),
    CONSTRAINT check_candidate_or_guest CHECK ((((candidate_id IS NOT NULL) AND (guest_candidate_name IS NULL) AND (guest_candidate_email IS NULL)) OR ((candidate_id IS NULL) AND (guest_candidate_name IS NOT NULL) AND (guest_candidate_email IS NOT NULL))))
);


--
-- Name: TABLE interview_invitations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.interview_invitations IS 'Stores interview invitations sent by recruiters to candidates';


--
-- Name: COLUMN interview_invitations.interview_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_invitations.interview_type IS 'Type of interview: video_call, phone, in_person, technical';


--
-- Name: COLUMN interview_invitations.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_invitations.status IS 'Current status: pending, accepted, declined, rescheduled, completed, cancelled';


--
-- Name: COLUMN interview_invitations.guest_candidate_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_invitations.guest_candidate_name IS 'Name of guest candidate (for candidates without CVZen accounts)';


--
-- Name: COLUMN interview_invitations.guest_candidate_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_invitations.guest_candidate_email IS 'Email of guest candidate (for candidates without CVZen accounts)';


--
-- Name: interview_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.interview_invitations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: interview_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.interview_invitations_id_seq OWNED BY public.interview_invitations.id;


--
-- Name: interview_reschedule_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interview_reschedule_requests (
    id integer NOT NULL,
    interview_id integer NOT NULL,
    requested_by character varying(50) NOT NULL,
    new_proposed_datetime timestamp without time zone NOT NULL,
    new_duration_minutes integer,
    reason text,
    status character varying(50) DEFAULT 'pending'::character varying,
    response_message text,
    created_at timestamp without time zone DEFAULT now(),
    responded_at timestamp without time zone
);


--
-- Name: TABLE interview_reschedule_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.interview_reschedule_requests IS 'Handles requests to reschedule interviews';


--
-- Name: COLUMN interview_reschedule_requests.requested_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_reschedule_requests.requested_by IS 'Who requested the reschedule: recruiter or candidate';


--
-- Name: interview_reschedule_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.interview_reschedule_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: interview_reschedule_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.interview_reschedule_requests_id_seq OWNED BY public.interview_reschedule_requests.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number character varying(50) NOT NULL,
    subscription_id uuid NOT NULL,
    subscription_type character varying(20) NOT NULL,
    payment_id uuid,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    amount integer NOT NULL,
    tax_amount integer DEFAULT 0,
    discount_amount integer DEFAULT 0,
    total_amount integer NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying,
    billing_name character varying(255) NOT NULL,
    billing_email character varying(255) NOT NULL,
    billing_address jsonb,
    billing_gstin character varying(50),
    line_items jsonb DEFAULT '[]'::jsonb NOT NULL,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date,
    paid_date date,
    pdf_url text,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'paid'::character varying, 'overdue'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT invoices_subscription_type_check CHECK (((subscription_type)::text = ANY ((ARRAY['user'::character varying, 'company'::character varying])::text[])))
);


--
-- Name: job_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_applications (
    id integer NOT NULL,
    job_id integer NOT NULL,
    user_id uuid,
    resume_id integer,
    status character varying(50) DEFAULT 'applied'::character varying,
    cover_letter text,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shared_token character varying(255),
    resume_file_url text,
    guest_name character varying(255),
    guest_email character varying(255),
    ai_score integer,
    ai_recommendation character varying(50),
    ai_reasoning text,
    ai_strengths jsonb,
    ai_concerns jsonb,
    ai_screened_at timestamp without time zone,
    recruiter_feedback text,
    CONSTRAINT check_user_or_guest CHECK (((user_id IS NOT NULL) OR (guest_email IS NOT NULL))),
    CONSTRAINT job_applications_ai_score_check CHECK (((ai_score >= 0) AND (ai_score <= 100)))
);


--
-- Name: TABLE job_applications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.job_applications IS 'Stores job applications from candidates to job postings';


--
-- Name: COLUMN job_applications.shared_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.shared_token IS 'Share token from resume_shares - not unique as same resume can apply to multiple jobs';


--
-- Name: COLUMN job_applications.resume_file_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.resume_file_url IS 'URL to uploaded resume file (PDF, DOC, DOCX)';


--
-- Name: COLUMN job_applications.ai_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.ai_score IS 'AI-generated match score (0-100)';


--
-- Name: COLUMN job_applications.ai_recommendation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.ai_recommendation IS 'AI recommendation: Highly Recommended, Recommended, Maybe, Not Recommended';


--
-- Name: COLUMN job_applications.ai_reasoning; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.ai_reasoning IS 'AI explanation for the score and recommendation';


--
-- Name: COLUMN job_applications.ai_strengths; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.ai_strengths IS 'JSON array of candidate strengths identified by AI';


--
-- Name: COLUMN job_applications.ai_concerns; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.ai_concerns IS 'JSON array of concerns identified by AI';


--
-- Name: COLUMN job_applications.ai_screened_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.ai_screened_at IS 'Timestamp when AI screening was performed';


--
-- Name: COLUMN job_applications.recruiter_feedback; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_applications.recruiter_feedback IS 'Feedback from recruiter after interview completion';


--
-- Name: job_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_applications_id_seq OWNED BY public.job_applications.id;


--
-- Name: job_postings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_postings (
    id integer NOT NULL,
    recruiter_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    company character varying(255) NOT NULL,
    location character varying(255),
    job_type character varying(50),
    salary_range character varying(100),
    description text,
    requirements jsonb,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    department character varying(100),
    experience_level character varying(20),
    salary_min integer,
    salary_max integer,
    salary_currency character varying(3) DEFAULT 'USD'::character varying,
    benefits jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    view_count integer DEFAULT 0,
    company_id integer,
    application_count integer,
    CONSTRAINT job_postings_experience_level_check CHECK (((experience_level)::text = ANY ((ARRAY['entry'::character varying, 'mid'::character varying, 'senior'::character varying, 'executive'::character varying])::text[])))
);


--
-- Name: COLUMN job_postings.company_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.job_postings.company_id IS 'Foreign key to companies table (INTEGER type to match companies.id)';


--
-- Name: job_postings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_postings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_postings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_postings_id_seq OWNED BY public.job_postings.id;


--
-- Name: payment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid NOT NULL,
    subscription_type character varying(20) NOT NULL,
    amount integer NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying,
    payment_method character varying(50),
    payment_gateway_id character varying(255),
    payment_status character varying(20) NOT NULL,
    transaction_id character varying(255),
    invoice_id uuid,
    billing_email character varying(255),
    billing_name character varying(255),
    billing_address jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    payment_date timestamp without time zone,
    refund_date timestamp without time zone,
    refund_amount integer,
    refund_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_history_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT payment_history_subscription_type_check CHECK (((subscription_type)::text = ANY ((ARRAY['user'::character varying, 'company'::character varying])::text[])))
);


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    order_id character varying(255) NOT NULL,
    transaction_id character varying(255) NOT NULL,
    gateway character varying(50) NOT NULL,
    amount integer NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying NOT NULL,
    status character varying(50) DEFAULT 'initiated'::character varying NOT NULL,
    gateway_response jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: personal_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_info (
    user_id uuid NOT NULL,
    date_of_birth timestamp without time zone,
    nationality character varying(100),
    current_location character varying(255),
    linkedin_url character varying(255),
    github_url character varying(255),
    portfolio_url character varying(255),
    languages character varying[],
    hobbies character varying[],
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: portfolios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolios (
    id integer NOT NULL,
    user_id integer,
    project_name character varying(255),
    project_description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: portfolios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portfolios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portfolios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portfolios_id_seq OWNED BY public.portfolios.id;


--
-- Name: project_responsibilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_responsibilities (
    project_id uuid,
    responsibility text
);


--
-- Name: project_technologies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_technologies (
    project_id uuid,
    technology character varying
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid NOT NULL,
    resume_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    project_url character varying(255),
    order_index integer NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    technologies character varying[],
    responsibilities character varying[],
    images jsonb
);


--
-- Name: recruiter_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recruiter_profiles (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    "position" character varying(255),
    bio text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    job_title character varying(255),
    phone character varying(20),
    linkedin_url character varying(255),
    email_notifications boolean DEFAULT true,
    candidate_updates boolean DEFAULT true,
    interview_reminders boolean DEFAULT true,
    logo_url text,
    description text,
    company_id integer
);


--
-- Name: COLUMN recruiter_profiles.company_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recruiter_profiles.company_id IS 'Foreign key to companies table - normalized company data';


--
-- Name: recruiter_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recruiter_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recruiter_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recruiter_profiles_id_seq OWNED BY public.recruiter_profiles.id;


--
-- Name: recruiter_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recruiter_responses (
    id integer NOT NULL,
    recruiter_id integer NOT NULL,
    user_id integer NOT NULL,
    resume_id integer NOT NULL,
    status character varying(50) DEFAULT 'viewed'::character varying NOT NULL,
    message text,
    upvotes_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: recruiter_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recruiter_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recruiter_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recruiter_responses_id_seq OWNED BY public.recruiter_responses.id;


--
-- Name: recruiter_shortlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recruiter_shortlists (
    id integer NOT NULL,
    recruiter_id uuid NOT NULL,
    resume_id integer NOT NULL,
    share_token character varying(255) NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: recruiter_shortlists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recruiter_shortlists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recruiter_shortlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recruiter_shortlists_id_seq OWNED BY public.recruiter_shortlists.id;


--
-- Name: resume_customizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resume_customizations (
    id integer NOT NULL,
    resume_id integer NOT NULL,
    user_id uuid NOT NULL,
    customization_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: resume_customizations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resume_customizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resume_customizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resume_customizations_id_seq OWNED BY public.resume_customizations.id;


--
-- Name: resume_shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resume_shares (
    id integer NOT NULL,
    resume_id integer NOT NULL,
    share_token character varying(255) NOT NULL,
    template_id character varying(100),
    template_category character varying(100),
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    view_count integer DEFAULT 0,
    user_id uuid NOT NULL
);


--
-- Name: resume_shares_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resume_shares_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resume_shares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resume_shares_id_seq OWNED BY public.resume_shares.id;


--
-- Name: resume_upvotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resume_upvotes (
    id integer NOT NULL,
    resume_id integer NOT NULL,
    user_id uuid,
    ip_address text NOT NULL,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE resume_upvotes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.resume_upvotes IS 'Tracks upvotes for resumes from users and anonymous visitors';


--
-- Name: resume_upvotes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resume_upvotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resume_upvotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resume_upvotes_id_seq OWNED BY public.resume_upvotes.id;


--
-- Name: resumes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resumes (
    user_id uuid NOT NULL,
    template_id character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    summary text NOT NULL,
    objective text,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    id integer NOT NULL,
    personal_info jsonb,
    skills jsonb,
    experience jsonb,
    education jsonb,
    projects jsonb,
    view_count integer DEFAULT 0,
    download_count integer DEFAULT 0,
    upvotes_count integer DEFAULT 0,
    ats_score integer DEFAULT 0,
    ats_score_completeness integer DEFAULT 0,
    ats_score_formatting integer DEFAULT 0,
    ats_score_keywords integer DEFAULT 0,
    ats_score_experience integer DEFAULT 0,
    ats_score_education integer DEFAULT 0,
    ats_score_skills integer DEFAULT 0,
    ats_suggestions text,
    ats_strengths text,
    ats_scored_at timestamp without time zone,
    certifications jsonb DEFAULT '[]'::jsonb,
    languages jsonb DEFAULT '[]'::jsonb
);


--
-- Name: COLUMN resumes.certifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resumes.certifications IS 'Array of certifications: [{name, issuer, date, url}]';


--
-- Name: COLUMN resumes.languages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resumes.languages IS 'Array of languages: [{language, proficiency}]';


--
-- Name: resumes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resumes_id_seq
    START WITH 28
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resumes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resumes_id_seq OWNED BY public.resumes.id;


--
-- Name: skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills (
    id uuid NOT NULL,
    resume_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    proficiency integer NOT NULL,
    category character varying(100),
    years_of_experience integer,
    order_index integer NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: subscription_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid NOT NULL,
    subscription_type character varying(20) NOT NULL,
    action character varying(50) NOT NULL,
    old_plan_id uuid,
    new_plan_id uuid,
    reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    CONSTRAINT subscription_history_subscription_type_check CHECK (((subscription_type)::text = ANY ((ARRAY['user'::character varying, 'company'::character varying])::text[])))
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    user_type character varying(20) NOT NULL,
    price_monthly integer DEFAULT 0 NOT NULL,
    price_yearly integer,
    features jsonb DEFAULT '{}'::jsonb NOT NULL,
    limits jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subscription_plans_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['candidate'::character varying, 'recruiter'::character varying])::text[])))
);


--
-- Name: subscription_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid NOT NULL,
    subscription_type character varying(20) NOT NULL,
    feature_key character varying(100) NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    period_start timestamp without time zone NOT NULL,
    period_end timestamp without time zone NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subscription_usage_subscription_type_check CHECK (((subscription_type)::text = ANY ((ARRAY['user'::character varying, 'company'::character varying])::text[])))
);


--
-- Name: sustainability_pledges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sustainability_pledges (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    contact character varying(50),
    pledge_date timestamp without time zone DEFAULT now() NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying,
    certificate_sent boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: sustainability_pledges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sustainability_pledges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sustainability_pledges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sustainability_pledges_id_seq OWNED BY public.sustainability_pledges.id;


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    billing_cycle character varying(20) DEFAULT 'monthly'::character varying,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    current_period_start timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    current_period_end timestamp without time zone NOT NULL,
    cancelled_at timestamp without time zone,
    expires_at timestamp without time zone,
    trial_ends_at timestamp without time zone,
    payment_method character varying(50),
    payment_id character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_subscriptions_billing_cycle_check CHECK (((billing_cycle)::text = ANY ((ARRAY['monthly'::character varying, 'yearly'::character varying, 'lifetime'::character varying])::text[]))),
    CONSTRAINT user_subscriptions_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'suspended'::character varying, 'trial'::character varying])::text[])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(255) DEFAULT ''::character varying,
    hashed_password character varying(255) DEFAULT ''::character varying,
    first_name character varying(100),
    last_name character varying(100),
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone character varying(15),
    location text,
    profile_image text,
    linkedin_url character varying(255),
    github_url character varying(255),
    hobbies text,
    languages text,
    dateofbirth date,
    title text,
    user_type character varying(50) DEFAULT 'job_seeker'::character varying,
    password_hash character varying(255) NOT NULL,
    email_verified boolean DEFAULT true,
    password_changed_at timestamp without time zone,
    bio text,
    portfolio_url text,
    avatar text,
    avatar_url text,
    mobile character varying(20),
    CONSTRAINT chk_dateofbirth CHECK ((dateofbirth <= CURRENT_DATE)),
    CONSTRAINT chk_github_url CHECK ((((github_url)::text ~* '^https?://.*$'::text) OR (github_url IS NULL))),
    CONSTRAINT chk_linkedin_url CHECK ((((linkedin_url)::text ~* '^https?://.*$'::text) OR (linkedin_url IS NULL)))
);


--
-- Name: COLUMN users.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.title IS 'user title';


--
-- Name: work_experiences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_experiences (
    id uuid NOT NULL,
    resume_id uuid NOT NULL,
    company character varying(255) NOT NULL,
    "position" character varying(255) NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    is_current boolean,
    description text NOT NULL,
    location character varying(255),
    order_index integer NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: activities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities ALTER COLUMN id SET DEFAULT nextval('public.activities_id_seq'::regclass);


--
-- Name: ai_chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_messages ALTER COLUMN id SET DEFAULT nextval('public.ai_chat_messages_id_seq'::regclass);


--
-- Name: ai_chat_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.ai_chat_sessions_id_seq'::regclass);


--
-- Name: ai_conversation_context id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversation_context ALTER COLUMN id SET DEFAULT nextval('public.ai_conversation_context_id_seq'::regclass);


--
-- Name: ai_resume_memory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_resume_memory ALTER COLUMN id SET DEFAULT nextval('public.ai_resume_memory_id_seq'::regclass);


--
-- Name: ai_user_memory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_user_memory ALTER COLUMN id SET DEFAULT nextval('public.ai_user_memory_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: customization_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customization_settings ALTER COLUMN id SET DEFAULT nextval('public.customization_settings_id_seq'::regclass);


--
-- Name: early_bird_waitlist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.early_bird_waitlist ALTER COLUMN id SET DEFAULT nextval('public.early_bird_waitlist_id_seq'::regclass);


--
-- Name: interview_feedback id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_feedback ALTER COLUMN id SET DEFAULT nextval('public.interview_feedback_id_seq'::regclass);


--
-- Name: interview_invitations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_invitations ALTER COLUMN id SET DEFAULT nextval('public.interview_invitations_id_seq'::regclass);


--
-- Name: interview_reschedule_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_reschedule_requests ALTER COLUMN id SET DEFAULT nextval('public.interview_reschedule_requests_id_seq'::regclass);


--
-- Name: job_applications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications ALTER COLUMN id SET DEFAULT nextval('public.job_applications_id_seq'::regclass);


--
-- Name: job_postings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_postings ALTER COLUMN id SET DEFAULT nextval('public.job_postings_id_seq'::regclass);


--
-- Name: portfolios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolios ALTER COLUMN id SET DEFAULT nextval('public.portfolios_id_seq'::regclass);


--
-- Name: recruiter_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_profiles ALTER COLUMN id SET DEFAULT nextval('public.recruiter_profiles_id_seq'::regclass);


--
-- Name: recruiter_responses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_responses ALTER COLUMN id SET DEFAULT nextval('public.recruiter_responses_id_seq'::regclass);


--
-- Name: recruiter_shortlists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_shortlists ALTER COLUMN id SET DEFAULT nextval('public.recruiter_shortlists_id_seq'::regclass);


--
-- Name: resume_customizations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_customizations ALTER COLUMN id SET DEFAULT nextval('public.resume_customizations_id_seq'::regclass);


--
-- Name: resume_shares id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_shares ALTER COLUMN id SET DEFAULT nextval('public.resume_shares_id_seq'::regclass);


--
-- Name: resume_upvotes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_upvotes ALTER COLUMN id SET DEFAULT nextval('public.resume_upvotes_id_seq'::regclass);


--
-- Name: resumes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resumes ALTER COLUMN id SET DEFAULT nextval('public.resumes_id_seq'::regclass);


--
-- Name: sustainability_pledges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sustainability_pledges ALTER COLUMN id SET DEFAULT nextval('public.sustainability_pledges_id_seq'::regclass);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: ai_audit_logs ai_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_audit_logs
    ADD CONSTRAINT ai_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_messages ai_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_sessions ai_chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: ai_conversation_context ai_conversation_context_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversation_context
    ADD CONSTRAINT ai_conversation_context_pkey PRIMARY KEY (id);


--
-- Name: ai_resume_memory ai_resume_memory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_resume_memory
    ADD CONSTRAINT ai_resume_memory_pkey PRIMARY KEY (id);


--
-- Name: ai_user_memory ai_user_memory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_user_memory
    ADD CONSTRAINT ai_user_memory_pkey PRIMARY KEY (id);


--
-- Name: ai_user_memory ai_user_memory_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_user_memory
    ADD CONSTRAINT ai_user_memory_user_id_key UNIQUE (user_id);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: companies companies_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_slug_unique UNIQUE (slug);


--
-- Name: company_subscriptions company_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_subscriptions
    ADD CONSTRAINT company_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: customization_settings customization_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customization_settings
    ADD CONSTRAINT customization_settings_pkey PRIMARY KEY (id);


--
-- Name: early_bird_waitlist early_bird_waitlist_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.early_bird_waitlist
    ADD CONSTRAINT early_bird_waitlist_email_key UNIQUE (email);


--
-- Name: early_bird_waitlist early_bird_waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.early_bird_waitlist
    ADD CONSTRAINT early_bird_waitlist_pkey PRIMARY KEY (id);


--
-- Name: fake_job_analyses fake_job_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fake_job_analyses
    ADD CONSTRAINT fake_job_analyses_pkey PRIMARY KEY (id);


--
-- Name: interview_feedback interview_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_feedback
    ADD CONSTRAINT interview_feedback_pkey PRIMARY KEY (id);


--
-- Name: interview_invitations interview_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_invitations
    ADD CONSTRAINT interview_invitations_pkey PRIMARY KEY (id);


--
-- Name: interview_invitations interview_invitations_recruiter_id_candidate_id_resume_id_p_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_invitations
    ADD CONSTRAINT interview_invitations_recruiter_id_candidate_id_resume_id_p_key UNIQUE (recruiter_id, candidate_id, resume_id, proposed_datetime);


--
-- Name: interview_reschedule_requests interview_reschedule_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_reschedule_requests
    ADD CONSTRAINT interview_reschedule_requests_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: job_applications job_applications_job_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_job_id_user_id_key UNIQUE (job_id, user_id);


--
-- Name: job_applications job_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);


--
-- Name: job_postings job_postings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_pkey PRIMARY KEY (id);


--
-- Name: payment_history payment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_pkey PRIMARY KEY (id);


--
-- Name: payment_history payment_history_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_transaction_id_key UNIQUE (transaction_id);


--
-- Name: payment_transactions payment_transactions_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_order_id_key UNIQUE (order_id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_transaction_id_key UNIQUE (transaction_id);


--
-- Name: personal_info personal_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_info
    ADD CONSTRAINT personal_info_pkey PRIMARY KEY (user_id);


--
-- Name: portfolios portfolios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: recruiter_profiles recruiter_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_profiles
    ADD CONSTRAINT recruiter_profiles_pkey PRIMARY KEY (id);


--
-- Name: recruiter_profiles recruiter_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_profiles
    ADD CONSTRAINT recruiter_profiles_user_id_key UNIQUE (user_id);


--
-- Name: recruiter_responses recruiter_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_responses
    ADD CONSTRAINT recruiter_responses_pkey PRIMARY KEY (id);


--
-- Name: recruiter_shortlists recruiter_shortlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_shortlists
    ADD CONSTRAINT recruiter_shortlists_pkey PRIMARY KEY (id);


--
-- Name: resume_customizations resume_customizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_customizations
    ADD CONSTRAINT resume_customizations_pkey PRIMARY KEY (id);


--
-- Name: resume_shares resume_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_shares
    ADD CONSTRAINT resume_shares_pkey PRIMARY KEY (id);


--
-- Name: resume_shares resume_shares_share_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_shares
    ADD CONSTRAINT resume_shares_share_token_key UNIQUE (share_token);


--
-- Name: resume_upvotes resume_upvotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_upvotes
    ADD CONSTRAINT resume_upvotes_pkey PRIMARY KEY (id);


--
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: subscription_history subscription_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_usage subscription_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_usage
    ADD CONSTRAINT subscription_usage_pkey PRIMARY KEY (id);


--
-- Name: subscription_usage subscription_usage_subscription_id_subscription_type_featur_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_usage
    ADD CONSTRAINT subscription_usage_subscription_id_subscription_type_featur_key UNIQUE (subscription_id, subscription_type, feature_key, period_start);


--
-- Name: sustainability_pledges sustainability_pledges_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sustainability_pledges
    ADD CONSTRAINT sustainability_pledges_email_key UNIQUE (email);


--
-- Name: sustainability_pledges sustainability_pledges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sustainability_pledges
    ADD CONSTRAINT sustainability_pledges_pkey PRIMARY KEY (id);


--
-- Name: recruiter_responses unique_recruiter_user_resume; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_responses
    ADD CONSTRAINT unique_recruiter_user_resume UNIQUE (recruiter_id, user_id, resume_id);


--
-- Name: resume_customizations unique_resume_customization; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_customizations
    ADD CONSTRAINT unique_resume_customization UNIQUE (resume_id);


--
-- Name: customization_settings unique_user_customization; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customization_settings
    ADD CONSTRAINT unique_user_customization UNIQUE (user_id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


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
-- Name: work_experiences work_experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_experiences
    ADD CONSTRAINT work_experiences_pkey PRIMARY KEY (id);


--
-- Name: idx_activities_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_entity ON public.activities USING btree (entity_type, entity_id);


--
-- Name: idx_activities_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_type ON public.activities USING btree (activity_type);


--
-- Name: idx_activities_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_user ON public.activities USING btree (user_id);


--
-- Name: idx_ai_audit_logs_analytics; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_audit_logs_analytics ON public.ai_audit_logs USING btree (operation_type, response_status, created_at DESC);


--
-- Name: idx_ai_audit_logs_contains_pii; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_audit_logs_contains_pii ON public.ai_audit_logs USING btree (contains_pii);


--
-- Name: idx_ai_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_audit_logs_created_at ON public.ai_audit_logs USING btree (created_at DESC);


--
-- Name: idx_ai_audit_logs_operation_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_audit_logs_operation_type ON public.ai_audit_logs USING btree (operation_type);


--
-- Name: idx_ai_audit_logs_response_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_audit_logs_response_status ON public.ai_audit_logs USING btree (response_status);


--
-- Name: idx_ai_audit_logs_resume_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_audit_logs_resume_id ON public.ai_audit_logs USING btree (resume_id);


--
-- Name: idx_ai_audit_logs_service_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_audit_logs_service_name ON public.ai_audit_logs USING btree (service_name);


--
-- Name: idx_ai_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_audit_logs_user_id ON public.ai_audit_logs USING btree (user_id);


--
-- Name: idx_ai_chat_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_chat_messages_created_at ON public.ai_chat_messages USING btree (created_at);


--
-- Name: idx_ai_chat_messages_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_chat_messages_session_id ON public.ai_chat_messages USING btree (session_id);


--
-- Name: idx_ai_chat_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_chat_messages_user_id ON public.ai_chat_messages USING btree (user_id);


--
-- Name: idx_ai_chat_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_chat_sessions_active ON public.ai_chat_sessions USING btree (is_active);


--
-- Name: idx_ai_chat_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_chat_sessions_user_id ON public.ai_chat_sessions USING btree (user_id);


--
-- Name: idx_ai_conversation_context_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversation_context_active ON public.ai_conversation_context USING btree (is_active);


--
-- Name: idx_ai_conversation_context_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversation_context_key ON public.ai_conversation_context USING btree (context_key);


--
-- Name: idx_ai_conversation_context_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversation_context_type ON public.ai_conversation_context USING btree (context_type);


--
-- Name: idx_ai_conversation_context_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversation_context_user_id ON public.ai_conversation_context USING btree (user_id);


--
-- Name: idx_ai_resume_memory_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_resume_memory_hash ON public.ai_resume_memory USING btree (resume_hash);


--
-- Name: idx_ai_resume_memory_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_resume_memory_user_id ON public.ai_resume_memory USING btree (user_id);


--
-- Name: idx_ai_user_memory_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_user_memory_user_id ON public.ai_user_memory USING btree (user_id);


--
-- Name: idx_companies_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_name ON public.companies USING btree (name);


--
-- Name: idx_companies_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_slug ON public.companies USING btree (slug);


--
-- Name: idx_company_subscriptions_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_subscriptions_company_id ON public.company_subscriptions USING btree (company_id);


--
-- Name: idx_company_subscriptions_period_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_subscriptions_period_end ON public.company_subscriptions USING btree (current_period_end);


--
-- Name: idx_company_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_subscriptions_status ON public.company_subscriptions USING btree (status);


--
-- Name: idx_customization_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customization_user_id ON public.customization_settings USING btree (user_id);


--
-- Name: idx_early_bird_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_early_bird_created ON public.early_bird_waitlist USING btree (created_at DESC);


--
-- Name: idx_early_bird_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_early_bird_email ON public.early_bird_waitlist USING btree (email);


--
-- Name: idx_early_bird_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_early_bird_status ON public.early_bird_waitlist USING btree (status);


--
-- Name: idx_fake_job_analyses_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fake_job_analyses_created_at ON public.fake_job_analyses USING btree (created_at);


--
-- Name: idx_fake_job_analyses_ip_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fake_job_analyses_ip_address ON public.fake_job_analyses USING btree (ip_address);


--
-- Name: idx_fake_job_analyses_is_fake; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fake_job_analyses_is_fake ON public.fake_job_analyses USING btree (is_fake);


--
-- Name: idx_fake_job_analyses_risk_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fake_job_analyses_risk_level ON public.fake_job_analyses USING btree (risk_level);


--
-- Name: idx_fake_job_analyses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fake_job_analyses_user_id ON public.fake_job_analyses USING btree (user_id);


--
-- Name: idx_interview_feedback_interview; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_feedback_interview ON public.interview_feedback USING btree (interview_id);


--
-- Name: idx_interview_feedback_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_feedback_provider ON public.interview_feedback USING btree (provided_by);


--
-- Name: idx_interview_invitations_candidate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_invitations_candidate ON public.interview_invitations USING btree (candidate_id);


--
-- Name: idx_interview_invitations_datetime; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_invitations_datetime ON public.interview_invitations USING btree (proposed_datetime);


--
-- Name: idx_interview_invitations_guest_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_invitations_guest_email ON public.interview_invitations USING btree (guest_candidate_email) WHERE (guest_candidate_email IS NOT NULL);


--
-- Name: idx_interview_invitations_recruiter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_invitations_recruiter ON public.interview_invitations USING btree (recruiter_id);


--
-- Name: idx_interview_invitations_resume; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_invitations_resume ON public.interview_invitations USING btree (resume_id);


--
-- Name: idx_interview_invitations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_invitations_status ON public.interview_invitations USING btree (status);


--
-- Name: idx_invoices_issue_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_issue_date ON public.invoices USING btree (issue_date DESC);


--
-- Name: idx_invoices_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_number ON public.invoices USING btree (invoice_number);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_invoices_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_subscription ON public.invoices USING btree (subscription_id, subscription_type);


--
-- Name: idx_job_applications_ai_recommendation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_ai_recommendation ON public.job_applications USING btree (ai_recommendation) WHERE (ai_recommendation IS NOT NULL);


--
-- Name: idx_job_applications_ai_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_ai_score ON public.job_applications USING btree (ai_score DESC) WHERE (ai_score IS NOT NULL);


--
-- Name: idx_job_applications_resume_file; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_resume_file ON public.job_applications USING btree (resume_file_url) WHERE (resume_file_url IS NOT NULL);


--
-- Name: idx_job_applications_shared_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_applications_shared_token ON public.job_applications USING btree (shared_token);


--
-- Name: idx_job_postings_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_postings_active ON public.job_postings USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_job_postings_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_postings_company_id ON public.job_postings USING btree (company_id);


--
-- Name: idx_job_postings_recruiter_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_postings_recruiter_active ON public.job_postings USING btree (recruiter_id, is_active);


--
-- Name: idx_job_postings_recruiter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_postings_recruiter_id ON public.job_postings USING btree (recruiter_id);


--
-- Name: idx_job_postings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_postings_status ON public.job_postings USING btree (status);


--
-- Name: idx_payment_history_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_history_date ON public.payment_history USING btree (payment_date DESC);


--
-- Name: idx_payment_history_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_history_status ON public.payment_history USING btree (payment_status);


--
-- Name: idx_payment_history_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_history_subscription ON public.payment_history USING btree (subscription_id, subscription_type);


--
-- Name: idx_payment_history_transaction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_history_transaction ON public.payment_history USING btree (transaction_id);


--
-- Name: idx_payment_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions USING btree (created_at DESC);


--
-- Name: idx_payment_transactions_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_order_id ON public.payment_transactions USING btree (order_id);


--
-- Name: idx_payment_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_status ON public.payment_transactions USING btree (status);


--
-- Name: idx_payment_transactions_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_transaction_id ON public.payment_transactions USING btree (transaction_id);


--
-- Name: idx_payment_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions USING btree (user_id);


--
-- Name: idx_recruiter_profiles_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_profiles_company_id ON public.recruiter_profiles USING btree (company_id);


--
-- Name: idx_recruiter_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_profiles_user_id ON public.recruiter_profiles USING btree (user_id);


--
-- Name: idx_recruiter_responses_recruiter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_responses_recruiter ON public.recruiter_responses USING btree (recruiter_id);


--
-- Name: idx_recruiter_responses_resume; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_responses_resume ON public.recruiter_responses USING btree (resume_id);


--
-- Name: idx_recruiter_responses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_responses_status ON public.recruiter_responses USING btree (status);


--
-- Name: idx_recruiter_responses_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_responses_user ON public.recruiter_responses USING btree (user_id);


--
-- Name: idx_recruiter_shortlists_recruiter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruiter_shortlists_recruiter_id ON public.recruiter_shortlists USING btree (recruiter_id);


--
-- Name: idx_reschedule_requests_interview; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reschedule_requests_interview ON public.interview_reschedule_requests USING btree (interview_id);


--
-- Name: idx_reschedule_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reschedule_requests_status ON public.interview_reschedule_requests USING btree (status);


--
-- Name: idx_resume_customizations_resume_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resume_customizations_resume_id ON public.resume_customizations USING btree (resume_id);


--
-- Name: idx_resume_customizations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resume_customizations_user_id ON public.resume_customizations USING btree (user_id);


--
-- Name: idx_resume_shares_resume_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resume_shares_resume_id ON public.resume_shares USING btree (resume_id);


--
-- Name: idx_resume_shares_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resume_shares_token ON public.resume_shares USING btree (share_token);


--
-- Name: idx_resume_shares_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resume_shares_user_id ON public.resume_shares USING btree (user_id);


--
-- Name: idx_resume_upvotes_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resume_upvotes_ip ON public.resume_upvotes USING btree (ip_address);


--
-- Name: idx_resume_upvotes_resume_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resume_upvotes_resume_id ON public.resume_upvotes USING btree (resume_id);


--
-- Name: idx_resume_upvotes_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_resume_upvotes_unique ON public.resume_upvotes USING btree (resume_id, ip_address);


--
-- Name: idx_resumes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resumes_user_id ON public.resumes USING btree (user_id);


--
-- Name: idx_subscription_history_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_history_subscription ON public.subscription_history USING btree (subscription_id, subscription_type);


--
-- Name: idx_subscription_usage_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_usage_period ON public.subscription_usage USING btree (period_start, period_end);


--
-- Name: idx_subscription_usage_subscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_usage_subscription ON public.subscription_usage USING btree (subscription_id, subscription_type);


--
-- Name: idx_sustainability_pledges_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sustainability_pledges_date ON public.sustainability_pledges USING btree (pledge_date);


--
-- Name: idx_sustainability_pledges_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sustainability_pledges_email ON public.sustainability_pledges USING btree (email);


--
-- Name: idx_sustainability_pledges_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sustainability_pledges_status ON public.sustainability_pledges USING btree (status);


--
-- Name: idx_user_subscriptions_period_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_subscriptions_period_end ON public.user_subscriptions USING btree (current_period_end);


--
-- Name: idx_user_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions USING btree (status);


--
-- Name: idx_user_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_user_type ON public.users USING btree (user_type);


--
-- Name: job_applications job_applications_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER job_applications_updated_at_trigger BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.update_job_applications_updated_at();


--
-- Name: invoices trigger_set_invoice_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();


--
-- Name: job_postings update_job_postings_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_job_postings_timestamp BEFORE UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION public.update_job_postings_timestamp();


--
-- Name: ai_chat_messages ai_chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE;


--
-- Name: ai_chat_messages ai_chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ai_chat_sessions ai_chat_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ai_conversation_context ai_conversation_context_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversation_context
    ADD CONSTRAINT ai_conversation_context_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id) ON DELETE SET NULL;


--
-- Name: ai_conversation_context ai_conversation_context_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversation_context
    ADD CONSTRAINT ai_conversation_context_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ai_resume_memory ai_resume_memory_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_resume_memory
    ADD CONSTRAINT ai_resume_memory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ai_user_memory ai_user_memory_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_user_memory
    ADD CONSTRAINT ai_user_memory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: company_subscriptions company_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_subscriptions
    ADD CONSTRAINT company_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: fake_job_analyses fake_job_analyses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fake_job_analyses
    ADD CONSTRAINT fake_job_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: resume_customizations fk_resume; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_customizations
    ADD CONSTRAINT fk_resume FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON DELETE CASCADE;


--
-- Name: resume_shares fk_resume_shares_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_shares
    ADD CONSTRAINT fk_resume_shares_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resume_customizations fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_customizations
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_transactions fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: interview_feedback interview_feedback_interview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_feedback
    ADD CONSTRAINT interview_feedback_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interview_invitations(id) ON DELETE CASCADE;


--
-- Name: interview_feedback interview_feedback_provided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_feedback
    ADD CONSTRAINT interview_feedback_provided_by_fkey FOREIGN KEY (provided_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: interview_invitations interview_invitations_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_invitations
    ADD CONSTRAINT interview_invitations_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: interview_invitations interview_invitations_job_posting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_invitations
    ADD CONSTRAINT interview_invitations_job_posting_id_fkey FOREIGN KEY (job_posting_id) REFERENCES public.job_postings(id) ON DELETE SET NULL;


--
-- Name: interview_invitations interview_invitations_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_invitations
    ADD CONSTRAINT interview_invitations_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: interview_reschedule_requests interview_reschedule_requests_interview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_reschedule_requests
    ADD CONSTRAINT interview_reschedule_requests_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interview_invitations(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payment_history(id);


--
-- Name: job_applications job_applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job_postings(id) ON DELETE CASCADE;


--
-- Name: job_applications job_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: job_postings job_postings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: job_postings job_postings_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: project_responsibilities project_responsibilities_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_responsibilities
    ADD CONSTRAINT project_responsibilities_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_technologies project_technologies_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_technologies
    ADD CONSTRAINT project_technologies_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: recruiter_profiles recruiter_profiles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_profiles
    ADD CONSTRAINT recruiter_profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: recruiter_profiles recruiter_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_profiles
    ADD CONSTRAINT recruiter_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: recruiter_shortlists recruiter_shortlists_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_shortlists
    ADD CONSTRAINT recruiter_shortlists_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resume_upvotes resume_upvotes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_upvotes
    ADD CONSTRAINT resume_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: subscription_history subscription_history_new_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_new_plan_id_fkey FOREIGN KEY (new_plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: subscription_history subscription_history_old_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_old_plan_id_fkey FOREIGN KEY (old_plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- PostgreSQL database dump complete
--

