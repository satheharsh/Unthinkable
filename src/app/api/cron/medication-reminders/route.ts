import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_build');
const FROM_EMAIL = 'notifications@healthsync.com';

/**
 * Cron Job: Runs daily (e.g., 08:00 AM)
 * Scans the LLMSummary table for active medication schedules
 * and dispatches email reminders to patients.
 */
export async function GET(request: Request) {
  try {
    // Find all LLMSummaries that have a populated medicationSchedule JSON array
    const summaries = await prisma.lLMSummary.findMany({
      where: {
        medicationSchedule: {
          not: 'null',
        },
      },
      include: {
        appointment: {
          include: {
            patient: true
          }
        }
      }
    });

    let emailsSent = 0;

    for (const summary of summaries) {
      const patient = summary.appointment.patient;
      if (!patient?.email) continue;
      
      const meds = summary.medicationSchedule as any[];
      if (!meds || !Array.isArray(meds) || meds.length === 0) continue;

      // Format medications into an HTML list
      const medsHtml = meds.map(m => `<li><strong>${m.medicationName}:</strong> ${m.instructions}</li>`).join('');

      await resend.emails.send({
        from: FROM_EMAIL,
        to: patient.email,
        subject: 'Daily Medication Reminder',
        html: `
          <h2>Hello ${patient.name},</h2>
          <p>This is your automated daily reminder to take your prescribed medications:</p>
          <ul style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
            ${medsHtml}
          </ul>
          <p>Stay healthy!</p>
        `,
      });
      emailsSent++;
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (error) {
    console.error("Medication reminder cron failed:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
