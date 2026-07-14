"use server";

import "server-only";

import prisma from "@/lib/prisma";
import {
  bookAppointmentSafely,
  holdAppointmentSlotSafely,
} from "@/lib/db-locks";
import { createCalendarEvent } from "./calendar";
import {
  sendBookingConfirmedEmail,
  sendDoctorBookingEmail,
} from "./email";
import { generatePreVisitSummary } from "./llm";
import { generateAvailableSlots } from "@/utils/slots";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

type SessionUser = {
  id: string;
  role: string;
  email: string;
  name?: string | null;
};

type HoldSlotInput = {
  doctorId: string;
  slotTime: string;
};

type FinalizeBookingInput = {
  appointmentId: string;
  symptoms: string;
};

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDailySlotCapacity(startTime?: string | null, endTime?: string | null, duration?: number | null) {
  const [startHour, startMinute] = (startTime || "09:00").split(":").map(Number);
  const [endHour, endMinute] = (endTime || "17:00").split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const slotDuration = duration || 30;

  return Math.max(0, Math.floor((endMinutes - startMinutes) / slotDuration));
}

async function requirePatient() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "PATIENT") {
    throw new Error("Unauthorized: must be logged in as a patient.");
  }

  return user;
}

async function assertSlotIsDisplayedAsAvailable(doctorId: string, slotTime: Date) {
  const slots = await generateAvailableSlots(doctorId, getDateKey(slotTime));
  const matchingSlot = slots.find(
    (slot) => slot.dateTime.getTime() === slotTime.getTime()
  );

  if (!matchingSlot || matchingSlot.status !== "AVAILABLE") {
    throw new Error("This slot is no longer available. Please choose another time.");
  }
}

export async function getDoctorDirectory() {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    select: {
      id: true,
      name: true,
      email: true,
      specialization: true,
      startTime: true,
      endTime: true,
      slotDurationMinutes: true,
      doctorAppointments: {
        where: {
          slotTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: { in: ["BOOKED", "ON_HOLD"] },
        },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return doctors.map((doctor) => {
    const slotCapacity = getDailySlotCapacity(
      doctor.startTime,
      doctor.endTime,
      doctor.slotDurationMinutes
    );

    return {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization || "General Practice",
      workingHours: `${doctor.startTime || "09:00"} - ${doctor.endTime || "17:00"}`,
      slotDurationMinutes: doctor.slotDurationMinutes || 30,
      rating: 4.8,
      availableSlots: Math.max(0, slotCapacity - doctor.doctorAppointments.length),
    };
  });
}

export async function holdSlot({ doctorId, slotTime }: HoldSlotInput) {
  try {
    const user = await requirePatient();
    const startTime = new Date(slotTime);

    if (isNaN(startTime.getTime()) || startTime < new Date()) {
      throw new Error("Invalid or past slot time provided.");
    }

    await assertSlotIsDisplayedAsAvailable(doctorId, startTime);

    const heldAppointment = await holdAppointmentSlotSafely(
      doctorId,
      user.id,
      startTime
    );

    return {
      success: true,
      appointmentId: heldAppointment.id,
      holdExpiresAt: heldAppointment.holdExpiresAt?.toISOString() || null,
    };
  } catch (error: any) {
    console.error("holdSlot error:", error);
    return { success: false, error: error.message || "Failed to hold slot" };
  }
}

export async function finalizeBooking({
  appointmentId,
  symptoms,
}: FinalizeBookingInput) {
  try {
    const user = await requirePatient();

    if (!appointmentId) {
      throw new Error("Missing appointment hold.");
    }

    if (!symptoms || symptoms.trim().length < 5) {
      throw new Error("Please describe your symptoms before confirming.");
    }

    const appointment = await bookAppointmentSafely(appointmentId, user.id);

    let savedAppointment = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!savedAppointment) {
      throw new Error("Appointment not found after booking.");
    }

    await generatePreVisitSummary(savedAppointment.id, symptoms.trim());

    savedAppointment = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!savedAppointment) {
      throw new Error("Appointment not found after summary generation.");
    }

    const duration = savedAppointment.doctor.slotDurationMinutes || 30;
    const startTime = savedAppointment.slotTime;
    const endTime = new Date(startTime.getTime() + duration * 60000);
    let meetLink = savedAppointment.meetLink || "";
    let calendarEventId = savedAppointment.calendarEventId || "";

    try {
      const calendarResult = await createCalendarEvent(
        user.email,
        savedAppointment.doctor.email,
        startTime,
        endTime,
        `Appointment: ${user.name || "Patient"} & ${savedAppointment.doctor.name}`,
        `Symptoms: ${symptoms.trim()}`
      );

      meetLink = calendarResult.meetLink || "";
      calendarEventId = calendarResult.eventId || "";

      if (meetLink || calendarEventId) {
        await prisma.appointment.update({
          where: { id: savedAppointment.id },
          data: { meetLink, calendarEventId },
        });
      }
    } catch (error) {
      console.error("Calendar event creation failed:", error);
    }

    const appointmentDate = startTime.toLocaleString();

    await Promise.all([
      sendBookingConfirmedEmail(
        user.email,
        user.name || "Patient",
        appointmentDate,
        meetLink
      ),
      sendDoctorBookingEmail(
        savedAppointment.doctor.email,
        savedAppointment.doctor.name,
        user.name || "Patient",
        appointmentDate,
        symptoms.trim(),
        meetLink
      ),
    ]);

    return { success: true, appointmentId: savedAppointment.id };
  } catch (error: any) {
    console.error("finalizeBooking error:", error);
    return { success: false, error: error.message || "Failed to finalize booking" };
  }
}

export async function getAppointmentDetail(appointmentId: string) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "DOCTOR") {
    throw new Error("Unauthorized: must be logged in as a doctor.");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: user.id,
    },
    include: {
      patient: true,
      llmSummary: true,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  return {
    id: appointment.id,
    patientName: appointment.patient?.name || "Unknown patient",
    patientEmail: appointment.patient?.email || "",
    time: appointment.slotTime.toLocaleString(),
    meetLink: appointment.meetLink || "",
    aiSummaryFailed: appointment.aiSummaryFailed,
    symptoms: appointment.symptoms || "No symptoms provided.",
    preVisitSummary: appointment.preVisitSummary || appointment.symptoms || "No pre-visit summary available.",
    doctorNotes: appointment.doctorNotes || "",
    postVisitSummary: appointment.postVisitSummary || appointment.llmSummary?.summaryText || "",
  };
}
