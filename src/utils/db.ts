import { Appointment } from '@prisma/client';
import { BookAppointmentSchema } from '@/lib/validations';
import prisma from "@/lib/prisma";

export const db = prisma;

/**
 * Safely books an appointment slot, avoiding race conditions.
 * Uses Prisma's $transaction combined with a raw SQL SELECT ... FOR UPDATE.
 *
 * @param userId ID of the patient attempting to book
 * @param doctorId ID of the doctor
 * @param slotTime The time slot of the appointment
 * @returns The updated Appointment that is now ON_HOLD
 */
export async function bookAppointmentSafely(
  userId: string,
  doctorId: string,
  slotTime: Date
): Promise<Appointment> {
  const parsed = BookAppointmentSchema.safeParse({ userId, doctorId, slotTime });
  if (!parsed.success) {
    throw new Error("Validation Error: " + parsed.error.errors[0].message);
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Lock the specific slot for this doctor using FOR UPDATE.
    // This blocks any concurrent transactions trying to lock the same row.
    // The query returns an array of objects. We cast it to match the raw query output.
    const appointments = await tx.$queryRaw<any[]>`
      SELECT id, status, "holdExpiresAt" 
      FROM "Appointment" 
      WHERE "doctorId" = ${doctorId} 
        AND "slotTime" = ${slotTime} 
      FOR UPDATE
    `;

    if (appointments.length === 0) {
      throw new Error("Appointment slot not found.");
    }

    const appointment = appointments[0];
    const now = new Date();

    // 2. Validate availability
    const isAvailable = appointment.status === 'AVAILABLE';
    const isHoldExpired =
      appointment.status === 'ON_HOLD' &&
      appointment.holdExpiresAt &&
      new Date(appointment.holdExpiresAt) < now;

    if (!isAvailable && !isHoldExpired) {
      throw new Error("Slot is currently unavailable or booked by someone else.");
    }

    // 3. Put slot ON_HOLD (reserves it for 5 minutes)
    const holdExpiration = new Date(now.getTime() + 5 * 60000); // 5 mins from now

    const updatedAppointment = await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'ON_HOLD',
        patientId: userId,
        holdExpiresAt: holdExpiration,
      },
    });

    return updatedAppointment;
  });
}
