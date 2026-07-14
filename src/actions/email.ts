import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function sendBookingConfirmedEmail(to: string, patientName: string, date: string, meetLink: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Booking Confirmed',
    html: `
      <h2>Hello ${patientName},</h2>
      <p>Your appointment on <strong>${date}</strong> has been successfully booked.</p>
      <p>Join your telehealth meeting here: <a href="${meetLink}">${meetLink}</a></p>
      <p>Thank you!</p>
    `,
  });
}

export async function sendReminderEmail(to: string, patientName: string, date: string, meetLink: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Appointment Reminder',
    html: `
      <h2>Hello ${patientName},</h2>
      <p>This is a reminder for your upcoming appointment on <strong>${date}</strong>.</p>
      <p>Meeting link: <a href="${meetLink}">${meetLink}</a></p>
    `,
  });
}

export async function sendWaitlistOpenedEmail(to: string, date: string, secureLink: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Waitlist: Slot Opened!',
    html: `
      <h2>Great news!</h2>
      <p>An appointment slot you were waitlisted for on <strong>${date}</strong> has opened up.</p>
      <p>Please use the secure link below to claim your slot. This link will expire in exactly 1 hour.</p>
      <a href="${secureLink}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Claim Appointment</a>
      <p>If you don't book within 1 hour, the slot will be passed to the next person on the waitlist.</p>
    `,
  });
}

export async function sendCancellationEmail(to: string, patientName: string, date: string, reason?: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Appointment Cancelled',
    html: `
      <h2>Hello ${patientName},</h2>
      <p>We regret to inform you that your appointment on <strong>${date}</strong> has been cancelled.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
      <p>Please log in to re-book at your earliest convenience.</p>
    `,
  });
}
