import "server-only"; // Prevents accidental import in client components
import prisma from "@/lib/prisma";

type QueueEmailInput = {
  recipient: string;
  subject: string;
  html: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function queueEmailNotification({ recipient, subject, html }: QueueEmailInput) {
  try {
    const notification = await prisma.notificationQueue.create({
      data: {
        type: "EMAIL",
        recipient,
        subject,
        message: html,
        status: "PENDING",
        retryCount: 0,
      },
    });

    return { success: true, queued: true, id: notification.id };
  } catch (err: any) {
    console.error("Failed to queue email notification:", err);
    return { success: false, error: err.message };
  }
}

export async function sendBookingConfirmedEmail(to: string, patientName: string, date: string, meetLink?: string) {
  const safeName = escapeHtml(patientName);
  const safeDate = escapeHtml(date);
  const safeMeetLink = meetLink ? escapeHtml(meetLink) : "";

  return queueEmailNotification({
    recipient: to,
    subject: "Booking Confirmed",
    html: `
      <h2>Hello ${safeName},</h2>
      <p>Your appointment on <strong>${safeDate}</strong> has been successfully booked.</p>
      ${
        safeMeetLink
          ? `<p>Join your telehealth meeting here: <a href="${safeMeetLink}">${safeMeetLink}</a></p>`
          : `<p><em>Your meeting link will be provided closer to the appointment time.</em></p>`
      }
      <p>Thank you for using HealthSync.</p>
    `,
  });
}

export async function sendDoctorBookingEmail(
  to: string,
  doctorName: string,
  patientName: string,
  date: string,
  symptoms: string,
  meetLink?: string
) {
  const safeDoctor = escapeHtml(doctorName);
  const safePatient = escapeHtml(patientName);
  const safeDate = escapeHtml(date);
  const safeSymptoms = escapeHtml(symptoms);
  const safeMeetLink = meetLink ? escapeHtml(meetLink) : "";

  return queueEmailNotification({
    recipient: to,
    subject: "New Appointment Booked",
    html: `
      <h2>Hello ${safeDoctor},</h2>
      <p>A new appointment with <strong>${safePatient}</strong> has been booked for <strong>${safeDate}</strong>.</p>
      <p><strong>Patient symptoms:</strong></p>
      <p>${safeSymptoms}</p>
      ${safeMeetLink ? `<p>Telehealth link: <a href="${safeMeetLink}">${safeMeetLink}</a></p>` : ""}
    `,
  });
}

export async function sendCancellationEmail(to: string, patientName: string, date: string, reason?: string) {
  const safeName = escapeHtml(patientName);
  const safeDate = escapeHtml(date);
  const safeReason = reason ? escapeHtml(reason) : "";

  return queueEmailNotification({
    recipient: to,
    subject: "Appointment Cancelled",
    html: `
      <h2>Hello ${safeName},</h2>
      <p>Your appointment on <strong>${safeDate}</strong> has been cancelled.</p>
      ${safeReason ? `<p><strong>Reason:</strong> ${safeReason}</p>` : ""}
      <p>Please log in to book another available time.</p>
    `,
  });
}

export async function sendReminderEmail(to: string, patientName: string, date: string, meetLink?: string) {
  const safeName = escapeHtml(patientName);
  const safeDate = escapeHtml(date);
  const safeMeetLink = meetLink ? escapeHtml(meetLink) : "";

  return queueEmailNotification({
    recipient: to,
    subject: "Appointment Reminder",
    html: `
      <h2>Hello ${safeName},</h2>
      <p>This is a reminder for your upcoming appointment on <strong>${safeDate}</strong>.</p>
      ${safeMeetLink ? `<p>Meeting link: <a href="${safeMeetLink}">${safeMeetLink}</a></p>` : ""}
    `,
  });
}

export async function sendWaitlistOpenedEmail(to: string, date: string, secureLink: string) {
  const safeDate = escapeHtml(date);
  const safeLink = escapeHtml(secureLink);

  return queueEmailNotification({
    recipient: to,
    subject: "Waitlist: Slot Opened",
    html: `
      <h2>Great news!</h2>
      <p>An appointment slot you were waitlisted for on <strong>${safeDate}</strong> has opened up.</p>
      <p>Please use the secure link below to claim your slot. This link expires in 1 hour.</p>
      <a href="${safeLink}" style="display:inline-block;padding:10px 20px;background:#0f766e;color:#fff;text-decoration:none;border-radius:5px;">Claim Appointment</a>
    `,
  });
}
