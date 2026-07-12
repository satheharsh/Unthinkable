# HealthSync System Design & Technical Decisions

This document outlines the architectural decisions and engineering solutions for three critical challenges in the HealthSync platform.

## 1. The Double-Booking Race Condition
**Challenge:** In high-traffic clinic scenarios, two patients might attempt to book the exact same doctor's slot at the exact same millisecond. Relying on standard application-layer logic (e.g., checking if a slot is available, then updating it) introduces a race condition where both requests could pass the read check before either commits the write.

**Solution: Pessimistic Row-Level Locking**
We solved this strictly at the database layer to guarantee data integrity regardless of how many Node.js or Vercel edge instances are running. 
When a user begins the booking wizard, we initiate a Prisma `$transaction` and execute a raw SQL query: `SELECT * FROM "Appointment" WHERE id = $1 FOR UPDATE`.
The `FOR UPDATE` clause instructs PostgreSQL to place a row-level lock on that specific appointment. If a second user's request arrives simultaneously, their transaction is forced to wait until the first transaction completes. 
1. If the first transaction succeeds, it updates the slot status to `ON_HOLD`.
2. When the database lock releases, the second transaction reads the row, sees that the status is no longer `AVAILABLE`, and immediately throws an exception to reject the booking attempt, ensuring zero double-bookings.

We pair this with an expiration timestamp (`holdExpiresAt`). A background cron job sweeps the database every 5 minutes and releases any slots that were held but never confirmed.

## 2. Leave Conflict Handling
**Challenge:** When a doctor marks themselves on leave (e.g., for sickness or vacation), the system must cleanly handle any existing appointments that were already scheduled for that day, while simultaneously preventing new appointments from being booked.

**Solution: Transactional Cascades & Automated Recovery**
The `markDoctorOnLeave` server action orchestrates a multi-step workflow wrapped in a single ACID transaction to prevent partial state updates.
1. It creates a `DoctorLeave` record denoting the timeframe.
2. It bulk-updates all `AVAILABLE` and `ON_HOLD` slots for that timeframe to `CANCELLED`, instantly removing them from the patient-facing search UI.
3. It identifies all `BOOKED` appointments within the timeframe and transitions them to `CANCELLED`.

Once the database transaction successfully commits, the system handles external side effects. It dispatches a cancellation email via Resend to every affected patient explaining the reason for the cancellation. Crucially, it also calls the Google Calendar API to delete the previously generated Calendar Events and Google Meet links, ensuring the doctor's actual calendar stays perfectly synchronized with the platform.

## 3. LLM Graceful Degradation
**Challenge:** We utilize OpenAI's models to transform raw patient symptoms and unformatted doctor notes into highly structured, professional clinical summaries. However, third-party LLM APIs can experience latency spikes, rate limits, or outright outages. A production healthcare app cannot crash or block a doctor's workflow just because a downstream AI service is unreachable.

**Solution: Strict Timeouts & Fallback Flags**
We treat the LLM as a progressive enhancement rather than a hard dependency. 
Every call to the OpenAI API is wrapped in a `Promise.race()` with a strict 5,000ms (5-second) timeout. 
If the API fails to respond within this window, or if it throws a 500 error, our catch block activates. Instead of returning an error to the UI and forcing the doctor to re-type their notes, the system automatically saves the raw, unstructured notes directly into the database. 
Crucially, it sets a boolean flag on the appointment: `aiSummaryFailed: true`.

On the front-end, the UI reads this flag. If `false`, it renders the beautiful, conditionally-formatted AI summary. If `true`, it gracefully degrades the UI, rendering a standard "Raw Symptoms/Notes" block with a clear alert informing the user that the AI formatting is temporarily unavailable. This robust pattern ensures the clinic can continue operating and recording critical health data uninterrupted, regardless of OpenAI's uptime.
