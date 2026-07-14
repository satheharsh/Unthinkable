"use client";

import { use, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generatePostVisitSummary } from "@/actions/llm";
import { getAppointmentDetail } from "@/actions/appointment";
import { AlertCircle, CheckCircle2, Loader2, Video } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type AppointmentDetail = Awaited<ReturnType<typeof getAppointmentDetail>>;

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postVisitSummary, setPostVisitSummary] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    async function loadAppointment() {
      try {
        const detail = await getAppointmentDetail(id);
        setAppointment(detail);
        setNotes(detail.doctorNotes);
        setPostVisitSummary(detail.postVisitSummary);
      } catch (error: any) {
        toast.error(error.message || "Unable to load appointment");
      } finally {
        setIsLoading(false);
      }
    }

    loadAppointment();
  }, [id]);

  useEffect(() => {
    if (notes === "" || notes === appointment?.doctorNotes) return;

    setSaveStatus("saving");
    const timeoutId = setTimeout(() => {
      setSaveStatus("saved");
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [appointment?.doctorNotes, notes]);

  const summaryText = appointment?.preVisitSummary || "";
  const isHighUrgency = /urgency(?:\s+level)?\s*:\s*high/i.test(summaryText) || /\bhigh urgency\b/i.test(summaryText);
  const isMediumUrgency = /urgency(?:\s+level)?\s*:\s*medium/i.test(summaryText) || /\bmedium urgency\b/i.test(summaryText);

  let summaryCardClass = "border-border";
  if (appointment && !appointment.aiSummaryFailed) {
    if (isHighUrgency) summaryCardClass = "border-red-500 shadow-sm shadow-red-100 bg-red-50/20";
    else if (isMediumUrgency) summaryCardClass = "border-yellow-500 shadow-sm shadow-yellow-100 bg-yellow-50/20";
  }

  const handleNotesSubmit = async () => {
    if (!appointment) return;

    setIsSubmitting(true);
    try {
      const result = await generatePostVisitSummary(appointment.id, notes);
      setPostVisitSummary(result);
      setAppointment({ ...appointment, doctorNotes: notes, postVisitSummary: result });
      setSaveStatus("saved");
      toast.success("Summary generated and saved.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate summary. Notes were saved as fallback.");
      setPostVisitSummary(notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 min-h-[70vh] flex items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading appointment...
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="p-8 min-h-[70vh] flex items-center justify-center text-slate-500">
        Appointment not found.
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{appointment.patientName}</h1>
          <p className="text-lg text-muted-foreground mt-1">{appointment.time}</p>
        </div>
        {appointment.meetLink ? (
          <Link href={appointment.meetLink} target="_blank">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Video className="mr-2 h-5 w-5" />
              Join Telehealth
            </Button>
          </Link>
        ) : (
          <Button size="lg" disabled>
            <Video className="mr-2 h-5 w-5" />
            No Meet Link
          </Button>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Pre-Visit Information</h2>

          {appointment.aiSummaryFailed ? (
            <Card className="border-border bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-muted-foreground" />
                  Raw Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed whitespace-pre-wrap">{appointment.symptoms}</p>
                <p className="text-sm text-muted-foreground mt-6 italic bg-muted p-3 rounded-md">
                  AI summary generation timed out or failed. Displaying the patient's exact input.
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
                <p className="text-base leading-relaxed whitespace-pre-wrap">{appointment.preVisitSummary}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-semibold tracking-tight">Post-Visit Notes</h2>
            <span className={`text-sm font-medium transition-opacity ${saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'} ${saveStatus === 'saved' ? 'text-emerald-600' : 'text-slate-400'}`}>
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Ready to generate'}
            </span>
          </div>
          <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <Textarea
                placeholder="Enter consultation notes, prescriptions, and follow-up instructions."
                className="min-h-[200px] text-base resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handleNotesSubmit} disabled={isSubmitting || notes.trim().length < 5} className="w-full sm:w-auto">
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
