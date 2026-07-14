import { NextResponse } from "next/server";
import { db } from "@/utils/db";

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key_for_build");
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

async function sendNotification(type: string, recipient: string, subject: string | null, message: string) {
  if (type === "EMAIL") {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient,
      subject: subject || 'HealthSync Notification',
      html: message,
    });
    if (error) {
      throw new Error(`Resend Error: ${error.message}`);
    }
    return true;
  }
  
  // SMS Mock
  console.log(`[Notification ${type}] To: ${recipient}`);
  console.log(`Message: ${message}`);
  
  // Simulate random failure (10% chance) for demonstrating SMS retry logic
  if (Math.random() < 0.1) {
    throw new Error("Simulated SMS network timeout/failure");
  }
  return true;
}

export async function GET(req: Request) {
  try {
    // Authenticate cron request (Vercel cron passes a secret)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch pending or failed notifications that haven't exhausted retries
    const notifications = await db.notificationQueue.findMany({
      where: {
        status: { in: ["PENDING", "FAILED"] },
        retryCount: { lt: 3 }
      },
      take: 50 // process in batches
    });

    if (notifications.length === 0) {
      return NextResponse.json({ message: "No notifications to process" });
    }

    let successCount = 0;
    let failCount = 0;

    for (const notif of notifications) {
      try {
        await sendNotification(notif.type, notif.recipient, notif.subject, notif.message);
        
        await db.notificationQueue.update({
          where: { id: notif.id },
          data: { status: "SENT" }
        });
        successCount++;
      } catch (error) {
        await db.notificationQueue.update({
          where: { id: notif.id },
          data: { 
            status: "FAILED",
            retryCount: { increment: 1 }
          }
        });
        failCount++;
      }
    }

    return NextResponse.json({ 
      processed: notifications.length,
      successful: successCount,
      failed: failCount
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
