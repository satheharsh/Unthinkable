"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generatePostVisitSummary } from "@/actions/llm";
import { AlertCircle, CheckCircle2, Video } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Mock data representing what a Server Component would fetch
const mockAppointment = {
  id: "appt_1",
  patientName: "Alice Wonderland",
  time: "09:00 AM",
  meetLink: "https://meet.google.com/abc-defg-hij",
  aiSummaryFailed: false, // Toggle this to true to test the raw fallback
  symptoms: "Patient complains of severe headache, photophobia, and slight fever since yesterday.",
  llmSummary: "Patient presents with acute cephalalgia, photophobia, and low-grade fever. [URGENCY: HIGH]",
};

export default function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postVisitSummary, setPostVisitSummary] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (notes === "") return;
    
    setSaveStatus("saving");
    const timeoutId = setTimeout(() => {
      // Mock API call to save notes
      setSaveStatus("saved");
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [notes]);

  // Determine urgency from the AI Summary text (mock implementation)
  const isHighUrgency = mockAppointment.llmSummary?.includes("URGENCY: HIGH");
  const isMediumUrgency = mockAppointment.llmSummary?.includes("URGENCY: MEDIUM");

  let summaryCardClass = "border-border";
  if (!mockAppointment.aiSummaryFailed) {
    if (isHighUrgency) summaryCardClass = "border-red-500 shadow-sm shadow-red-100 bg-red-50/20";
    else if (isMediumUrgency) summaryCardClass = "border-yellow-500 shadow-sm shadow-yellow-100 bg-yellow-50/20";
  }

  const handleNotesSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await generatePostVisitSummary(mockAppointment.id, notes);
      setPostVisitSummary(result);
      toast.success("Summary generated successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to contact AI service. Notes saved in raw format.");
      setPostVisitSummary(notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{mockAppointment.patientName}</h1>
          <p className="text-lg text-muted-foreground mt-1">Today at {mockAppointment.time}</p>
        </div>
        <Link href={mockAppointment.meetLink} target="_blank">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Video className="mr-2 h-5 w-5" />
            Join Telehealth
          </Button>
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Pre-Visit Information */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Pre-Visit Information</h2>
          
          {mockAppointment.aiSummaryFailed ? (
            <Card className="border-border bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-muted-foreground" />
                  Raw Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed">{mockAppointment.symptoms}</p>
                <p className="text-sm text-muted-foreground mt-6 italic bg-muted p-3 rounded-md">
                  AI Summary generation timed out or failed. Displaying the patient's exact input.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className={`border-2 transition-colors ${summaryCardClass}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>AI Pre-Visit Summary</span>
                  {isHighUrgency && <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">HIGH URGENCY</span>}
                  {isMediumUrgency && <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full border border-yellow-200">MEDIUM URGENCY</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed">{mockAppointment.llmSummary}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Post-Visit Actions */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-semibold tracking-tight">Post-Visit Notes</h2>
            <span className={`text-sm font-medium transition-opacity ${saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'} ${saveStatus === 'saved' ? 'text-emerald-600' : 'text-slate-400'}`}>
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'All changes saved'}
            </span>
          </div>
          <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <Textarea 
                placeholder="Enter your raw consultation notes here. The AI will structure them for the final record."
                className="min-h-[200px] text-base resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handleNotesSubmit} disabled={isSubmitting || !notes} className="w-full sm:w-auto">
                  {isSubmitting ? "Structuring..." : "Save & Generate AI Summary"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {postVisitSummary && (
            <Card className="mt-6 border-green-200 bg-green-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center text-green-800">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Structured Post-Visit Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-900 whitespace-pre-wrap">{postVisitSummary}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
