import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { updateCalendarEvent } from "@/actions/calendar";
import { getServerSession } from "next-auth/next";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, newSlotTime } = body;

    if (!appointmentId || !newSlotTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const newTime = new Date(newSlotTime);
    
    // Check if new slot is available
    const existingAppt = await db.appointment.findFirst({
      where: {
        doctorId: appointment.doctorId,
        slotTime: newTime,
        status: { in: ["BOOKED", "ON_HOLD"] }
      }
    });

    if (existingAppt) {
      return NextResponse.json({ error: "Slot is no longer available" }, { status: 400 });
    }

    // Update appointment
    const updatedAppt = await db.appointment.update({
      where: { id: appointmentId },
      data: {
        slotTime: newTime,
        status: "BOOKED",
        updatedAt: new Date()
      }
    });

    // Update Calendar event if exists
    if (appointment.calendarEventId) {
      const duration = appointment.doctor.slotDurationMinutes || 30;
      const endTime = new Date(newTime.getTime() + duration * 60000);
      await updateCalendarEvent(appointment.calendarEventId, newTime, endTime);
    }

    // Queue notification
    await db.notificationQueue.create({
      data: {
        type: "EMAIL",
        recipient: "patient@example.com", // Should be actual patient email
        subject: "Appointment Rescheduled",
        message: `Your appointment has been successfully rescheduled to ${newTime.toLocaleString()}`,
        status: "PENDING"
      }
    });

    return NextResponse.json(updatedAppt);
  } catch (error: any) {
    console.error("Reschedule Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
