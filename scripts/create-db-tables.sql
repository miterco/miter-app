--
-- PostgreSQL database dump
--

-- Dumped from database version 13.2 (Ubuntu 13.2-1.pgdg20.04+1)
-- Dumped by pg_dump version 13.0

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: email_addresses; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--

CREATE TYPE public.item_type as ENUM ('None', 'Pin', 'Task', 'Decision');
CREATE TYPE public.task_progress_type as ENUM ('None', 'Completed');
CREATE TYPE public.meeting_phase_type as ENUM ('NotStarted', 'InProgress', 'Ended');
CREATE TYPE public.product_surface as ENUM ('Unknown', 'WebApp', 'ChromeExtension', 'ZoomApp');

CREATE TABLE public.domains (
    domain_id uuid DEFAULT gen_random_uuid() NOT NULL,
    domain_name text,
    organization_id uuid
);

CREATE TABLE public.email_addresses (
    email_address_id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_id uuid NOT NULL,
    domain_id uuid,
    domain text,
    bounced boolean DEFAULT false,
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_update_date timestamp with time zone DEFAULT now(),
    email_address text NOT NULL,
    service_id text
);


--ALTER TABLE public.email_addresses OWNER TO xmriuzfesrsdfz;

--
-- Name: calendar_event_people; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--

CREATE TABLE public.calendar_event_people (
    calendar_event_person_id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_event_id uuid NOT NULL,
    person_id uuid NOT NULL,
    person_email_id uuid NOT NULL,
    response_status text NOT NULL,
    optional boolean NOT NULL,
    calendar_event_person_settings jsonb,
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_updated_date timestamp with time zone DEFAULT now()
);


--ALTER TABLE public.calendar_event_people OWNER TO xmriuzfesrsdfz;

--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--

CREATE TABLE public.calendar_events (
    calendar_event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    user_id uuid,
    title text,
    subject text,
    goal text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    debug boolean DEFAULT false,
    service_id text,
    description text,
    info json,
    historical boolean DEFAULT false,
    created_date timestamp with time zone DEFAULT now(),
    created_by uuid,
    last_updated_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    start_date date,
    start_time timestamp with time zone,
    end_date date,
    end_time timestamp with time zone,
    recurring_calendar_event_id uuid,
    phase public.meeting_phase_type DEFAULT 'NotStarted' NOT NULL
);


--ALTER TABLE public.calendar_events OWNER TO xmriuzfesrsdfz;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--
CREATE TYPE public.SYSTEM_MESSAGE_TYPE as ENUM ('StandardNote', 'CurrentTopicSet', 'Protocol');

CREATE TABLE public.notes (
    notes_id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid,
    topic_id uuid,
    owner_id uuid,
    protocol_id uuid,
    system_message_type public.SYSTEM_MESSAGE_TYPE DEFAULT 'StandardNote' NOT NULL,
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_updated_date timestamp with time zone DEFAULT now(),
    note_type public.item_type DEFAULT 'None' NOT NULL,
    note_text text,
    note_timestamp timestamp with time zone DEFAULT now(),
    target_date date
);


--ALTER TABLE public.notes OWNER TO xmriuzfesrsdfz;


--
-- Name: item_associated_people; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--

CREATE TABLE public.item_associated_people (
    item_associated_person_id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_id uuid  NOT NULL,
    person_email_id uuid,
    note_id uuid,
    summary_item_id uuid
);


--ALTER TABLE public.item_associated_people OWNER TO xmriuzfesrsdfz;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--

CREATE TABLE public.organizations (
    organization_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    paid_customer boolean DEFAULT false NOT NULL,
    lock_meetings boolean DEFAULT false NOT NULL,
    hubspot_id text,
    linkedin_company_url_suffix text,
    first_signed_up_user_id uuid,
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_updated_date timestamp with time zone DEFAULT now()
);


--ALTER TABLE public.organizations OWNER TO xmriuzfesrsdfz;

--
-- Name: people; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--

CREATE TABLE public.people (
    person_id uuid DEFAULT gen_random_uuid() NOT NULL,
    display_name text NOT NULL,
    organization_id uuid,
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_updated_date timestamp with time zone DEFAULT now(),
    service_id text,
    last_invited_date timestamp with time zone, 
    picture text
);


--ALTER TABLE public.people OWNER TO xmriuzfesrsdfz;

--
-- Name: recurring_calendar_events; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--

