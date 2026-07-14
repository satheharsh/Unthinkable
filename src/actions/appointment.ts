"use server";

import { PrismaClient } from "@prisma/client";
import { createCalendarEvent } from "./calendar";
import { sendBookingConfirmedEmail } from "./email";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function finalizeBooking({
  doctorId,
  slotTime,
  symptoms,
}: {
  doctorId: string;
  slotTime: string; // ISO string
  symptoms: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user as any).role !== "PATIENT") {
      throw new Error("Unauthorized: Must be logged in as a patient.");
    }
    
    const patientId = (session.user as any).id;
    const patientEmail = session.user.email;
    const patientName = session.user.name || "Patient";

    // 1. Create Appointment in DB
    const startTime = new Date(slotTime);
    // Assuming 30 minute slot
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    // Get doctor info
    const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new Error("Doctor not found");

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        slotTime: startTime,
        status: "BOOKED",
        symptoms,
      }
    });

    // 2. Generate Calendar Event & Meet Link
    let meetLink = "";
    let calendarEventId = "";
    try {
      const calRes = await createCalendarEvent(
        patientEmail!,
        doctor.email,
        startTime,
        endTime,
        `Appointment: ${patientName} & Dr. ${doctor.name}`,
        `Symptoms: ${symptoms}`
      );
      meetLink = calRes.meetLink || "";
      calendarEventId = calRes.eventId || "";
      
      // Update appointment with meet link
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { meetLink, calendarEventId }
      });
    } catch (e) {
      console.error("Calendar event creation failed:", e);
      // Don't fail the whole booking if calendar fails
    }

    // 3. Send Email
    try {
      await sendBookingConfirmedEmail(patientEmail!, patientName, startTime.toLocaleString(), meetLink);
    } catch (e) {
      console.error("Failed to send confirmation email:", e);
    }

    return { success: true, appointmentId: appointment.id };
  } catch (error: any) {
    console.error("finalizeBooking error:", error);
    return { success: false, error: error.message || "Failed to finalize booking" };
  }
}
