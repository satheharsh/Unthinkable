import { db } from "@/utils/db";

/**
 * Mock Twilio Service
 * In a real application, this would use the twilio Node SDK.
 * Here, we simply queue the SMS in our NotificationQueue for the cron job to process.
 */
export async function sendSMS(to: string, message: string) {
  try {
    // Queue the SMS
    await db.notificationQueue.create({
      data: {
        type: "SMS",
        recipient: to,
        message: message,
        status: "PENDING",
        retryCount: 0
      }
    });
    
    console.log(`[Twilio Mock] SMS queued for ${to}`);
    return { success: true, queued: true };
  } catch (error) {
    console.error("Error queueing SMS:", error);
    throw new Error("Failed to queue SMS notification");
  }
}
