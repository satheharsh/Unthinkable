# HealthSync - Modern Healthcare Scheduling Platform

HealthSync is a robust, full-stack Next.js application designed for healthcare professionals and patients. It provides a seamless interface for booking appointments, managing schedules, and automating notifications. The platform incorporates advanced features like dynamic slot generation, secure role-based access control, LLM-powered medical summaries, and Google Meet integration via OAuth 2.0.

## Table of Contents
- [Tech Stack](#tech-stack)
- [Setup Guide](#setup-guide)
- [Environment Variables](#environment-variables)
- [Google Calendar OAuth 2.0 Setup](#google-calendar-oauth-20-setup)
- [API Documentation](#api-documentation)
- [Database Schema Overview](#database-schema-overview)
- [LLM Integration Prompts](#llm-integration-prompts)

---

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database:** PostgreSQL (Neon)
- **Authentication:** NextAuth.js (Role-based: PATIENT, DOCTOR, ADMIN)
- **Styling:** Tailwind CSS, Shadcn UI, Framer Motion
- **Integrations:** Google Calendar API, OpenAI API, Resend (Email)

---

## Setup Guide

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd healthcare-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (see [Environment Variables](#environment-variables) section below for the template).

4. **Initialize the Database:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Environment Variables

Create a `.env` file based on the following template. **Do not commit your real `.env` file to version control.**

```env
# Database
DATABASE_URL="postgresql://user:password@host/database"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-a-strong-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google Calendar OAuth 2.0
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REFRESH_TOKEN="your-google-refresh-token"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Resend (Email Service)
RESEND_API_KEY="re_your-resend-api-key"

# Vercel Cron
CRON_SECRET="your-cron-secret"
```

---

## Google Calendar OAuth 2.0 Setup

To generate Google Meet links dynamically, the application requires Google Calendar API access via OAuth 2.0. Follow these steps strictly:

1. **Create a Google Cloud Project:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Click **Select a project** > **New Project**, name it (e.g., "HealthSync"), and create it.

2. **Enable APIs:**
   - Navigate to **APIs & Services** > **Library**.
   - Search for **Google Calendar API** and click **Enable**.
   - Search for **Google Meet API** and click **Enable**.

3. **Configure OAuth Consent Screen:**
   - Navigate to **APIs & Services** > **OAuth consent screen**.
   - Select **External** (or Internal if you have a Google Workspace) and click **Create**.
   - Fill in the required App Information (App name, User support email, Developer contact).
   - Under **Scopes**, add `https://www.googleapis.com/auth/calendar.events`.
   - Under **Test users**, add the Google Account email you will use to authenticate and create events.

4. **Create Credentials:**
   - Navigate to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: "HealthSync Web Client".
   - Authorized redirect URIs: Add `https://developers.google.com/oauthplayground` (used to get the refresh token).
   - Click **Create**. You will receive your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

5. **Generate a Refresh Token:**
   - Go to the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
   - Click the gear icon (OAuth 2.0 configuration) in the top right. Check **Use your own OAuth credentials** and enter your Client ID and Secret.
   - In Step 1, input your own scope: `https://www.googleapis.com/auth/calendar.events` and click **Authorize APIs**.
   - Log in with the Google Account you added as a Test User.
   - In Step 2, click **Exchange authorization code for tokens**.
   - Copy the `Refresh token`. This is your `GOOGLE_REFRESH_TOKEN`.

---

## API Documentation

The application leverages Next.js App Router API endpoints for core functionality.

- `POST /api/auth/[...nextauth]` - NextAuth authentication layer.
- `GET /api/doctors/[id]/slots?date=YYYY-MM-DD` - Fetches dynamically generated available slots for a doctor on a specific date.
- `POST /api/appointments/reschedule` - Handles slot cancellation and re-booking securely.
- `GET /api/cron/notifications` - Background job endpoint to process and retry failed Email/SMS queues.
- `GET /api/cron/medication-reminders` - Background job endpoint that parses LLM generated summaries and emails daily medication reminders.
- `GET /api/patient/[id]` - Fetches patient data and triggers a HIPAA-compliant `AuditLog` entry.

---

## Database Schema Overview

The Prisma schema comprises several interconnected models to support the application's ecosystem.

- **User:** Handles authentication and role-based access (`PATIENT`, `DOCTOR`, `ADMIN`). It includes specific fields for doctors like `startTime`, `endTime`, and `slotDurationMinutes`.
- **Appointment:** Tracks booking status (`AVAILABLE`, `ON_HOLD`, `BOOKED`, `CANCELLED`), links patients to doctors, and manages the transactional 5-minute hold process (`holdExpiresAt`).
- **Waitlist:** Allows patients to subscribe to specific days/doctors if fully booked.
- **DoctorLeave:** Manages doctor unavailabilities, which are automatically parsed out of the slot generation algorithm.
- **LLMSummary:** Stores pre-visit summaries and post-visit doctor notes generated by OpenAI.
- **NotificationQueue:** A robust retry table for handling failed third-party API calls (Emails/SMS).
- **AuditLog:** A HIPAA-compliant ledger tracking whenever a Doctor accesses a Patient's records.

---

## LLM Integration Prompts

The application uses OpenAI's models (`gpt-4o-mini`) for intelligent medical summarization.

### Pre-Visit Summary Prompt
*Used to synthesize raw patient symptoms before the appointment.*
```text
You are a medical assistant. Summarize the patient symptoms concisely.
```

### Post-Visit Summary Prompt
*Used to convert raw doctor shorthand notes into a structured patient-facing summary.*
```text
You are a medical assistant. Create a structured post-visit summary from the doctor's notes.
```
*(Note: A graceful failure `try/catch` wrapper ensures that if the LLM times out or fails, the raw inputs are saved to the database to prevent data loss.)*
