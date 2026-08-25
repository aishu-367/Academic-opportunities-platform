# Student Opportunity & Academic Discovery Platform

> A centralized, searchable platform for discovering internships,
> research positions, scholarships, competitions, fellowships, and other
> academic/career opportunities that are otherwise scattered across the
> web.

## Overview

Students often miss strong opportunities not because they are
unqualified, but because the information is fragmented.

Opportunities are published across company career pages, university
portals, research websites, scholarship portals, niche communities, and
other independent sources. Finding the right opportunity therefore often
depends on already knowing where to look or having a strong peer/senior
network.

This project explores a different approach: **build a centralized
information layer that collects opportunities from distributed sources,
structures the information, verifies it through human review, and makes
it searchable in one place.**

The current repository contains the working prototype for the
**opportunity-discovery layer** of that vision.

------------------------------------------------------------------------

## What the prototype does

The current prototype demonstrates the core discovery workflow:

1.  **Search for opportunities**
2.  **Filter by student-relevant criteria**
3.  **View structured opportunity details**
4.  **Open the official source/application page**
5.  **Collect new opportunity pages automatically**
6.  **Use AI-assisted extraction to turn unstructured webpage content
    into structured fields**
7.  **Send newly collected records to a review queue**
8.  **Approve or reject records before they appear in the public
    opportunity database**

The goal is to make opportunity discovery less dependent on chance,
repeated manual searching, and informal networks.

------------------------------------------------------------------------

## Core idea

``` text
Scattered web sources
        ↓
Automated collection
        ↓
AI-assisted extraction
        ↓
Structured opportunity record
        ↓
Human review
        ↓
Published opportunity
        ↓
Search + filters
        ↓
Student discovers the official source
```

A key design principle is that **automated collection does not
automatically mean public publication**.

The scraper can discover and process information at scale, while the
review layer provides a quality gate before a record is added to the
public dataset.

------------------------------------------------------------------------

## Current features

### Student-facing discovery

-   Opportunity search interface
-   Degree filtering
-   Academic year filtering
-   Interest-based search
-   Opportunity type filtering
-   Region filtering
-   Funding filtering
-   Search results page
-   Individual opportunity detail pages
-   Direct links to official opportunity sources

### Data pipeline

-   Python-based webpage collection
-   BeautifulSoup-based HTML parsing
-   AI-assisted information extraction using Gemini
-   Structured storage in Supabase/PostgreSQL
-   Duplicate checks against both published and pending records
-   Staging table for newly discovered opportunities
-   Human approval/rejection workflow

### Admin review

The prototype includes an admin review interface where collected
opportunities can be:

-   Reviewed
-   Approved
-   Rejected
-   Checked against their original source

Approved records are copied into the public `opportunities` table.

------------------------------------------------------------------------

## Technical architecture

### Frontend

**Next.js + React + TypeScript**

The Next.js application provides:

-   Search interface
-   Filter controls
-   Results page
-   Opportunity detail pages
-   Admin review interface

### Database / backend

**Supabase + PostgreSQL**

Supabase is used for:

-   Opportunity storage
-   Staging records
-   Querying/filtering data
-   Backend database access

The prototype separates newly collected records from published records
using:

-   `staging_opportunities`
-   `opportunities`

### Scraping / ingestion

**Python**

The scraper currently uses:

-   `requests` for HTTP requests
-   `BeautifulSoup` for HTML parsing
-   `python-dotenv` for environment configuration
-   Supabase Python client for database access

### AI extraction

**Google Gemini**

Gemini is used to extract structured information from raw webpage text.

For the current scraper, the extracted fields include:

-   Opportunity title
-   Provider / organization
-   Description
-   Deadline

The extracted data is then combined with source metadata and inserted
into the staging database.

### Automation

**GitHub Actions**

The repository includes a scheduled workflow that runs the scraper
automatically.

The current workflow is configured to:

-   Run daily
-   Use Python 3.11
-   Install scraper dependencies
-   Execute `scraper/scraper.py`

It can also be triggered manually through GitHub Actions.

------------------------------------------------------------------------

## Repository structure

``` text
.
├── app/
│   ├── admin/
│   │   └── page.tsx              # Admin review interface
│   ├── api/
│   │   └── approve/
│   │       └── route.ts           # Approve/reject API
│   ├── opportunities/
│   │   └── [id]/
│   │       └── page.tsx           # Opportunity detail page
│   ├── results/
│   │   ├── loading.tsx
│   │   └── page.tsx               # Search results
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Search homepage
│
├── components/
│   └── FilterBar.tsx
│
├── lib/
│   └── supabase.ts                # Supabase client
│
├── scraper/
│   └── scraper.py                 # Web collection + AI extraction
│
├── types/
│   └── opportunities.ts           # Opportunity type definitions
│
├── .github/
│   └── workflows/
│       └── scraper.yml            # Scheduled scraper workflow
│
├── package.json
├── requirements.txt
└── tsconfig.json
```

------------------------------------------------------------------------

## Getting started

### Prerequisites

You will need:

-   Node.js
-   npm
-   Python 3.11+
-   A Supabase project
-   A Google Gemini API key

### 1. Clone the repository

``` bash
git clone <YOUR_REPOSITORY_URL>
cd Academic-opportunities-platform-main
```

### 2. Install frontend dependencies

``` bash
npm install
```

### 3. Install scraper dependencies

``` bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env.local` file in the project root.

Example:

``` env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

GEMINI_API_KEY=your_gemini_api_key

NEXT_PUBLIC_ADMIN_PASSWORD_NEW=your_admin_password
```

