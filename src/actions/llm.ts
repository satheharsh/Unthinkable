"use server";

import "server-only";

import OpenAI from "openai";
import prisma from "@/lib/prisma";
import {
  PreVisitSummarySchema,
  PostVisitSummarySchema,
} from "@/lib/validations";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  : null;

const LLM_TIMEOUT_MS = 15000;

type MedicationScheduleItem = {
  id: string;
  name: string;
  instructions: string;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("LLM Request Timed Out")), ms)
    ),
  ]);
}

async function summarize(text: string, systemPrompt: string): Promise<string> {
  if (!client) {
    return text;
  }

  const response = await withTimeout(
    client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
    }),
    LLM_TIMEOUT_MS
  );

  return response.choices?.[0]?.message?.content?.trim() || text;
}

function inferUrgency(symptoms: string) {
  const text = symptoms.toLowerCase();

  if (
    text.includes("chest pain") ||
    text.includes("shortness of breath") ||
    text.includes("faint") ||
    text.includes("severe") ||
    text.includes("high fever")
  ) {
    return "High";
  }

  if (
    text.includes("fever") ||
    text.includes("pain") ||
    text.includes("dizziness") ||
    text.includes("vomit") ||
    text.includes("rash")
  ) {
    return "Medium";
  }

  return "Low";
}

function fallbackPreVisitSummary(symptoms: string) {
  const urgency = inferUrgency(symptoms);

  return [
    `Urgency level: ${urgency}`,
    `Chief complaint: ${symptoms}`,
    "Suggested questions for the doctor:",
    "1. When did the symptoms start, and have they changed over time?",
    "2. What makes the symptoms better or worse?",
    "3. Are there related symptoms, medications, allergies, or prior conditions to consider?",
  ].join("\n");
}

function fallbackPostVisitSummary(doctorNotes: string) {
  return [
    "Visit summary:",
    doctorNotes,
    "",
    "Medication schedule:",
    "Follow the prescription instructions provided by your doctor.",
    "",
    "Follow-up steps:",
    "Contact the clinic if symptoms worsen or if you have questions about the care plan.",
  ].join("\n");
}

function extractMedicationSchedule(notes: string): MedicationScheduleItem[] {
  const medicationLines = notes
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) =>
      /\b(mg|mcg|tablet|capsule|daily|twice|once|dose|doses|before meals|after meals|prescrib|take)\b/i.test(line)
    );

  return medicationLines.map((line, index) => {
    const cleaned = line.replace(/^[-*\d.)\s]+/, "");
    const [namePart, ...rest] = cleaned.split(/:|-|,/);
    const name = namePart.trim() || `Medication ${index + 1}`;
    const instructions = rest.join(",").trim() || cleaned;

    return {
      id: `med-${index + 1}`,
      name,
      instructions,
    };
  });
}

/* ---------------- PRE VISIT ---------------- */

export async function generatePreVisitSummary(
  appointmentId: string,
  rawSymptoms: string
) {
  const parsed = PreVisitSummarySchema.safeParse({
    appointmentId,
    rawSymptoms,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  try {
    let summary = fallbackPreVisitSummary(rawSymptoms);

    if (client) {
      summary = await summarize(
        `Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: ${rawSymptoms}`,
        "You are a careful medical triage assistant. Keep the output concise and clinically useful for the doctor. Do not diagnose."
      );
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        symptoms: rawSymptoms,
        preVisitSummary: summary,
        aiSummaryFailed: false,
      },
    });

    return summary;
  } catch (error: unknown) {
    console.error("Pre-visit summary failed:", error);
    const fallback = fallbackPreVisitSummary(rawSymptoms);

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        symptoms: rawSymptoms,
        preVisitSummary: fallback,
        aiSummaryFailed: true,
      },
    });

    return fallback;
  }
}

/* ---------------- POST VISIT ---------------- */

export async function generatePostVisitSummary(
  appointmentId: string,
  doctorNotes: string
) {
  const parsed = PostVisitSummarySchema.safeParse({
    appointmentId,
    doctorNotes,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  try {
    let summary = fallbackPostVisitSummary(doctorNotes);

    if (client) {
      summary = await summarize(
        `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: ${doctorNotes}`,
        "You are a medical assistant. Write clearly for a patient, avoid unexplained jargon, and include medication schedule and follow-up steps when present."
      );
    }

    const medicationSchedule = extractMedicationSchedule(`${doctorNotes}\n${summary}`);

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        doctorNotes,
        postVisitSummary: summary,
        aiSummaryFailed: false,
      },
    });

    await prisma.lLMSummary.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        summaryText: summary,
        medicationSchedule,
      },
      update: {
        summaryText: summary,
        medicationSchedule,
      },
    });

    return summary;
  } catch (error: unknown) {
    console.error("Post-visit summary failed:", error);
    const fallback = fallbackPostVisitSummary(doctorNotes);
    const medicationSchedule = extractMedicationSchedule(doctorNotes);

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        doctorNotes,
        postVisitSummary: fallback,
        aiSummaryFailed: true,
      },
    });

    await prisma.lLMSummary.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        summaryText: fallback,
        medicationSchedule,
      },
      update: {
        summaryText: fallback,
        medicationSchedule,
      },
    });

    return fallback;
  }
}
