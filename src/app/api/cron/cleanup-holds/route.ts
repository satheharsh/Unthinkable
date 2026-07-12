import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cron Job: Runs every 5 minutes
 * Finds all ON_HOLD appointments where the 5-minute hold has expired
 * and releases them back to AVAILABLE status.
 */
export async function GET(request: Request) {
  // Authentication check would go here for Vercel Cron
  // if (request.headers.get('Authorization') !== \`Bearer \${process.env.CRON_SECRET}\`) {
  //   return new NextResponse('Unauthorized', { status: 401 });
  // }

  try {
    const now = new Date();
    
    // Find and revert expired holds
    const result = await prisma.appointment.updateMany({
      where: {
        status: 'ON_HOLD',
        holdExpiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'AVAILABLE',
        patientId: null,
        holdExpiresAt: null,
      },
    });

    return NextResponse.json({ success: true, releasedCount: result.count });
  } catch (error) {
    console.error("Failed to run cleanup holds cron:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
