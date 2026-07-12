import { z } from 'zod';

export const PreVisitSummarySchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  rawSymptoms: z.string().min(5, "Symptoms must be at least 5 characters long").max(3000),
});

export const PostVisitSummarySchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  doctorNotes: z.string().min(5, "Notes must be at least 5 characters long").max(5000),
});

export const MarkLeaveSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  date: z.date({
    required_error: "A valid date is required.",
  }),
  reason: z.string().min(3).max(500),
});

export const BookAppointmentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  slotTime: z.date({
    required_error: "A valid slot time is required.",
  }),
});
