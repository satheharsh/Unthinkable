"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function getPatientDashboardData() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || (session.user as any).role !== "PATIENT") {
    throw new Error("Unauthorized");
  }

  const patientId = (session.user as any).id;
  const now = new Date();

  // Get upcoming appointments
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      patientId,
      slotTime: { gte: now },
      status: "BOOKED"
    },
    include: {
      doctor: true,
    },
    orderBy: {
      slotTime: 'asc'
    }
  });

  // Get past appointments with summaries
  const pastAppointments = await prisma.appointment.findMany({
    where: {
      patientId,
      slotTime: { lt: now },
      status: "BOOKED"
    },
    include: {
      doctor: true,
      llmSummary: true
    },
    orderBy: {
      slotTime: 'desc'
    }
  });

  return {
    upcomingAppointments: upcomingAppointments.map(appt => ({
      id: appt.id,
      doctor: appt.doctor.name,
      specialization: appt.doctor.specialization || "General Practice",
      time: appt.slotTime.toLocaleString(),
      meetLink: appt.meetLink || ""
    })),
    pastSummaries: pastAppointments.map(appt => {
      let meds: any[] = [];
      if (appt.llmSummary?.medicationSchedule) {
        try {
          meds = appt.llmSummary.medicationSchedule as any;
        } catch (e) {}
      }
      return {
        id: appt.id,
        doctor: appt.doctor.name,
        date: appt.slotTime.toLocaleDateString(),
        summary: appt.postVisitSummary || appt.llmSummary?.summaryText || "No summary available.",
        medications: Array.isArray(meds) ? meds : [],
        actionItems: []
      };
    })
  };
}

export async function getDoctorDashboardData() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || (session.user as any).role !== "DOCTOR") {
    throw new Error("Unauthorized");
  }

  const doctorId = (session.user as any).id;
  const now = new Date();

  // Get today's appointments
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const todaysAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      slotTime: { gte: todayStart, lte: todayEnd },
      status: "BOOKED"
    },
    include: {
      patient: true,
    },
    orderBy: {
      slotTime: 'asc'
    }
  });

  return {
    appointments: todaysAppointments.map(appt => ({
      id: appt.id,
      patientName: appt.patient?.name || "Unknown",
      time: appt.slotTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      type: "Follow-up",
      symptoms: appt.symptoms || "No symptoms provided",
      meetLink: appt.meetLink || ""
    }))
  };
}
