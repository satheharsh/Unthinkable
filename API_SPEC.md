# API Specification

## Internal API Routes
- `/api/auth/[...nextauth]` - NextAuth endpoints
- `/api/auth/register` - User Registration
- `/api/cron/cleanup-holds` - Releases expired slot holds
- `/api/cron/medication-reminders` - Dispatches medication alerts
- `/api/cron/notifications` - Processes the NotificationQueue
- `/api/appointments/reschedule` - Handles slot changes
- `/api/doctors/[id]` - Doctor data
- `/api/patient/[id]` - Patient data

## Server Actions
- `appointment.ts` - Booking logic and slot generation
- `llm.ts` - AI integrations
- `calendar.ts` - Google Calendar API
- `sms.ts` - Twilio integrations
