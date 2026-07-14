import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { updateCalendarEvent } from "@/actions/calendar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { queueEmailNotification } from "@/actions/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, newSlotTime } = body;
    const session = await getServerSession(authOptions);
    const user = session?.user as { id: string; role: string } | undefined;

    if (!user || user.role !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!appointmentId || !newSlotTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true, patient: true }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.patientId !== user.id) {
      return NextResponse.json({ error: "You can only reschedule your own appointments" }, { status: 403 });
    }

    const newTime = new Date(newSlotTime);
    if (isNaN(newTime.getTime()) || newTime < new Date()) {
      return NextResponse.json({ error: "Invalid or past slot time" }, { status: 400 });
    }
    
    // Check if new slot is available
    const existingAppt = await db.appointment.findFirst({
      where: {
        doctorId: appointment.doctorId,
        slotTime: newTime,
        status: { in: ["BOOKED", "ON_HOLD"] },
        NOT: { id: appointment.id },
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
      const calendarResult = await updateCalendarEvent(appointment.calendarEventId, newTime, endTime);
      if (!calendarResult.success) {
        console.error("Calendar reschedule failed:", calendarResult.error);
      }
    }

    const notifications = [
      appointment.patient?.email
        ? queueEmailNotification({
          recipient: appointment.patient.email,
          subject: "Appointment Rescheduled",
          html: `Your appointment has been rescheduled to ${newTime.toLocaleString()}.`,
        })
        : Promise.resolve({ success: false }),
      queueEmailNotification({
        recipient: appointment.doctor.email,
        subject: "Appointment Rescheduled",
        html: `Your appointment with ${appointment.patient?.name || "a patient"} has been rescheduled to ${newTime.toLocaleString()}.`,
      }),
    ];

    await Promise.all(notifications);

    return NextResponse.json(updatedAppt);
  } catch (error: any) {
    console.error("Reschedule Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
