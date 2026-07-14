# Database Memory

## Overview
Powered by PostgreSQL via Prisma ORM.

## Key Models
- `User`: Handles Patients, Doctors, and Admins.
- `Appointment`: Central entity for bookings.
- `DoctorLeave`: Blocks out doctor availability.
- `Waitlist`: Tracks patients waiting for cancelled slots.
- `LLMSummary`: Stores AI-generated triage and visit summaries.
- `NotificationQueue`: Asynchronous message dispatching table.

## Safety Mechanisms
- `@@unique([doctorId, slotTime])` in `Appointment` schema.
- Raw SQL locks inside transactions for slot holds.