CREATE TABLE public.recurring_calendar_events (
    recurring_calendar_event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_series_id uuid NOT NULL,
    service_id text,
    start_date date,
    end_date date,
    start_timezone text,
    end_timezone text,
    recurrence_rule json,
    frequency text,
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_updated_date timestamp with time zone DEFAULT now()
);

CREATE TABLE public.meeting_series (
    meeting_series_id uuid DEFAULT gen_random_uuid() NOT NULL,
    series_title text,
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_updated_date timestamp with time zone DEFAULT now()
);

--ALTER TABLE public.recurring_calendar_events OWNER TO xmriuzfesrsdfz;

--
-- Name: meetings; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--

-- TODO Consider making is_goal_exempt non-nullable once the functionality settles a bit (Jan 2022)

CREATE TABLE public.meetings (
    meeting_id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    meeting_series_id uuid,
    is_first_meeting_in_series boolean DEFAULT true,
    current_topic_id  uuid,
    current_protocol_id  uuid,
    subject text,
    goal text,
    is_template boolean default false NOT NULL,
    is_sample_meeting boolean default false NOT NULL,
    phase text DEFAULT 'NotStarted'::text NOT NULL,
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_updated_date timestamp with time zone DEFAULT now(),
    all_day_meeting boolean NOT NULL DEFAULT false,
    start_datetime timestamp with time zone,
    end_datetime timestamp with time zone,
    zoom_meeting_id text,
    zoom_numeric_meeting_id text,
    is_goal_exempt boolean,
    idle_date timestamp with time zone,

    CONSTRAINT meetings_current_protocol_id_unique UNIQUE(current_protocol_id)
);

CREATE SEQUENCE public.topic_order_sequence;

CREATE TABLE public.topics (
    topic_id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    topic_text text NOT NULL,
    topic_order numeric DEFAULT nextval('public.topic_order_sequence'),
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_updated_date timestamp with time zone DEFAULT now()
);

ALTER SEQUENCE public.topic_order_sequence OWNED BY public.topics.topic_order;


--
-- Name: summary_items; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--

CREATE TABLE public.summary_items (
    summary_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid,
    topic_id uuid,
    protocol_id uuid,
    item_type public.item_type DEFAULT 'None' NOT NULL,
    system_message_type public.SYSTEM_MESSAGE_TYPE DEFAULT 'StandardNote' NOT NULL,
    item_owner_id uuid,
    target_date date,
    item_order integer,
    item_sync_status text,
    item_sync_details jsonb,
    item_last_sync_date date,
    task_progress public.task_progress_type DEFAULT 'None' NOT NULL,
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_updated_date timestamp with time zone DEFAULT now(),
    note_id uuid,
    item_timestamp timestamp with time zone DEFAULT now(),
    item_text text,
    item_text2 text,
    CONSTRAINT summary_item_container CHECK (meeting_id IS NOT NULL OR created_by IS NOT NULL)
);


--ALTER TABLE public.summary_items OWNER TO xmriuzfesrsdfz;

--
-- Name: meeting_people; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--

CREATE TABLE public.meeting_people (
    meeting_person_id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    person_id uuid NOT NULL,
    meeting_person_settings jsonb,
    attended boolean NOT NULL default false,
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_updated_date timestamp with time zone DEFAULT now()
);

CREATE TABLE public.meeting_tokens (
    meeting_token_id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    token_value text DEFAULT gen_random_uuid() NOT NULL,
    expiration_date timestamp with time zone NOT NULL DEFAULT '1/1/2300'
);

CREATE INDEX token_value_lookup ON public.meeting_tokens(token_value text_ops);


-- Next time we add a logs table, we should probably rename to logs_google_events
CREATE TABLE public.google_event_log (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid,
        service_id text,
        event json,
        created_by_process text,
         created_date timestamp with time zone DEFAULT now()
);

-- Table: public.jobs_email

-- DROP TABLE public.jobs_email;

CREATE TABLE IF NOT EXISTS public.jobs_email
(
    job_email_id uuid DEFAULT gen_random_uuid()  NOT NULL,
    job_name text NOT NULL,
    job_type text NOT NULL,
    job_status text NOT NULL,
    job_recipients json NOT NULL default '[]',
    send_after_time timestamp with time zone,
    sent_at_time timestamp with time zone,
    failed_at_time timestamp with time zone,
    canceled_at_time timestamp with time zone,
    blocked_at_time timestamp with time zone,
    created_date timestamp with time zone NOT NULL default now(),
    meeting_id uuid,
    creator_id uuid,
    CONSTRAINT job_email_pkey PRIMARY KEY (job_email_id)
);

