--
-- PostgreSQL database dump
--

-- Dumped from database version 10.6
-- Dumped by pg_dump version 10.10 (Ubuntu 10.10-0ubuntu0.18.04.1)

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
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA xpublegacy;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';

CREATE SCHEMA xpublegacy;

--
-- Name: auditaction; Type: TYPE; Schema: xpublegacy; Owner: -
--

CREATE TYPE xpublegacy.auditaction AS ENUM (
    'CREATED',
    'UPDATED',
    'DELETED',
    'MECA_RESULT',
    'LOGGED_IN'
);


--
-- Name: filestatus; Type: TYPE; Schema: xpublegacy; Owner: -
--

CREATE TYPE xpublegacy.filestatus AS ENUM (
    'CREATED',
    'UPLOADED',
    'STORED',
    'CANCELLED'
);


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: audit_log; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.audit_log (
    id uuid NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id uuid,
    object_id uuid,
    object_type text,
    updated timestamp with time zone,
    value text,
    action xpublegacy.auditaction
);


--
-- Name: ejp_name; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.ejp_name (
    id integer NOT NULL,
    first text,
    last text
);


--
-- Name: entities; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.entities (
    id uuid NOT NULL,
    data jsonb
);


--
-- Name: file; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.file (
    id uuid NOT NULL,
    manuscript_id uuid NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp with time zone,
    type text,
    label text,
    filename text NOT NULL,
    url text NOT NULL,
    mime_type text,
    size integer,
    status xpublegacy.filestatus DEFAULT 'CREATED'::xpublegacy.filestatus
);


--
-- Name: identity; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.identity (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp with time zone,
    type text NOT NULL,
    identifier text,
    display_name text,
    email text,
    meta jsonb
);


--
-- Name: journal; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.journal (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp with time zone,
    journal_title text NOT NULL,
    "meta,publisher_name" text
);


--
-- Name: manuscript; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.manuscript (
    id uuid NOT NULL,
    journal_id uuid,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp with time zone,
    created_by text NOT NULL,
    previous_version uuid,
    status text NOT NULL,
    last_step_visited text,
    decision text,
    cover_letter text,
    previously_discussed text,
    previously_submitted text[],
    cosubmission text[],
    opposed_senior_editors_reason text,
    opposed_reviewing_editors_reason text,
    related_manuscripts jsonb[],
    submitter_signature text,
    disclosure_consent boolean,
    qc_issues jsonb[],
    opposed_reviewers_reason text,
    meta jsonb
);


--
-- Name: migrations; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.migrations (
    id text NOT NULL,
    run_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: organization; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.organization (
    id uuid NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp with time zone,
    name text NOT NULL
);


--
-- Name: review; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.review (
    id uuid NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp with time zone,
    comments jsonb[],
    recommendation text,
    open boolean,
    user_id uuid NOT NULL
);


--
-- Name: semantic_extraction; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.semantic_extraction (
    id uuid NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp with time zone,
    manuscript_id uuid NOT NULL,
    field_name text NOT NULL,
    value text
);


--
-- Name: survey_response; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.survey_response (
    id uuid NOT NULL,
    survey_id character varying(255) NOT NULL,
    manuscript_id uuid NOT NULL,
    response jsonb NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp with time zone
);


--
-- Name: team; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy.team (
    id uuid NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp with time zone,
    team_members jsonb[] NOT NULL,
    role text NOT NULL,
    object_id uuid NOT NULL,
    object_type text NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: xpublegacy; Owner: -
--

CREATE TABLE xpublegacy."user" (
    id uuid NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp with time zone,
    default_identity text
);

--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: ejp_name ejp_name_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.ejp_name
    ADD CONSTRAINT ejp_name_pkey PRIMARY KEY (id);


--
-- Name: entities entities_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (id);


--
-- Name: file file_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.file
    ADD CONSTRAINT file_pkey PRIMARY KEY (id);


--
-- Name: identity identity_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.identity
    ADD CONSTRAINT identity_pkey PRIMARY KEY (id);


--
-- Name: journal journal_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.journal
    ADD CONSTRAINT journal_pkey PRIMARY KEY (id);


--
-- Name: manuscript manuscript_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.manuscript
    ADD CONSTRAINT manuscript_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: review review_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (id);


--
-- Name: semantic_extraction semantic_extraction_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.semantic_extraction
    ADD CONSTRAINT semantic_extraction_pkey PRIMARY KEY (id);


--
-- Name: survey_response survey_response_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.survey_response
    ADD CONSTRAINT survey_response_pkey PRIMARY KEY (id);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);

--
-- Name: ejp_name_concat; Type: INDEX; Schema: xpublegacy; Owner: -
--

CREATE INDEX ejp_name_concat ON xpublegacy.ejp_name USING btree (lower(((first || ' '::text) || last)));


--
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES xpublegacy."user"(id);


--
-- Name: file file_manuscript_id_fkey; Type: FK CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.file
    ADD CONSTRAINT file_manuscript_id_fkey FOREIGN KEY (manuscript_id) REFERENCES xpublegacy.manuscript(id);


--
-- Name: identity identity_user_id_fkey; Type: FK CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.identity
    ADD CONSTRAINT identity_user_id_fkey FOREIGN KEY (user_id) REFERENCES xpublegacy."user"(id);


--
-- Name: journal journal_organization_id_fkey; Type: FK CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.journal
    ADD CONSTRAINT journal_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES xpublegacy.organization(id);


--
-- Name: manuscript manuscript_journal_id_fkey; Type: FK CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.manuscript
    ADD CONSTRAINT manuscript_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES xpublegacy.journal(id);


--
-- Name: manuscript manuscript_previous_version_fkey; Type: FK CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.manuscript
    ADD CONSTRAINT manuscript_previous_version_fkey FOREIGN KEY (previous_version) REFERENCES xpublegacy.manuscript(id);


--
-- Name: review review_user_id_fkey; Type: FK CONSTRAINT; Schema: xpublegacy; Owner: -
--

ALTER TABLE ONLY xpublegacy.review
    ADD CONSTRAINT review_user_id_fkey FOREIGN KEY (user_id) REFERENCES xpublegacy."user"(id);
