import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { queueEmailNotification } from '@/actions/email';

/**
 * Cron Job: Runs daily (e.g., 08:00 AM)
 * Scans the LLMSummary table for active medication schedules
 * and dispatches email reminders to patients.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

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

    let remindersQueued = 0;

    for (const summary of summaries) {
      const patient = summary.appointment.patient;
      if (!patient?.email) continue;
      
      const meds = summary.medicationSchedule as any[];
      if (!meds || !Array.isArray(meds) || meds.length === 0) continue;

      // Format medications into an HTML list
      const medsHtml = meds
        .map((m, index) => `<li><strong>${m.name || m.medicationName || `Medication ${index + 1}`}:</strong> ${m.instructions || 'Follow prescription instructions.'}</li>`)
        .join('');

      await queueEmailNotification({
        recipient: patient.email,
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
      remindersQueued++;
    }

    return NextResponse.json({ success: true, remindersQueued });
  } catch (error) {
    console.error("Medication reminder cron failed:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
