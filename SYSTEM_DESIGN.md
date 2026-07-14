# HealthSync: System Design Document

This document outlines the architectural decisions, database interaction patterns, and fail-safe mechanisms implemented within the HealthSync platform. The architecture emphasizes data integrity, concurrency management, and robust error handling to deliver a professional, enterprise-grade healthcare scheduling system.

---

## 1. Concurrency Management: Double-Booking Prevention & Slot Hold Mechanism

One of the most critical requirements of a healthcare scheduling platform is the absolute prevention of double-booking. When multiple patients attempt to book the same appointment slot simultaneously, the system must guarantee that only one transaction succeeds.

### The Slot Hold Architecture
To provide a smooth user experience, HealthSync employs a two-phase booking approach. When a patient begins the checkout process, the system places a temporary 5-minute "Hold" on the selected slot. 

This is achieved using **Prisma Database Transactions** paired with **Raw SQL Row-Level Locks**:

1. **Row-Level Locking:** Inside the Prisma `$transaction` block, the system executes a raw SQL query using `SELECT ... FOR UPDATE`. This exclusive lock tells the PostgreSQL database to block any concurrent transactions attempting to read or modify that specific row until the current transaction completes.
2. **State Transition:** If the slot is verified as `AVAILABLE`, the transaction updates the status to `ON_HOLD` and assigns a `holdExpiresAt` timestamp (current time + 5 minutes). 
3. **Checkout Finalization:** The patient is then routed to the Secure Copay Checkout screen. During this 5-minute window, the UI displays a countdown timer. Other users querying the schedule will see the slot omitted from the dynamic list because it is no longer marked `AVAILABLE`.
4. **Resolution:** Upon successful simulated Stripe payment, the slot transitions to `BOOKED`. If the countdown expires before checkout completion, an automated background cron job sweeps the database and reverts expired `ON_HOLD` slots back to `AVAILABLE`.

By enforcing these constraints at the database level rather than the application level, HealthSync is immune to race conditions that typically plague high-traffic booking systems.

---

## 2. Dynamic Scheduling: Doctor Leave Conflict Handling

Doctors require flexible schedules. Hardcoding available slots is insufficient for a real-world application. HealthSync implements a dynamic slot generation algorithm that reconciles a doctor's standard working hours against real-time appointments and unexpected leaves of absence.

### The `generateAvailableSlots` Utility
When a patient views a doctor's availability for a specific day, the `/api/doctors/[id]/slots` endpoint invokes the `generateAvailableSlots` utility. This function performs the following reconciliations:

1. **Base Configuration:** It retrieves the doctor's `startTime` (e.g., "09:00"), `endTime` (e.g., "17:00"), and `slotDurationMinutes` (e.g., 30 minutes) from the `User` table.
2. **Interval Generation:** The algorithm iterates from the start time to the end time, generating discrete `Date` intervals based on the slot duration.
3. **Data Aggregation:** Concurrently, it queries the database for two sets of data on the requested day:
   - Existing appointments that are `BOOKED` or `ON_HOLD`.
   - Any records in the `DoctorLeave` table that overlap with the requested day.
4. **Conflict Resolution Loop:** As the algorithm evaluates each generated interval, it performs two checks:
   - **Leave Check:** Does this specific interval intersect with the start and end timestamps of any approved `DoctorLeave`? 
   - **Booking Check:** Is this precise slot time already present in the retrieved array of existing appointments?
5. **Output:** Only intervals that pass both conflict checks are returned to the frontend as `AVAILABLE` slots. 

This approach guarantees that if a doctor suddenly requests an emergency half-day leave, the system instantly truncates their availability without requiring manual cancellation of unbooked slots. 

---

## 3. Resiliency: Notification Failure Handling & Retries

Third-party integrations (such as Resend for emails or Twilio for SMS) are inherently subject to network latency, rate limits, and outages. Relying on synchronous execution for these services risks disrupting the core user experience—for instance, failing to book an appointment merely because the confirmation email timed out.

### The Asynchronous `NotificationQueue`
HealthSync decouples critical application logic from third-party communication using an asynchronous Queue pattern.

1. **Task Enqueueing:** When an event occurs (e.g., an appointment is booked, rescheduled, or a waitlist slot opens), the system does not immediately send an email. Instead, it inserts a record into the `NotificationQueue` table with a status of `PENDING` and a `retryCount` of 0.
2. **Cron Job Processor:** A Vercel-triggered Cron endpoint (`/api/cron/notifications`) runs at regular intervals. This endpoint queries the database for all notifications marked `PENDING` or `FAILED` where `retryCount < 3`.
3. **Execution & Exponential Backoff Simulation:** The processor attempts to dispatch the queued messages via the respective third-party service provider. 
   - **Success:** If the provider confirms receipt, the database record is updated to `SENT`.
   - **Failure:** If the provider times out or throws an error, the catch block intercepts the failure. It updates the record status to `FAILED` and increments the `retryCount`. 
4. **Resiliency:** Because the processor filters by `retryCount < 3`, a transient network failure will be automatically retried on the next cron execution. This ensures high deliverability of crucial medical reminders without impacting the performance of the main web threads. 

By employing row-level database locks, dynamic algorithmic scheduling, and asynchronous queue processing, the HealthSync platform delivers a robust, secure, and highly available architecture capable of supporting modern clinical workflows.
