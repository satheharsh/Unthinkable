# 🏥 HealthSync - Open Source Healthcare Appointment System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Prisma](https://img.shields.io/badge/Prisma-ORM-teal)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

HealthSync is a production-grade, frictionless patient booking and clinic management system. It features intelligent LLM-powered visit summaries, strict database-level concurrency controls, and seamless Google Meet telehealth integrations.

## 🚀 Architecture Overview
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Shadcn UI, Framer Motion.
- **Backend**: Next.js Server Actions & API Routes, Prisma ORM, PostgreSQL.
- **Slot Hold Mechanism (Concurrency)**: We prevent double-booking race conditions directly at the database layer using Prisma's `$transaction` combined with pessimistic row-level locking (`SELECT ... FOR UPDATE`).
- **LLM Graceful Degradation**: Doctor notes and patient symptoms are structured using OpenAI. If the LLM API timeouts or fails, the system gracefully degrades to saving and displaying raw notes instead of crashing.
- **Background Jobs**: Automated crons handle releasing expired slot holds and dispatching daily medication reminders via Resend.

## 🛠️ Setup Instructions

### 1. Local Development Setup
Clone the repository and install dependencies:
\`\`\`bash
git clone https://github.com/your-org/healthsync.git
cd healthsync
npm install
\`\`\`

### 2. Environment Variables
Copy the example environment file and fill in your credentials:
\`\`\`bash
cp .env.example .env
\`\`\`

| Variable | Description |
|----------|-------------|
| \`DATABASE_URL\` | Your PostgreSQL connection string. |
| \`OPENAI_API_KEY\` | OpenAI API Key for generating medical summaries. |
| \`RESEND_API_KEY\` | Resend API key for dispatching transactional emails. |
| \`GOOGLE_CLIENT_ID\` | GCP OAuth Client ID for Calendar integration. |
| \`GOOGLE_CLIENT_SECRET\`| GCP OAuth Client Secret. |
| \`GOOGLE_REFRESH_TOKEN\`| Valid refresh token authorized for Calendar API. |
| \`NEXT_PUBLIC_APP_URL\` | The base URL of your frontend (e.g., \`http://localhost:3000\`). |

### 3. Database Setup & Prisma
Push the schema to your database and generate the Prisma Client:
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

### 4. Seeding the Database
Populate your local database with mock doctors, patients, and appointments to get the dashboards running immediately:
\`\`\`bash
npx tsx prisma/seed.ts
\`\`\`

### 5. Run the Application
\`\`\`bash
npm run dev
\`\`\`

## 📅 Google Calendar OAuth Setup
To enable automatic Google Meet links:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and enable the **Google Calendar API**.
3. Navigate to **APIs & Services > Credentials** and create an **OAuth 2.0 Client ID** (Web Application).
4. Add your redirect URIs (e.g., Google OAuth Playground if testing locally) and obtain your `Client ID` and `Client Secret`.
5. Use the OAuth Playground to authorize the Calendar API and exchange the authorization code for a `Refresh Token`.
6. Add these 3 values to your `.env` file.

## 📄 License
This project is licensed under the MIT License.
