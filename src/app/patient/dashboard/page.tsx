"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Video, FileText, Pill } from "lucide-react";
import Link from "next/link";

const upcomingAppointments = [
  { id: "appt_1", doctor: "Dr. Sarah Smith", specialization: "Cardiology", time: "Tomorrow, 09:00 AM", meetLink: "https://meet.google.com/xyz-abcd-efg" }
];

const pastSummaries = [
  { 
    id: "appt_old_1", 
    doctor: "Dr. James Jones", 
    date: "Oct 12, 2023", 
    summary: "Patient presented with mild skin irritation. Prescribed topical cream. Condition is non-serious.",
    medications: [
      { name: "Hydrocortisone 1%", instructions: "Apply to affected area twice daily for 7 days" }
    ],
    actionItems: [
      "Avoid direct sunlight on affected area",
      "Return in 2 weeks if symptoms persist"
    ]
  }
];

export default function PatientDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Patient Portal</h1>
        <p className="text-lg text-muted-foreground mt-2">Manage your appointments, health summaries, and waitlists.</p>
      </div>

      {/* Upcoming Appointments Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-2xl font-semibold flex items-center">
            <Calendar className="mr-2 h-6 w-6 text-primary" />
            Upcoming Appointments
          </h2>
          <Link href="/patient/search">
            <Button variant="outline">Find a Doctor</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {upcomingAppointments.map((appt) => (
            <Card key={appt.id} className="border-primary/20 shadow-sm bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{appt.doctor}</h3>
                    <p className="text-sm font-medium text-primary">{appt.specialization}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {appt.time}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Link href={appt.meetLink} target="_blank">
                    <Button className="w-full sm:w-auto">
                      <Video className="mr-2 h-4 w-4" />
                      Join Telehealth Call
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {upcomingAppointments.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              You have no upcoming appointments.
            </div>
          )}
        </div>
      </section>

      {/* Health Records & Summaries */}
      <section className="space-y-6">
        <div className="border-b pb-2">
          <h2 className="text-2xl font-semibold flex items-center">
            <FileText className="mr-2 h-6 w-6 text-muted-foreground" />
            Past Visit Summaries
          </h2>
        </div>

        <div className="grid gap-6">
          {pastSummaries.map((record) => (
            <Card key={record.id}>
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Visit with {record.doctor}</CardTitle>
                  <span className="text-sm text-muted-foreground">{record.date}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visit Overview</h4>
                  <p className="text-base leading-relaxed">{record.summary}</p>
                </div>

                {record.medications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                      <Pill className="mr-2 h-4 w-4" /> Prescriptions
                    </h4>
                    <ul className="space-y-2">
                      {record.medications.map((med, idx) => (
                        <li key={idx} className="bg-blue-50 border border-blue-100 p-3 rounded-md text-sm text-blue-900 flex flex-col">
                          <span className="font-bold">{med.name}</span>
                          <span className="opacity-90">{med.instructions}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {record.actionItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Follow-up Actions</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm pl-1">
                      {record.actionItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
