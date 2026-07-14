import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates or updates an appointment to ON_HOLD status for a specific patient.
 * Uses Prisma's $transaction and raw SQL SELECT ... FOR UPDATE to ensure
 * no two patients can claim the same slot simultaneously.
 */
export async function holdAppointmentSlotSafely(
  doctorId: string,
  patientId: string,
  slotTime: Date
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Attempt to lock the row if it already exists
    // The FOR UPDATE clause locks the row so concurrent transactions must wait
    const existingSlots: any[] = await tx.$queryRaw`
      SELECT * FROM "Appointment" 
      WHERE "doctorId" = ${doctorId} 
        AND "slotTime" = ${slotTime}
      FOR UPDATE
    `;

    const existingSlot = existingSlots[0];

    if (existingSlot) {
      // Slot exists. Check if it's already booked, blocked, or actively held
      if (
        existingSlot.status === 'BOOKED' ||
        existingSlot.status === 'CANCELLED_DUE_TO_LEAVE' ||
        (existingSlot.status === 'ON_HOLD' && existingSlot.holdExpiresAt && existingSlot.holdExpiresAt > new Date())
      ) {
        throw new Error('This slot is no longer available.');
      }

      // Slot is available or the previous hold expired. We can safely claim it.
      const updatedSlot = await tx.appointment.update({
        where: { id: existingSlot.id },
        data: {
          patientId,
          status: 'ON_HOLD',
          holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // Hold for 5 minutes
        },
      });
      return updatedSlot;
    } else {
      // Slot does not exist in the DB yet. We will create it.
      // If two concurrent transactions reach this point, the unique constraint 
      // @@unique([doctorId, slotTime]) in Prisma schema will prevent the second insert.
      const newSlot = await tx.appointment.create({
        data: {
          doctorId,
          patientId,
          slotTime,
          status: 'ON_HOLD',
          holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
      return newSlot;
    }
  });
}

/**
 * Transitions an ON_HOLD appointment to BOOKED.
 * Uses SELECT ... FOR UPDATE to ensure the hold hasn't expired concurrently.
 */
export async function bookAppointmentSafely(appointmentId: string, patientId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock the appointment row
    const slots: any[] = await tx.$queryRaw`
      SELECT * FROM "Appointment" 
      WHERE id = ${appointmentId}
      FOR UPDATE
    `;

    const slot = slots[0];
    if (!slot) {
      throw new Error("Appointment not found");
    }

    // 2. Validate ownership and status
    if (slot.patientId !== patientId) {
      throw new Error("Unauthorized to book this slot");
    }

    if (slot.status === 'BOOKED') {
      return slot; // Already booked (idempotent)
    }

    if (slot.status !== 'ON_HOLD') {
      throw new Error("Slot is not on hold");
    }

    if (slot.holdExpiresAt && slot.holdExpiresAt < new Date()) {
      throw new Error("Hold has expired. Please select the slot again.");
    }

    // 3. Confirm booking
    const confirmedSlot = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'BOOKED',
        holdExpiresAt: null, // Clear the hold expiry
      },
    });

    return confirmedSlot;
  });
}
