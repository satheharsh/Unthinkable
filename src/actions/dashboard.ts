"use server";

// 1. Use the singleton Prisma instance to prevent crashing your database
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getPatientDashboardData() {
  try {
    const session = await getServerSession(authOptions);

    // Better typing strategy
    const user = session?.user as { id: string; role: string } | undefined;

    if (!user || user.role !== "PATIENT") {
      throw new Error("Unauthorized: Must be logged in as a patient");
    }

    const patientId = user.id;
    const now = new Date();

    // Run both database queries in parallel for faster loading
    const [upcomingAppointments, pastAppointments] = await Promise.all([
      prisma.appointment.findMany({
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
      }),
      prisma.appointment.findMany({
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
      })
    ]);

    return {
      upcomingAppointments: upcomingAppointments.map(appt => ({
        id: appt.id,
        doctor: appt.doctor.name || "Unknown Doctor",
        specialization: appt.doctor.specialization || "General Practice",
        time: appt.slotTime.toLocaleString(),
        meetLink: appt.meetLink || ""
      })),
      pastSummaries: pastAppointments.map(appt => {
        // Safely handle the JSON field for medications
        let meds: any[] = [];
        const rawMeds = appt.llmSummary?.medicationSchedule;

        if (rawMeds && Array.isArray(rawMeds)) {
          meds = rawMeds.map((med: any, index: number) => ({
            id: med.id || `${appt.id}-med-${index}`,
            name: med.name || med.medicationName || `Medication ${index + 1}`,
            instructions: med.instructions || med.frequency || "Follow the prescription instructions.",
          }));
        }

        return {
          id: appt.id,
          doctor: appt.doctor.name || "Unknown Doctor",
          date: appt.slotTime.toLocaleDateString(),
          summary: appt.postVisitSummary || appt.llmSummary?.summaryText || "No summary available.",
          medications: meds,
          actionItems: []
        };
      })
    };
  } catch (error: any) {
    console.error("Error fetching patient dashboard:", error);
    // Return empty arrays so the frontend doesn't crash on undefined data
    return { upcomingAppointments: [], pastSummaries: [] };
  }
}


export async function getDoctorDashboardData() {
  try {
    const session = await getServerSession(authOptions);

    const user = session?.user as { id: string; role: string } | undefined;

    if (!user || user.role !== "DOCTOR") {
      throw new Error("Unauthorized: Must be logged in as a doctor");
    }

    const doctorId = user.id;

    // Get today's start and end times properly
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        slotTime: { gte: todayStart, lte: todayEnd },
        status: "BOOKED" // You may also want to include "COMPLETED" depending on your logic
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
        time: appt.slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "Follow-up",
        status: appt.status,
        symptoms: appt.symptoms || "No symptoms provided",
        preVisitSummary: appt.preVisitSummary || "",
        meetLink: appt.meetLink || ""
      }))
    };
  } catch (error: any) {
    console.error("Error fetching doctor dashboard:", error);
    return { appointments: [] };
  }
}
