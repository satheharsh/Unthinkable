"use client";

import { motion } from "framer-motion";
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-8 space-y-16"
    >
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">Patient Portal</h1>
        <p className="text-xl text-slate-500">Manage your appointments, health summaries, and waitlists.</p>
      </div>

      {/* Upcoming Appointments Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-bold flex items-center text-slate-800">
            <Calendar className="mr-3 h-8 w-8 text-teal-600" aria-hidden="true" />
            Upcoming Appointments
          </h2>
          <Link href="/patient/search">
            <Button variant="outline" size="lg">Find a Doctor</Button>
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {upcomingAppointments.map((appt, index) => (
            <motion.div 
              key={appt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-teal-500/30 shadow-md bg-teal-50/30 transition-all hover:shadow-lg hover:border-teal-500">
                <CardContent className="pt-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{appt.doctor}</h3>
                      <p className="text-base font-medium text-teal-700 mt-1">{appt.specialization}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold bg-teal-100 text-teal-800 px-4 py-2 rounded-full shadow-sm">
                        {appt.time}
                      </span>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <Link href={appt.meetLink} target="_blank">
                      <Button size="lg" className="w-full sm:w-auto font-semibold">
                        <Video className="mr-2 h-5 w-5" aria-hidden="true" />
                        Join Telehealth Call
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {upcomingAppointments.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-lg">
              You have no upcoming appointments.
            </div>
          )}
        </div>
      </section>

      {/* Health Records & Summaries */}
      <section className="space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-bold flex items-center text-slate-800">
            <FileText className="mr-3 h-8 w-8 text-slate-400" aria-hidden="true" />
            Past Visit Summaries
          </h2>
        </div>

        <div className="grid gap-8">
          {pastSummaries.map((record, index) => (
            <motion.div 
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-slate-50 pb-5 border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl text-slate-800">Visit with {record.doctor}</CardTitle>
                    <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">{record.date}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Visit Overview</h4>
                    <p className="text-base text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">{record.summary}</p>
                  </div>

                  {record.medications.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                        <Pill className="mr-2 h-4 w-4" aria-hidden="true" /> Prescriptions
                      </h4>
                      <ul className="space-y-3">
                        {record.medications.map((med, idx) => (
                          <li key={idx} className="bg-teal-50 border border-teal-100 p-4 rounded-lg text-teal-900 flex flex-col">
                            <span className="font-bold text-base">{med.name}</span>
                            <span className="opacity-90 text-sm mt-1">{med.instructions}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {record.actionItems.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Follow-up Actions</h4>
                      <ul className="list-disc list-inside space-y-2 text-base text-slate-700 pl-1">
                        {record.actionItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