--
-- Name: users; Type: TABLE; Schema: public; Owner: xmriuzfesrsdfz
--

CREATE TYPE public.SIGN_UP_SERVICE AS ENUM ('Google', 'Zoom', 'Email');

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    info json,
    tokens json,
    zoom_tokens json,
    is_internal boolean DEFAULT false,
    person_id uuid not null,
    organization_id uuid,
    display_name text,
    is_active boolean DEFAULT true,
    user_preferences jsonb,
    created_by uuid,
    created_date timestamp with time zone DEFAULT now(),
    last_updated_by uuid,
    last_updated_date timestamp with time zone DEFAULT now(),
    service_id text,
    zoom_user_id text,
    login_email text,
    first_name text,
    last_name text,
    gcal_push_channel text,
    gcal_resource_id text,
    gcal_sync_token text,
    gcal_push_channel_expiration timestamp with time zone,
    picture text,
    hubspot_id text,
    sign_up_service public.SIGN_UP_SERVICE DEFAULT 'Google' NOT NULL,
    sign_up_product_surface public.product_surface DEFAULT 'Unknown' NOT NULL,
    installed_chrome_extension boolean DEFAULT false NOT NULL,
    wip_feature text
);

--
-- Name: COLUMN users.is_internal; Type: COMMENT; Schema: public; Owner: xmriuzfesrsdfz
--

COMMENT ON COLUMN public.users.is_internal IS 'Flag we set manually so it''s easy to filter our ourselves.';

--
-- Name: email_addresses email_addresses_email_address_key; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domain_id_pkey PRIMARY KEY (domain_id);

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domain_name_key UNIQUE (domain_name);

ALTER TABLE ONLY public.email_addresses
    ADD CONSTRAINT email_addresses_email_address_key UNIQUE (email_address);


--
-- Name: email_addresses email_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.email_addresses
    ADD CONSTRAINT email_addresses_pkey PRIMARY KEY (email_address_id);


