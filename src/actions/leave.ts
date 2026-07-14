"use server";

import "server-only";

import prisma from "@/lib/prisma";
import { sendCancellationEmail } from "./email";
import { deleteCalendarEvent } from "./calendar";
import { MarkLeaveSchema } from "@/lib/validations";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function markDoctorOnLeave(
  doctorId: string,
  date: Date,
  reason: string
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || (user.role !== "ADMIN" && user.id !== doctorId)) {
    throw new Error("Unauthorized: only admins or the assigned doctor can mark leave.");
  }

  // Validate input
  const parsed = MarkLeaveSchema.safeParse({
    doctorId,
    date,
    reason,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  // Beginning of the day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  // End of the day
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Store appointments for later email/calendar processing
  let affectedAppointments: any[] = [];

  await prisma.$transaction(async (tx) => {
    // Create leave entry
    await tx.doctorLeave.create({
      data: {
        doctorId,
        startTime: startOfDay,
        endTime: endOfDay,
        reason,
      },
    });

    // Get booked appointments
    affectedAppointments = await tx.appointment.findMany({
      where: {
        doctorId,
        slotTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "BOOKED",
      },
      include: {
        patient: true,
      },
    });

    // Cancel booked appointments
    if (affectedAppointments.length > 0) {
      await tx.appointment.updateMany({
        where: {
          id: {
            in: affectedAppointments.map((a) => a.id),
          },
        },
        data: {
          status: "CANCELLED_DUE_TO_LEAVE",
        },
      });
    }

    // Cancel remaining available/on-hold slots
    await tx.appointment.updateMany({
      where: {
        doctorId,
        slotTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["AVAILABLE", "ON_HOLD"],
        },
      },
      data: {
        status: "CANCELLED_DUE_TO_LEAVE",
      },
    });
  });

  // Outside transaction: send emails & delete calendar events
  for (const appt of affectedAppointments) {
    try {
      if (appt.patient?.email) {
        await sendCancellationEmail(
          appt.patient.email,
          appt.patient.name,
          appt.slotTime.toLocaleString(),
          reason
        );
      }

      if (appt.calendarEventId) {
        await deleteCalendarEvent(appt.calendarEventId);
      }
    } catch (error) {
      console.error(
        `Failed processing appointment ${appt.id}:`,
        error
      );
    }
  }

  return {
    success: true,
    cancelledAppointments: affectedAppointments.length,
  };
}
