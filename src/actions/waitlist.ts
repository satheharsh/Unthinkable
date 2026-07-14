"use server";

import "server-only";
import prisma from '@/lib/prisma'; // Use the singleton instance
import { sendWaitlistOpenedEmail } from './email';

const EXPIRY_HOURS = 1;

/**
 * Triggers when a slot is CANCELLED. Finds the first eligible waitlist user,
 * sets a claim timer, and emails them a secure link.
 */
export async function processWaitlistForCancelledSlot(appointmentId: string) {
  try {
    // 1. Find the first person on the waitlist who hasn't been notified yet
    const waitlistEntry = await prisma.waitlist.findFirst({
      where: {
        appointmentId,
        notified: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: true,
        appointment: true,
      }
    });

    if (!waitlistEntry || !waitlistEntry.user?.email || !waitlistEntry.appointment) {
      // No one left on waitlist, or invalid data
      return { success: false, message: "No eligible waitlist entry found." };
    }

    // 2. Mark as notified and set the timestamp to start the 1-hour clock
    await prisma.waitlist.update({
      where: { id: waitlistEntry.id },
      data: {
        notified: true,
        notifiedAt: new Date()
      }
    });

    // 3. Generate a secure, expiring link
    const secureLink = `${process.env.NEXT_PUBLIC_APP_URL}/patient/book/${waitlistEntry.appointment.doctorId}?waitlistClaim=${waitlistEntry.id}`;

    // 4. Send email with a safety net
    try {
      const emailResult = await sendWaitlistOpenedEmail(
        waitlistEntry.user.email,
        waitlistEntry.appointment.slotTime.toLocaleString(),
        secureLink
      );

      // If you implemented the error handling from the previous email fix:
      if (emailResult && !emailResult.success) {
        throw new Error(emailResult.error || "Email delivery failed");
      }
    } catch (emailError: any) {
      console.error("Failed to send waitlist email, rolling back:", emailError.message);

      // ROLLBACK: If the email fails, reset their status so they don't unfairly lose their spot
      await prisma.waitlist.update({
        where: { id: waitlistEntry.id },
        data: {
          notified: false,
          notifiedAt: null
        }
      });

      return { success: false, error: "Failed to notify patient." };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Waitlist processing error:", error);
    return { success: false, error: "Internal server error during waitlist processing" };
  }
}

/**
 * Helper to validate a waitlist claim when a user clicks the email link.
 * Checks if the 1-hour window has expired AND if the user is authorized.
 */
export async function validateWaitlistClaim(waitlistId: string, currentUserId: string) {
  if (!waitlistId || !currentUserId) return false;

  try {
    const entry = await prisma.waitlist.findUnique({ where: { id: waitlistId } });

    if (!entry || !entry.notifiedAt) return false;

    // SECURITY: Ensure the user claiming the spot actually owns the waitlist entry
    // NOTE: You will need a `userId` or `patientId` column on your Waitlist model for this!
    if (entry.userId !== currentUserId) {
      console.warn(`User ${currentUserId} attempted to claim waitlist entry ${waitlistId} owned by ${entry.userId}`);
      return false;
    }

    const now = new Date();
    const expiryTime = new Date(entry.notifiedAt.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);

    return now <= expiryTime;
  } catch (error) {
    console.error("Error validating waitlist claim:", error);
    return false;
  }
}