# Architecture

## High-Level Design
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Authentication:** NextAuth (Credentials Provider)
- **Styling:** Tailwind CSS + Shadcn UI

## Core Mechanisms
- **Booking Engine:** Uses raw SQL row-level locking (`SELECT ... FOR UPDATE`) inside Prisma transactions to prevent double booking.
- **Dynamic Scheduling:** Algorithms merge doctor's standard hours with approved leaves and booked slots to generate real-time availability.
- **Notifications:** Asynchronous NotificationQueue processed via cron endpoints to handle retries and prevent blocking the main thread.
