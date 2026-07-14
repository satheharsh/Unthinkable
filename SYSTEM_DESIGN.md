# HealthSync System Design & Architecture

## Overview
This document outlines the core backend architecture and system design patterns utilized within the HealthSync application. HealthSync is built on Next.js 14 App Router, utilizing Server Actions for direct database mutations, Prisma as the ORM mapping to PostgreSQL, and a combination of background cron jobs and transactional webhooks for async processing. 

The primary architectural goals of this system are data integrity, high availability, concurrency safety, and patient communication reliability. This write-up specifically details how the application handles scheduling concurrency, doctor leaves, temporary locks, and fault-tolerant notifications.

---

## 1. Double-Booking Prevention & Concurrency Control

In any healthcare scheduling system, the most critical vulnerability is the "double-booking" race condition, where two patients attempt to book the same time slot for the same doctor simultaneously. HealthSync mitigates this risk at the database level utilizing a combination of ACID transactions and precise query constraints.

### The Problem
If Patient A and Patient B both load the booking page, they both see the `09:00 AM` slot as `AVAILABLE`. If they both click "Book" at the exact same millisecond, a naive implementation would simply read the status as `AVAILABLE` for both threads, and then execute an update for both, resulting in a collision.

### The Implementation
HealthSync employs **Optimistic Concurrency Control** via atomic conditional updates in Prisma. When the `appointment.ts` Server Action executes, it does not do a sequential `findUnique` followed by an `update`. Instead, it relies on a single atomic `updateMany` (or an `update` with strict `where` constraints) that includes the state condition:

```typescript
const result = await prisma.appointment.updateMany({
  where: {
    id: slotId,
    status: "AVAILABLE", // The critical lock condition
  },
  data: {
    patientId: currentPatientId,
    status: "BOOKED",
  }
});

if (result.count === 0) {
  throw new Error("Slot is no longer available.");
}
```

Because PostgreSQL processes this atomic update synchronously at the row level, only the first transaction to reach the database will successfully match the `status: "AVAILABLE"` condition. The second transaction will attempt the update, find 0 matching rows, and safely abort. This guarantees mathematically that double-booking is impossible at the database layer.

---

## 2. Slot Locks & Temporary Holds

The booking process involves a multi-step wizard where patients must enter their symptoms and triage details before finalizing payment or confirmation. To prevent the frustrating experience of a slot being "stolen" while a user is typing out their symptoms, HealthSync utilizes a temporary Slot Lock mechanism.

### The Implementation
Instead of transitioning directly from `AVAILABLE` to `BOOKED`, the system introduces an intermediate state: `ON_HOLD`.
1. When the patient clicks a time slot to begin the wizard, the server action atomically updates the slot status to `ON_HOLD` and sets an `expiresAt` timestamp (typically 10 minutes into the future).
2. The UI proceeds to the wizard, knowing this slot is exclusively locked for this specific patient session.
3. If the patient completes the wizard, the status is updated from `ON_HOLD` to `BOOKED`.
4. **Reclaiming Abandoned Locks:** HealthSync runs a background cron job (or an API route triggered by a scheduler like Vercel Cron) that sweeps the database for abandoned holds. Any slot where `status === "ON_HOLD"` and `expiresAt < now()` is automatically reverted to `AVAILABLE`, ensuring calendar capacity is never permanently lost to abandoned browser tabs.

---

## 3. Leave Conflict Cascade

Doctors occasionally need to take unexpected leave (e.g., illness or emergencies). When a `DoctorLeave` is inserted into the system, it is not enough to simply mark the calendar as unavailable; the system must gracefully handle all previously existing appointments that fall within the leave window.

### The Implementation
This is handled via a complex cascade operation utilizing Prisma Transactions to ensure that the system does not end up in a partially cancelled state if a server crash occurs mid-process.

When a leave is marked via `src/actions/leave.ts`:
1. **The Transaction:** The system opens a transaction to create the `DoctorLeave` record, query all conflicting `BOOKED` appointments, and execute a bulk `updateMany` to change their status to `CANCELLED_DUE_TO_LEAVE`. It simultaneously updates any `AVAILABLE` slots to prevent future bookings.
2. **The Notification Queue:** After the database transaction commits successfully, the affected appointments are batched. The system iterates over them to trigger side effects: sending cancellation emails via Resend/SendGrid and calling the Google/Outlook APIs to delete the calendar events. 
3. By decoupling the database transaction from the third-party API calls, the system ensures that a failure in the email API does not roll back the crucial database state.

---

## 4. Notification Retries & Fault Tolerance

Healthcare systems require reliable communication. Whether it is an appointment confirmation, a cancellation due to leave, or an automated Daily Medication Reminder generated by the AI post-visit summaries, emails must not be silently dropped if the third-party mail provider experiences an outage.

### The Implementation
While simpler applications use synchronous `await sendEmail()`, HealthSync is designed to queue notifications for fault tolerance.

1. **Daily Medication Reminders:** The cron job located at `api/cron/medication-reminders/route.ts` scans the `lLMSummary` table for active medication schedules. It extracts the JSON instructions (e.g., "Take 50mg Lisinopril daily") and attempts to email the patient.
2. **Error Handling & Retries:** If the SMTP provider times out, the `try/catch` block within the email sender catches the error. In a fully robust deployment, instead of discarding the message, it flags the `EmailQueue` database table with `status: "FAILED"`. 
3. A subsequent cron job sweeps the queue for failed messages and attempts exponential backoff retries. This ensures that transient network failures do not result in missed clinical reminders. Furthermore, all LLM failures (such as timeouts during OpenAI triage) are explicitly caught and saved with `aiSummaryFailed: true` alongside safe fallback text, ensuring that the critical path of the application is never blocked by a third-party AI outage.

## Conclusion
By enforcing atomic database updates for concurrency, utilizing intermediate states for user-experience slot locking, managing cascades via ACID transactions, and handling API failures with robust fallbacks, HealthSync achieves enterprise-grade stability. The "Locked-Box" integration strategies ensure that new features like Stripe Doctor Onboarding can be added declaratively without risking regressions in these core architectural pillars.
