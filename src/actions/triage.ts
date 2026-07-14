"use server";

import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  : null;

const LLM_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("LLM Timeout")), ms)
    ),
  ]);
}

function mapSymptomToSpecialty(symptomText: string): string {
  const text = symptomText.toLowerCase();

  if (
    text.includes("chest pain") ||
    text.includes("heart") ||
    text.includes("palpitations")
  ) {
    return "Cardiology";
  }

  if (
    text.includes("headache") ||
    text.includes("migraine") ||
    text.includes("dizziness")
  ) {
    return "Neurology";
  }

  if (
    text.includes("skin") ||
    text.includes("rash") ||
    text.includes("itch") ||
    text.includes("acne")
  ) {
    return "Dermatology";
  }

  if (
    text.includes("child") ||
    text.includes("baby") ||
    text.includes("kid")
  ) {
    return "Pediatrics";
  }

  if (
    text.includes("bone") ||
    text.includes("joint") ||
    text.includes("muscle") ||
    text.includes("fracture")
  ) {
    return "Orthopedics";
  }

  return "General Practice";
}

function inferUrgency(symptomText: string): "Low" | "Medium" | "High" {
  const text = symptomText.toLowerCase();

  if (
    text.includes("chest pain") ||
    text.includes("heart attack") ||
    text.includes("stroke") ||
    text.includes("unconscious") ||
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

function fallbackQuestions() {
  return [
    "When did the symptoms start, and have they changed over time?",
    "What makes the symptoms better or worse?",
    "Are there related symptoms, medications, allergies, or prior conditions to consider?",
  ];
}

export type TriageResult = {
  urgencyLevel: string;
  chiefComplaint: string;
  threeQuestions: string[];
  recommendedSpecialty: string;
};

export async function analyzeSymptoms(
  symptoms: string
): Promise<TriageResult> {
  if (!symptoms.trim()) {
    throw new Error("Symptoms cannot be empty");
  }

  // No API key? Use fallback immediately.
  if (!client) {
    return {
      urgencyLevel: inferUrgency(symptoms),
      chiefComplaint: symptoms,
      threeQuestions: fallbackQuestions(),
      recommendedSpecialty: mapSymptomToSpecialty(symptoms),
    };
  }

  try {
    const completion = withTimeout(
      client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a medical triage assistant.

CRITICAL MEDICAL EMERGENCY TRIAGE RULE:
If the patient mentions 'heart attack', 'chest pain', 'shortness of breath', 'stroke', or 'unconscious', the urgency MUST be returned as 'High' regardless of other input.

Return ONLY valid JSON with this exact schema:

{
  "urgencyLevel": "Low | Medium | High",
  "chiefComplaint": "string",
  "threeQuestions": ["q1","q2","q3"],
  "recommendedSpecialty": "string"
}
`,
          },
          {
            role: "user",
            content: symptoms,
          },
        ],
        response_format: {
          type: "json_object",
        },
      }),
      LLM_TIMEOUT_MS
    );

    const response = await completion;

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty LLM response");
    }

    const parsed = JSON.parse(content) as Partial<TriageResult>;

    return {
      urgencyLevel: parsed.urgencyLevel ?? inferUrgency(symptoms),
      chiefComplaint: parsed.chiefComplaint ?? symptoms,
      threeQuestions: parsed.threeQuestions ?? fallbackQuestions(),
      recommendedSpecialty:
        parsed.recommendedSpecialty ??
        mapSymptomToSpecialty(symptoms),
    };
  } catch (err) {
    console.error("LLM failed:", err);

    return {
      urgencyLevel: inferUrgency(symptoms),
      chiefComplaint: symptoms,
      threeQuestions: fallbackQuestions(),
      recommendedSpecialty: mapSymptomToSpecialty(symptoms),
    };
  }
}