**Never commit `.env.local`, API keys, service-role keys, or passwords
to GitHub.**

The Supabase service-role key must only be used in trusted server-side
or CI environments.

### 5. Start the development server

``` bash
npm run dev
```

Open:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

## Running the scraper manually

After configuring the required environment variables:

``` bash
python scraper/scraper.py
```

The scraper currently processes a defined list of target opportunity
URLs in `scraper/scraper.py`.

Newly extracted opportunities are placed into the staging table with:

``` text
status = pending_review
```

They are not immediately published.

------------------------------------------------------------------------

## GitHub Actions

The repository contains:

``` text
.github/workflows/scraper.yml
```

The workflow runs the scraper once per day and can also be manually
triggered.

Required GitHub Actions secrets:

``` text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
```

These secrets should be configured in the repository's GitHub Actions
settings rather than committed to the repository.

------------------------------------------------------------------------

## Data flow

### 1. Source collection

The scraper requests an opportunity webpage and extracts its readable
text.

### 2. AI-assisted extraction

The webpage text is sent to Gemini with a structured extraction prompt.

### 3. Validation

The scraper checks whether a usable opportunity title was extracted and
checks for existing records.

### 4. Staging

A new record is inserted into:

``` text
staging_opportunities
```

with:

``` text
status = pending_review
```

### 5. Human review

An administrator reviews the collected record.

-   **Approve** → copied to the public `opportunities` table
-   **Reject** → remains marked as rejected in staging

### 6. Student discovery

Approved opportunities become available through the student-facing
search and filtering interface.

------------------------------------------------------------------------

## Why the review layer matters

A fully automated scraper can collect information quickly, but scraped
information is not automatically trustworthy.

Opportunity pages can contain:

-   outdated deadlines
-   incomplete information
-   irrelevant pages
-   inconsistent terminology
-   changed requirements
-   pages that are no longer accepting applications

For that reason, the prototype deliberately separates:

**automated discovery** from **public publication**.

The long-term system is intended to combine automated collection and
source monitoring with a reliable verification layer.

------------------------------------------------------------------------

## Current limitations

This is an early-stage prototype, not a production platform.

Current limitations include:

-   The scraper currently uses a defined set of target URLs rather than
    discovering the entire web automatically.
-   Extracted fields are still being expanded.
-   Filtering and normalization are being refined.
-   The admin authentication is a prototype implementation and should be
    replaced with proper authentication and authorization before
    production use.
-   Source-change detection is part of the planned architecture and is
    not yet a complete production-grade monitoring system.
-   The database schema and ingestion pipeline are still evolving.
-   The system currently focuses on opportunity discovery rather than
    personalized recommendations.

These limitations are intentional areas for further development.

------------------------------------------------------------------------

## Roadmap

### Phase 1 --- Opportunity discovery

**Current**

-   Centralized opportunity database
-   Automated collection
-   AI-assisted extraction
-   Human review
-   Search and filtering
-   Official source links

### Phase 2 --- Personalization

-   Student profiles
-   Saved opportunities
-   Personalized discovery
-   Deadline tracking
-   Better eligibility matching

### Phase 3 --- University fit

Expand the platform beyond opportunities to help prospective students
understand:

-   University eligibility
-   Program requirements
-   Academic fit
-   Application requirements
-   Undergraduate university options
-   Postgraduate / Master's options

### Phase 4 --- Partner matching

For opportunities that require teams, students could discover potential
collaborators based on:

-   Skills
-   Interests
-   Academic background
-   Project requirements
-   Availability

### Long-term vision

The broader goal is to create a platform that accompanies students
through major academic decisions:

``` text
Where should I study?
        ↓
What opportunities can I pursue?
        ↓
Who can I pursue them with?
        ↓
What should I do next?
```

The current opportunity-discovery engine is the first layer of that
system.

------------------------------------------------------------------------

## Design principles

### 1. Discovery should not depend on luck

Students should not need to already know the right website, senior,
professor, or community to find relevant opportunities.

### 2. Automation should increase coverage, not remove accountability

Automated systems can collect and structure information, while human
review provides a quality checkpoint.

### 3. Build the data layer before the recommendation layer

Reliable structured opportunity data creates the foundation for future
personalization and matching.

### 4. Link students to the original source

The platform is intended to improve discovery, not replace the official
application process.

------------------------------------------------------------------------

## Project status

**Stage:** Working Prototype

The current implementation focuses on validating the core technical and
product concept:

> Can fragmented opportunity information be collected, structured,
> quality-checked, and made significantly easier for students to
> discover?

The next stage is to expand source coverage, strengthen data quality and
monitoring, and begin building personalization around the structured
opportunity dataset.

------------------------------------------------------------------------

## Tech stack

  Layer           Technology
  --------------- -------------------------------------------
  Frontend        Next.js, React, TypeScript
  Styling         Tailwind CSS
  Database        Supabase / PostgreSQL
  Web scraping    Python, Requests, BeautifulSoup
  AI extraction   Google Gemini
  Automation      GitHub Actions
  Deployment      Compatible with Next.js hosting platforms

------------------------------------------------------------------------

## Disclaimer

This project is an early-stage prototype. Opportunity information should
always be verified against the official source before applying.

------------------------------------------------------------------------

## Future direction

The long-term objective is not simply to create another opportunity
listing website.

It is to build a **student decision and discovery layer** that reduces
the information gap between students and the academic opportunities
available to them.
