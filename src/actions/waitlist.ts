import { PrismaClient } from '@prisma/client';
import { sendWaitlistOpenedEmail } from './email';

const prisma = new PrismaClient();
const EXPIRY_HOURS = 1;

/**
 * Triggers when a slot is CANCELLED. Finds the first eligible waitlist user,
 * sets a claim timer, and emails them a secure link.
 */
export async function processWaitlistForCancelledSlot(appointmentId: string) {
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

  if (!waitlistEntry || !waitlistEntry.user?.email) {
    // No one left on waitlist, ensure slot remains AVAILABLE
    return;
  }

  // 2. Mark as notified and set the notifiedAt timestamp to start the 1-hour clock
  await prisma.waitlist.update({
    where: { id: waitlistEntry.id },
    data: { 
      notified: true,
      notifiedAt: new Date()
    }
  });

  // 3. Generate a secure, expiring link
  // (In a real app, this could also use JWTs, but we rely on DB validation of notifiedAt)
  const secureLink = `${process.env.NEXT_PUBLIC_APP_URL}/patient/book/${waitlistEntry.appointment.doctorId}?waitlistClaim=${waitlistEntry.id}`;

  // 4. Send email
  await sendWaitlistOpenedEmail(
    waitlistEntry.user.email,
    waitlistEntry.appointment.slotTime.toLocaleString(),
    secureLink
  );
}

/**
 * Helper to validate a waitlist claim when a user clicks the email link.
 * Checks if the 1-hour window has expired.
 */
export async function validateWaitlistClaim(waitlistId: string) {
  const entry = await prisma.waitlist.findUnique({ where: { id: waitlistId } });
  if (!entry || !entry.notifiedAt) return false;
  

  
  const now = new Date();
  const expiryTime = new Date(entry.notifiedAt.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);
  
  return now <= expiryTime;
}
