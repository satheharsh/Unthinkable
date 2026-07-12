"use server";

import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { PreVisitSummarySchema, PostVisitSummarySchema } from '@/lib/validations';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const prisma = new PrismaClient();

const LLM_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('LLM Timeout')), ms)
    )
  ]);
}

/**
 * Generates a summary of the patient's symptoms before the visit.
 * If the LLM call fails or times out, it saves the raw symptoms and sets the aiSummaryFailed flag to true.
 */
export async function generatePreVisitSummary(appointmentId: string, rawSymptoms: string) {
  const parsed = PreVisitSummarySchema.safeParse({ appointmentId, rawSymptoms });
  if (!parsed.success) {
    throw new Error("Validation Error: " + parsed.error.errors[0].message);
  }

  try {
    const completionPromise = openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a medical assistant. Summarize the patient symptoms concisely.' },
        { role: 'user', content: rawSymptoms }
      ],
    });

    const response = await withTimeout(completionPromise, LLM_TIMEOUT_MS);
    const summary = response.choices[0]?.message?.content || rawSymptoms;

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        symptoms: rawSymptoms,
        aiSummaryFailed: false,
        llmSummary: {
          upsert: {
            create: { summaryText: summary },
            update: { summaryText: summary }
          }
        }
      }
    });

    return summary;
  } catch (error) {
    console.error('LLM Pre-Visit Summary failed, falling back to raw notes:', error);
    
    // Fallback: update appointment with the flag indicating AI summary failure
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        symptoms: rawSymptoms,
        aiSummaryFailed: true,
      }
    });
    
    return rawSymptoms;
  }
}

/**
 * Generates a structured post-visit summary from the doctor's raw notes.
 * If the LLM call fails or times out, it stores the raw notes as the summary and flags the failure.
 */
export async function generatePostVisitSummary(appointmentId: string, doctorNotes: string) {
  const parsed = PostVisitSummarySchema.safeParse({ appointmentId, doctorNotes });
  if (!parsed.success) {
    throw new Error("Validation Error: " + parsed.error.errors[0].message);
  }

  try {
    const completionPromise = openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a medical assistant. Create a structured post-visit summary from the doctor\\'s notes.' },
        { role: 'user', content: doctorNotes }
      ],
    });

    const response = await withTimeout(completionPromise, LLM_TIMEOUT_MS);
    const summary = response.choices[0]?.message?.content || doctorNotes;

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        aiSummaryFailed: false,
        llmSummary: {
          upsert: {
            create: { summaryText: summary },
            update: { summaryText: summary }
          }
        }
      }
    });

    return summary;
  } catch (error) {
    console.error('LLM Post-Visit Summary failed:', error);
    
    // Flag the appointment as AI summary failed and save the raw notes
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { aiSummaryFailed: true }
    });
    
    await prisma.lMSummary.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        summaryText: doctorNotes,
      },
      update: {
        summaryText: doctorNotes,
      }
    });
    
    return doctorNotes;
  }
}
