"use server";

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
});

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
 * Fallback helper function to map raw symptom text to a recommended specialty.
 * Used if the LLM fails or is unsure.
 */
function mapSymptomToSpecialty(symptomText: string): string {
  const text = symptomText.toLowerCase();
  
  if (text.includes('chest pain') || text.includes('heart') || text.includes('palpitations')) {
    return 'Cardiology';
  }
  if (text.includes('headache') || text.includes('migraine') || text.includes('dizziness')) {
    return 'Neurology';
  }
  if (text.includes('skin') || text.includes('rash') || text.includes('itch') || text.includes('acne')) {
    return 'Dermatology';
  }
  if (text.includes('child') || text.includes('baby') || text.includes('kid')) {
    return 'Pediatrics';
  }
  if (text.includes('bone') || text.includes('joint') || text.includes('muscle') || text.includes('fracture')) {
    return 'Orthopedics';
  }
  
  return 'General Practice';
}

export type TriageResult = {
  urgencyLevel: string;
  chiefComplaint: string;
  threeQuestions: string[];
  recommendedSpecialty: string;
};

/**
 * Analyzes patient symptoms using LLM and returns structured JSON output.
 */
export async function analyzeSymptoms(symptoms: string): Promise<TriageResult> {
  if (!symptoms || symptoms.trim() === '') {
    throw new Error("Symptoms cannot be empty");
  }

  try {
    const completionPromise = openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        { 
          role: 'system', 
          content: `You are a medical triage assistant. Analyze the symptoms and return a JSON object with exactly these fields:
- "urgencyLevel": (e.g., Low, Medium, High)
- "chiefComplaint": (A short summary of the main issue)
- "threeQuestions": (An array of 3 clarifying questions a doctor would ask)
- "recommendedSpecialty": (e.g., Neurology, Cardiology, General Practice, Dermatology). If unsure, default to 'General Practice'.` 
        },
        { role: 'user', content: symptoms }
      ],
    });

    const response = await withTimeout(completionPromise, LLM_TIMEOUT_MS);
    const content = response.choices[0]?.message?.content;
    
    if (!content) throw new Error("Empty response from LLM");

    const parsed = JSON.parse(content) as TriageResult;
    
    // Ensure all required fields exist
    if (!parsed.recommendedSpecialty) {
      parsed.recommendedSpecialty = mapSymptomToSpecialty(symptoms);
    }
    if (!parsed.urgencyLevel) parsed.urgencyLevel = 'Low';
    if (!parsed.chiefComplaint) parsed.chiefComplaint = symptoms;
    if (!parsed.threeQuestions) parsed.threeQuestions = [];

    return parsed;
  } catch (error) {
    console.error('LLM Symptom Analysis failed, using fallback:', error);
    
    // Fallback logic
    return {
      urgencyLevel: 'Unknown',
      chiefComplaint: symptoms,
      threeQuestions: [],
      recommendedSpecialty: mapSymptomToSpecialty(symptoms)
    };
  }
}
