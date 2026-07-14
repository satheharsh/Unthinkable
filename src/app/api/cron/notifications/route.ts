import { NextResponse } from "next/server";
import { db } from "@/utils/db";

// Mock email/sms sending function
async function sendNotification(type: string, recipient: string, subject: string | null, message: string) {
  console.log(`[Notification ${type}] To: ${recipient}`);
  console.log(`Subject: ${subject || 'N/A'}`);
  console.log(`Message: ${message}`);
  
  // Simulate random failure (20% chance) for demonstrating retry logic
  if (Math.random() < 0.2) {
    throw new Error("Simulated network timeout/failure");
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
