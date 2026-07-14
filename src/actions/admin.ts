"use server";

import "server-only";

import prisma from "@/lib/prisma";
import { markDoctorOnLeave } from "./leave";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export type DoctorProfileInput = {
  name: string;
  email: string;
  specialization: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: admin access required.");
  }

  return user;
}

function validateDoctorProfile(input: DoctorProfileInput) {
  if (!input.name.trim()) throw new Error("Doctor name is required.");
  if (!input.email.includes("@")) throw new Error("A valid email is required.");
  if (!input.specialization.trim()) throw new Error("Specialization is required.");
  if (!/^\d{2}:\d{2}$/.test(input.startTime) || !/^\d{2}:\d{2}$/.test(input.endTime)) {
    throw new Error("Working hours must use HH:mm format.");
  }
  if (input.startTime >= input.endTime) {
    throw new Error("Start time must be earlier than end time.");
  }
  if (![15, 20, 30, 45, 60].includes(input.slotDurationMinutes)) {
    throw new Error("Slot duration must be 15, 20, 30, 45, or 60 minutes.");
  }
}

export async function getAdminDoctors() {
  await requireAdmin();

  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    include: {
      leaves: {
        orderBy: { startTime: "desc" },
        take: 3,
      },
      doctorAppointments: {
        where: { status: "BOOKED" },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    specialization: doctor.specialization || "General Practice",
    startTime: doctor.startTime || "09:00",
    endTime: doctor.endTime || "17:00",
    slotDurationMinutes: doctor.slotDurationMinutes || 30,
    bookedAppointments: doctor.doctorAppointments.length,
    recentLeaves: doctor.leaves.map((leave) => ({
      id: leave.id,
      date: leave.startTime.toISOString().slice(0, 10),
      reason: leave.reason || "Leave",
    })),
  }));
}

export async function createDoctorProfile(input: DoctorProfileInput) {
  await requireAdmin();
  validateDoctorProfile(input);

  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existing) {
    throw new Error("A user already exists with this email.");
  }

  await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      role: "DOCTOR",
      specialization: input.specialization.trim(),
      startTime: input.startTime,
      endTime: input.endTime,
      slotDurationMinutes: input.slotDurationMinutes,
    },
  });

  return { success: true };
}

export async function updateDoctorProfile(doctorId: string, input: DoctorProfileInput) {
  await requireAdmin();
  validateDoctorProfile(input);

  await prisma.user.update({
    where: { id: doctorId, role: "DOCTOR" },
    data: {
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      specialization: input.specialization.trim(),
      startTime: input.startTime,
      endTime: input.endTime,
      slotDurationMinutes: input.slotDurationMinutes,
    },
  });

  return { success: true };
}

export async function markLeaveForDoctor(doctorId: string, date: string, reason: string) {
  await requireAdmin();

  if (!date) throw new Error("Leave date is required.");

  const leaveDate = new Date(`${date}T00:00:00`);
  if (isNaN(leaveDate.getTime())) {
    throw new Error("Invalid leave date.");
  }

  return markDoctorOnLeave(doctorId, leaveDate, reason || "Doctor leave");
}

export async function getAdminDashboardData() {
  await requireAdmin();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [appointmentsToday, activeDoctors, waitlistSize, recentAppointments] = await Promise.all([
    prisma.appointment.count({
      where: {
        slotTime: { gte: todayStart, lte: todayEnd },
        status: "BOOKED",
      },
    }),
    prisma.user.count({ where: { role: "DOCTOR" } }),
    prisma.waitlist.count(),
    prisma.appointment.findMany({
      where: {
        slotTime: { gte: sevenDaysAgo, lte: todayEnd },
        status: "BOOKED",
      },
      select: { slotTime: true },
    }),
  ]);

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(sevenDaysAgo);
    day.setDate(sevenDaysAgo.getDate() + index);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return {
      name: day.toLocaleDateString(undefined, { weekday: "short" }),
      total: recentAppointments.filter(
        (appointment) => appointment.slotTime >= dayStart && appointment.slotTime <= dayEnd
      ).length,
    };
  });

  return {
    appointmentsToday,
    activeDoctors,
    waitlistSize,
    chartData,
  };
}
