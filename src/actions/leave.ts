import { PrismaClient } from '@prisma/client';
import { sendCancellationEmail } from './email';
import { deleteCalendarEvent } from './calendar';
import { MarkLeaveSchema } from '@/lib/validations';

const prisma = new PrismaClient();

/**
 * Marks a doctor as being on leave for a specific date.
 * Automatically cancels all BOOKED appointments for that day, deletes their calendar events,
 * and sends cancellation emails to the affected patients.
 */
export async function markDoctorOnLeave(doctorId: string, date: Date, reason: string) {
  const parsed = MarkLeaveSchema.safeParse({ doctorId, date, reason });
  if (!parsed.success) {
    throw new Error("Validation Error: " + parsed.error.errors[0].message);
  }

  // Start of the day and end of the day for the given date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  await prisma.$transaction(async (tx) => {
    // 1. Create the DoctorLeave record
    await tx.doctorLeave.create({
      data: {
        doctorId,
        startTime: startOfDay,
        endTime: endOfDay,
        reason,
      }
    });

    // 2. Find all affected BOOKED appointments
    const affectedAppointments = await tx.appointment.findMany({
      where: {
        doctorId,
        slotTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'BOOKED',
      },
      include: {
        patient: true,
      }
    });

    // 3. Cancel affected appointments
    await tx.appointment.updateMany({
      where: {
        id: { in: affectedAppointments.map(a => a.id) }
      },
      data: {
        status: 'CANCELLED',
      }
    });

    // 4. Handle external side effects (Email + Calendar)
    // (Note: In a high-scale production system, we'd enqueue these to a background job system.
    // For this implementation, we run them sequentially inside the request.)
    for (const appt of affectedAppointments) {
      if (appt.patient?.email) {
        await sendCancellationEmail(
          appt.patient.email, 
          appt.patient.name, 
          appt.slotTime.toLocaleString(),
          reason
        );
      }

      // If a Google Calendar event was generated, delete it
      if (appt.calendarEventId) {
         await deleteCalendarEvent(appt.calendarEventId);
      }
    }
    
    // 5. Also cancel any ON_HOLD or AVAILABLE slots for that day 
    // so no one else tries to book them or comes off a waitlist.
    await tx.appointment.updateMany({
      where: {
        doctorId,
        slotTime: { gte: startOfDay, lte: endOfDay },
        status: { in: ['AVAILABLE', 'ON_HOLD'] }
      },
      data: {
        status: 'CANCELLED',
      }
    });
  });
}