--
-- Name: calendar_event_people calendar_event_people_pkey; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.calendar_event_people
    ADD CONSTRAINT calendar_event_people_pkey PRIMARY KEY (calendar_event_person_id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (calendar_event_id);


--
-- Name: calendar_events calendar_events_service_id_key; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_service_id_key UNIQUE (service_id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (notes_id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (organization_id);

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_hubspot_id UNIQUE (hubspot_id);
--
-- Name: people people_pkey; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_pkey PRIMARY KEY (person_id);


--
-- Name: recurring_calendar_events recurring_calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.recurring_calendar_events
    ADD CONSTRAINT recurring_calendar_events_pkey PRIMARY KEY (recurring_calendar_event_id);



ALTER TABLE ONLY public.meeting_series
    ADD CONSTRAINT meeting_series_pkey PRIMARY KEY (meeting_series_id);


--
--
-- Name: meetings meetings_calendar_event_id_key; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_meeting_id_key UNIQUE (meeting_id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz

ALTER TABLE ONLY public.google_event_log
    ADD CONSTRAINT google_event_log_pkey PRIMARY KEY (id);
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (meeting_id);


ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_current_topic_id_key UNIQUE (current_topic_id);


--
-- Name: meetings meetings_zoom_meeting_id_key; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.meetings
ADD CONSTRAINT meetings_zoom_meeting_id_unique
UNIQUE (zoom_meeting_id);

--
-- Name: summary_items summary_items_note_id_key; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.summary_items
    ADD CONSTRAINT summary_items_note_id_key UNIQUE (note_id);


--
-- Name: summary_items summary_items_pkey; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.summary_items
    ADD CONSTRAINT summary_items_pkey PRIMARY KEY (summary_item_id);


--
-- Name: meeting_people meeting_people_pkey; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.meeting_people
    ADD CONSTRAINT meeting_people_pkey PRIMARY KEY (meeting_person_id);



ALTER TABLE ONLY public.meeting_tokens
    ADD CONSTRAINT meeting_token_pkey PRIMARY KEY (meeting_token_id);


ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_person_id_key UNIQUE (person_id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_hubspot_id UNIQUE (hubspot_id);

--
-- Name: users users_zoom_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_zoom_user_id_unique UNIQUE (zoom_user_id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_login_email_unique UNIQUE (login_email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_service_id_key; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_service_id_key UNIQUE (service_id);


--
-- Name: users users_gcal_push_channel_key; Type: CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_gcal_push_channel_key UNIQUE (gcal_push_channel);


--
-- Name: email_addresses email_addresses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.email_addresses
    ADD CONSTRAINT email_addresses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: email_addresses email_addresses_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.email_addresses
    ADD CONSTRAINT email_addresses_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: email_addresses email_addresses_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--


ALTER TABLE ONLY public.email_addresses
    ADD CONSTRAINT email_addresses_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(person_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


ALTER TABLE ONLY public.email_addresses
    ADD CONSTRAINT email_addresses_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(domain_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

--
-- Name: calendar_event_people calendar_event_people_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.calendar_event_people
    ADD CONSTRAINT calendar_event_people_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: calendar_event_people calendar_event_people_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.calendar_event_people
    ADD CONSTRAINT calendar_event_people_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: calendar_event_people calendar_event_people_calendar_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.calendar_event_people
    ADD CONSTRAINT calendar_event_people_calendar_event_id_fkey FOREIGN KEY (calendar_event_id) REFERENCES public.calendar_events(calendar_event_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: calendar_event_people calendar_event_people_person_email_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.calendar_event_people
    ADD CONSTRAINT calendar_event_people_person_email_id_fkey FOREIGN KEY (person_email_id) REFERENCES public.email_addresses(email_address_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: calendar_event_people calendar_event_people_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.calendar_event_people
    ADD CONSTRAINT calendar_event_people_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(person_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: calendar_events calendar_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: calendar_events calendar_events_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


ALTER TABLE "public"."calendar_events" ADD FOREIGN KEY ("recurring_calendar_event_id") REFERENCES "public"."recurring_calendar_events" ("recurring_calendar_event_id");

--
-- Name: notes notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--
ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: notes notes_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: notes notes_calendar_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--


ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(meeting_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: notes notes_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.people(person_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: organizations organizations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: organizations organizations_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_first_signed_up_user_id_fkey FOREIGN KEY (first_signed_up_user_id) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
--
-- Name: people people_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_service_id_key UNIQUE (service_id);

--
-- Name: people people_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: people people_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: recurring_calendar_events recurring_calendar_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.recurring_calendar_events
    ADD CONSTRAINT recurring_calendar_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: recurring_calendar_events recurring_calendar_events_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.recurring_calendar_events
    ADD CONSTRAINT recurring_calendar_events_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.recurring_calendar_events
    ADD CONSTRAINT recurring_calendar_events_service_id_key UNIQUE (service_id);


--
-- Name: meetings meetings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
--
-- Name: meetings meetings_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;




ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_meeting_series_id_fkey FOREIGN KEY (meeting_series_id) REFERENCES public.meeting_series(meeting_series_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
--
--
-- Name: summary_items summary_items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.summary_items
    ADD CONSTRAINT summary_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: summary_items summary_items_item_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.summary_items
    ADD CONSTRAINT summary_items_item_owner_id_fkey FOREIGN KEY (item_owner_id) REFERENCES public.people(person_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: summary_items summary_items_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.summary_items
    ADD CONSTRAINT summary_items_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: summary_items summary_items_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.summary_items
    ADD CONSTRAINT summary_items_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(meeting_id) ON UPDATE RESTRICT ON DELETE RESTRICT;



--
-- Name: meeting_people meeting_people_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.meeting_people
    ADD CONSTRAINT meeting_people_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: meeting_people meeting_people_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.meeting_people
    ADD CONSTRAINT meeting_people_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: meeting_people meeting_people_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.meeting_people
    ADD CONSTRAINT meeting_people_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(person_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: meeting_people meeting_people_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.meeting_people
    ADD CONSTRAINT meeting_people_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(meeting_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.meeting_tokens
    ADD CONSTRAINT meeting_tokens_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(meeting_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

--
-- Name: users users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (topic_id);

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(meeting_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(organization_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

--
-- Name: users users_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

--
-- Name: users users_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xmriuzfesrsdfz
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(person_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(topic_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


ALTER TABLE ONLY public.summary_items
    ADD CONSTRAINT summary_items_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(topic_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_current_topic_id_fkey FOREIGN KEY (current_topic_id) REFERENCES public.topics(topic_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.recurring_calendar_events
    ADD CONSTRAINT recurring_calendar_events_meeting_series_id_fkey FOREIGN KEY (meeting_series_id) REFERENCES public.meeting_series(meeting_series_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.item_associated_people
    ADD CONSTRAINT item_associated_people_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(person_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.item_associated_people
    ADD CONSTRAINT item_associated_people_person_email_id_fkey FOREIGN KEY (person_email_id) REFERENCES public.email_addresses(email_address_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.item_associated_people
    ADD CONSTRAINT item_associated_people_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(notes_id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.item_associated_people
    ADD CONSTRAINT item_associated_people_summary_item_id_fkey FOREIGN KEY (summary_item_id) REFERENCES public.summary_items(summary_item_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: xmriuzfesrsdfz
--

--REVOKE ALL ON SCHEMA public FROM postgres;
--REVOKE ALL ON SCHEMA public FROM PUBLIC;
--GRANT ALL ON SCHEMA public TO xmriuzfesrsdfz;
--GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: LANGUAGE plpgsql; Type: ACL; Schema: -; Owner: postgres
--

--GRANT ALL ON LANGUAGE plpgsql TO xmriuzfesrsdfz;


--
-- PostgreSQL database dump complete
--


------------------------------------------------------------------------------------------------------------------------
--                                             AUTH TOKENS TABLE
------------------------------------------------------------------------------------------------------------------------

CREATE TABLE public.auth_tokens (
    access_token uuid DEFAULT gen_random_uuid() NOT NULL,
    refresh_token uuid DEFAULT gen_random_uuid() NOT NULL,
    token_expires_at timestamp WITH time zone NOT NULL,
    user_id uuid NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    user_agent text,
    ip_address text,
    created_at timestamp WITH time zone DEFAULT now() NOT NULL
);

-- Make access_token unique.
ALTER TABLE ONLY public.auth_tokens
  ADD CONSTRAINT auth_tokens_access_token_unique UNIQUE (access_token);

-- Make refresh_token unique.
ALTER TABLE ONLY public.auth_tokens
  ADD CONSTRAINT auth_tokens_refresh_token_unique UNIQUE (refresh_token);

-- Add FK to users table.
ALTER TABLE ONLY public.auth_tokens
  ADD CONSTRAINT auth_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;


------------------------------------------------------------------------------------------------------------------------
--                                             MAGIC LINKS TABLE
------------------------------------------------------------------------------------------------------------------------

CREATE TABLE public.magic_links (
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_expires_at timestamp WITH time zone NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    created_at timestamp WITH time zone DEFAULT now() NOT NULL
);

-- Make token unique.
ALTER TABLE ONLY public.magic_links
  ADD CONSTRAINT magic_links_token_unique UNIQUE (token);

-- Add FK to users table.
ALTER TABLE ONLY public.magic_links
  ADD CONSTRAINT magic_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;


------------------------------------------------------------------------------------------------------------------------
--                                                HUBSPOT SUMMARY
------------------------------------------------------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.hubspot_summary AS
SELECT core.user_id, core.hubspot_id, core.google_is_active, core.zoom_is_active,
COALESCE (notes_subq.num_notes_authored,0) as number_of_notes_authored,
COALESCE (topics_subq.num_topics_authored,0) as number_of_topics_authored,
COALESCE (summary_items_subq.num_summary_items_created, 0) as number_of_summary_items_pinned,
COALESCE (tasks_subq.num_tasks_owned, 0) as number_of_tasks_owned,
COALESCE (meetings_subq.num_meetings_attended, 0) as number_of_meetings_attended,
COALESCE (summaries_subq.num_meetings_with_summaries, 0) as number_of_meetings_with_summaries,
COALESCE (goals_subq.num_meetings_with_goals, 0) as number_of_meetings_with_goals
FROM
	(select u.user_id, u.hubspot_id, u.person_id, u.is_active AS google_is_active,
	zoom_user_id IS NOT NULL AND zoom_tokens IS NOT NULL AS zoom_is_active
	from public.users as u, public.people p
	where u.person_id = p.person_id
	and u.hubspot_id is not null)
AS core

LEFT OUTER JOIN
	(select created_by, count(*) as num_notes_authored
	from public.notes
	group by created_by) AS notes_subq
ON core.user_id = notes_subq.created_by

LEFT OUTER JOIN
	(select created_by, count(*) as num_topics_authored
	from public.topics
	group by created_by) AS topics_subq
ON core.user_id = topics_subq.created_by

LEFT OUTER JOIN
	(select created_by, count(*) as num_summary_items_created
	from public.summary_items
	group by created_by) AS summary_items_subq
ON core.user_id = summary_items_subq.created_by

LEFT OUTER JOIN
	(select item_owner_id, count(*) as num_tasks_owned
	from public.summary_items si, public.meetings m
	where item_type = 'Task'
	and si.meeting_id = m.meeting_id
	and is_sample_meeting = false
	group by item_owner_id) AS tasks_subq
ON core.person_id = tasks_subq.item_owner_id

LEFT OUTER JOIN
	(select mp.person_id, count(*) as num_meetings_attended
	from public.meetings m, public.meeting_people mp
	where phase != 'NotStarted'
	and is_sample_meeting = false
	and mp.meeting_id = m.meeting_id
	group by mp.person_id) AS meetings_subq
ON core.person_id = meetings_subq.person_id

LEFT OUTER JOIN
	(select mp.person_id, count(*) as num_meetings_with_summaries
	from public.meetings m, public.meeting_people mp
	where phase = 'Ended'
	and is_sample_meeting = false
	and mp.meeting_id = m.meeting_id
	group by mp.person_id) AS summaries_subq
ON core.person_id = summaries_subq.person_id

LEFT OUTER JOIN
	(select cep.person_id, count(*) as num_meetings_with_goals
	from public.meetings m, public.calendar_events ce, public.calendar_event_people cep
	where m.goal is not null
	and is_sample_meeting = false
	and m.meeting_id = ce.meeting_id
	and cep.calendar_event_id = ce.calendar_event_id
	group by cep.person_id) AS goals_subq
ON core.person_id = goals_subq.person_id
;


------------------------------------------------------------------------------------------------------------------------
--                                                 PROTOCOL TYPES                                                     --
------------------------------------------------------------------------------------------------------------------------
CREATE TABLE public.protocol_types (
  id            UUID  NOT NULL DEFAULT gen_random_uuid(),
  name          TEXT  NOT NULL,
  description   TEXT  NOT NULL,
  data          JSON  NOT NULL DEFAULT '{}'::json,

  -- Metadata.
  created_at    TIMESTAMP with time zone DEFAULT now(),

  -- Constraints
  CONSTRAINT protocol_types_pkey PRIMARY KEY (id)
);


------------------------------------------------------------------------------------------------------------------------
--                                                 PROTOCOL PHASES                                                    --
------------------------------------------------------------------------------------------------------------------------
CREATE TYPE public.PROTOCOL_PHASE_TYPE AS ENUM (
  'SingleResponse',
  'MultipleResponses',
  'SoloMultipleResponses',
  'ContentList',
  'UserContentList',
  'VoteOnContentList',
  'ReviewVoteResults',
  'OrganizeContentList'
);

CREATE TABLE public.protocol_phases (
  -- IDs.
  id                UUID                 NOT NULL DEFAULT gen_random_uuid(),
  protocol_type_id  UUID                 NOT NULL,

  -- Entity data.
  index         INT                          NOT NULL,
  name          TEXT                         NOT NULL,
  description   TEXT                         NOT NULL,
  type          public.PROTOCOL_PHASE_TYPE   NOT NULL,
  is_collective BOOLEAN                      NOT NULL DEFAULT true,
  data          JSON                         NOT NULL DEFAULT '{}'::json,

  -- Metadata.
  created_at   TIMESTAMP with time zone DEFAULT now(),

  -- Constraints
  CONSTRAINT protocol_phases_pkey                 PRIMARY KEY (id),
  CONSTRAINT protocol_phases_protocol_type_fkey   FOREIGN KEY (protocol_type_id) REFERENCES public.protocol_types(id),
  CONSTRAINT protocol_phases_index_unique         UNIQUE (protocol_type_id, index)
);

------------------------------------------------------------------------------------------------------------------------
--                                                  PROTOCOLS                                                         --
------------------------------------------------------------------------------------------------------------------------
CREATE TABLE public.protocols (
  -- IDs.
  id                    UUID  NOT NULL DEFAULT gen_random_uuid(),
  type_id               UUID  NOT NULL,
  creator_id            UUID  NOT NULL,
  current_phase_index   INT   NOT NULL DEFAULT 0,

  -- Entity data.
  title                 TEXT     NOT NULL,
  is_completed          BOOLEAN  NOT NULL DEFAULT false,
  ready_for_next_phase  BOOLEAN  NOT NULL DEFAULT false,
  data                  JSON     NOT NULL DEFAULT '{}'::json,

  -- Metadata.
  created_at   TIMESTAMP with time zone DEFAULT now(),
  last_phase_change_date   TIMESTAMP with time zone,

  -- Constraints
  CONSTRAINT protocols_pkey               PRIMARY KEY (id),
  CONSTRAINT protocols_creator_fkey       FOREIGN KEY (creator_id)  REFERENCES public.users(user_id),
  CONSTRAINT protocols_type_fkey          FOREIGN KEY (type_id)     REFERENCES public.protocol_types(id),
  CONSTRAINT protocols_current_phase_fkey FOREIGN KEY(type_id, current_phase_index) REFERENCES public.protocol_phases(protocol_type_id, index)
);


------------------------------------------------------------------------------------------------------------------------
--                                                 PROTOCOL ITEM                                                      --
------------------------------------------------------------------------------------------------------------------------
CREATE TYPE public.protocol_item_type as ENUM ('Item', 'Group');

CREATE TABLE public.protocol_items (
  -- IDs.
  id                UUID  NOT NULL DEFAULT gen_random_uuid(),
  creator_id        UUID,
  protocol_id       UUID  NOT NULL,
  protocol_phase_id UUID  NOT NULL,
  parent_id         UUID,

  -- Entity data.
  text       TEXT     NOT NULL,
  tags       TEXT[]   NOT NULL DEFAULT '{}'::text[],
  data       JSON     NOT NULL DEFAULT '{}'::json,
  is_forcefully_prioritized BOOLEAN  NOT NULL DEFAULT false,
  is_forcefully_deprioritized BOOLEAN  NOT NULL DEFAULT false,
  type       public.protocol_item_type NOT NULL,

  -- Metadata.
  created_at TIMESTAMP with time zone DEFAULT now(),

  -- Constraints
  CONSTRAINT protocol_items_pkey           PRIMARY KEY (id),
  CONSTRAINT protocol_items_creator_fkey   FOREIGN KEY (creator_id)        REFERENCES public.users(user_id),
  CONSTRAINT protocol_items_protocol_fkey  FOREIGN KEY (protocol_id)       REFERENCES public.protocols(id),
  CONSTRAINT protocol_items_phase_fkey     FOREIGN KEY (protocol_phase_id) REFERENCES public.protocol_phases(id),
  CONSTRAINT protocol_items_type_fkey      FOREIGN KEY (parent_id)         REFERENCES public.protocol_items(id)

);

------------------------------------------------------------------------------------------------------------------------
--                                            PROTOCOL ITEM ACTION                                                    --
------------------------------------------------------------------------------------------------------------------------
CREATE TABLE public.protocol_item_actions (
  -- IDs.
  id                  UUID  NOT NULL DEFAULT gen_random_uuid(),
  creator_id          UUID  NOT NULL,
  protocol_id    UUID  NOT NULL,
  protocol_item_id    UUID  NOT NULL,

  -- Entity data.
  type       TEXT      NOT NULL,
  data       JSON      NOT NULL DEFAULT '{}'::json,

  -- Metadata.
  created_at TIMESTAMP with time zone DEFAULT now(),

  -- Constraints
  CONSTRAINT protocol_item_actions_pkey            PRIMARY KEY (id),
  CONSTRAINT protocol_item_actions_creator_fkey    FOREIGN KEY (creator_id)       REFERENCES public.users(user_id),
  CONSTRAINT protocol_item_actions_item_fkey       FOREIGN KEY (protocol_item_id) REFERENCES public.protocol_items(id),
  CONSTRAINT protocol_item_actions_protocol_fkey   FOREIGN KEY (protocol_id)      REFERENCES public.protocols(id)
);


------------------------------------------------------------------------------------------------------------------------
--                                                PROTOCOL REFERENCES                                                 --
------------------------------------------------------------------------------------------------------------------------
ALTER TABLE ONLY public.summary_items
    ADD CONSTRAINT summary_items_protocol_fkey FOREIGN KEY (protocol_id) REFERENCES public.protocols(id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_protocol_fkey FOREIGN KEY (protocol_id) REFERENCES public.protocols(id) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_current_protocol_fkey FOREIGN KEY (current_protocol_id) REFERENCES public.protocols(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
