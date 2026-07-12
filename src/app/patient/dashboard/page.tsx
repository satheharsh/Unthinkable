"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Video, FileText, Pill, Clock, Activity, CheckCircle2, ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
      { id: "med_1", name: "Hydrocortisone 1%", instructions: "Apply to affected area twice daily for 7 days" }
    ],
    actionItems: [
      "Avoid direct sunlight on affected area",
      "Return in 2 weeks if symptoms persist"
    ]
  },
  { 
    id: "appt_old_2", 
    doctor: "Dr. Emily Adams", 
    date: "Aug 05, 2023", 
    summary: "Routine checkup. All vitals normal. Patient reported mild seasonal allergies.",
    medications: [
      { id: "med_2", name: "Loratadine 10mg", instructions: "Take one tablet daily as needed for allergies" }
    ],
    actionItems: [
      "Schedule next routine checkup in 1 year"
    ]
  }
];

export default function PatientDashboardPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "medications">("upcoming");
  
  // Modal states
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedPastVisit, setSelectedPastVisit] = useState<typeof pastSummaries[0] | null>(null);

  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const router = useRouter();

  // Medication states
  const [takenMedications, setTakenMedications] = useState<Record<string, boolean>>({});

  const handleMarkTaken = (medId: string) => {
    setTakenMedications(prev => ({ ...prev, [medId]: true }));
    toast.success("Medication marked as taken");
  };

  // Collect all medications from past visits for the medication tab
  const allMedications = pastSummaries.flatMap(visit => visit.medications);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-8 space-y-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">Patient Portal</h1>
          <p className="text-xl text-slate-500">Manage your appointments, health summaries, and prescriptions.</p>
        </div>
        <Link href="/patient/search">
          <Button size="lg" className="bg-teal-600 hover:bg-teal-700 shadow-md h-12 px-6 rounded-full font-bold">
            + Book New Appointment
          </Button>
        </Link>
      </div>

      {/* Custom Tabs Navigation */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-px">
        {(['upcoming', 'past', 'medications'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab === 'upcoming' && 'Upcoming Appointments'}
            {tab === 'past' && 'Past Visits'}
            {tab === 'medications' && 'My Medications'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* UPCOMING TAB */}
        {activeTab === 'upcoming' && (
          <motion.div
            key="upcoming"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {upcomingAppointments.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2">
                {upcomingAppointments.map((appt) => (
                  <Card key={appt.id} className="border-teal-500/30 shadow-md bg-teal-50/30">
                    <CardContent className="pt-8">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800">{appt.doctor}</h3>
                          <p className="text-base font-medium text-teal-700 mt-1">{appt.specialization}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold bg-teal-100 text-teal-800 px-4 py-2 rounded-full shadow-sm flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {appt.time}
                          </span>
                        </div>
                      </div>
                      <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Button 
                          size="lg" 
                          className="flex-1 font-semibold"
                          onClick={() => {
                            if (!isAuthenticated) router.push("/login");
                            else window.open(appt.meetLink, "_blank");
                          }}
                        >
                          <Video className="mr-2 h-5 w-5" aria-hidden="true" />
                          Join Video Call
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="flex-1 font-semibold"
                          onClick={() => setIsRescheduleModalOpen(true)}
                        >
                          Reschedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<Calendar className="h-16 w-16 text-teal-600/50" />} 
                title="No Upcoming Appointments" 
                description="You are all caught up! Book a new appointment to see a doctor."
              />
            )}
          </motion.div>
        )}

        {/* PAST VISITS TAB */}
        {activeTab === 'past' && (
          <motion.div
            key="past"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {pastSummaries.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {pastSummaries.map((record) => (
                  <Card 
                    key={record.id} 
                    className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-teal-500 group"
                    onClick={() => setSelectedPastVisit(record)}
                  >
                    <CardHeader className="bg-slate-50 pb-5 border-b border-slate-100 group-hover:bg-teal-50/50 transition-colors">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl text-slate-800">Visit with {record.doctor}</CardTitle>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-teal-600 transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex items-center text-sm font-medium text-slate-500 mb-4">
                        <Calendar className="mr-2 h-4 w-4" />
                        {record.date}
                      </div>
                      <p className="text-slate-600 line-clamp-2">{record.summary}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<FileText className="h-16 w-16 text-teal-600/50" />} 
                title="No Past Visits" 
                description="Your past visit summaries and doctor notes will appear here."
              />
            )}
          </motion.div>
        )}

        {/* MEDICATIONS TAB */}
        {activeTab === 'medications' && (
          <motion.div
            key="medications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {allMedications.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allMedications.map((med) => {
                  const isTaken = takenMedications[med.id];
                  return (
                    <Card key={med.id} className={cn("transition-all duration-300", isTaken ? "bg-emerald-50/50 border-emerald-200" : "")}>
                      <CardContent className="p-6 space-y-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              <Pill className="h-5 w-5 text-teal-600" />
                              {med.name}
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">{med.instructions}</p>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          {isTaken ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center justify-center w-full py-2.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-sm"
                            >
                              <Check className="h-5 w-5 mr-2" />
                              Taken Today
                            </motion.div>
                          ) : (
                            <Button 
                              onClick={() => handleMarkTaken(med.id)}
                              className="w-full font-semibold"
                            >
                              Mark as Taken
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState 
                icon={<Pill className="h-16 w-16 text-teal-600/50" />} 
                title="No Active Prescriptions" 
                description="You don't have any current medications prescribed."
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      <Modal 
        isOpen={isRescheduleModalOpen} 
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Appointment"
      >
        <div className="space-y-6">
          <p className="text-slate-600">Select a new date and time for your appointment with Dr. Sarah Smith.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-14">Tomorrow, 10:00 AM</Button>
            <Button variant="outline" className="h-14">Tomorrow, 02:00 PM</Button>
            <Button variant="outline" className="h-14">Wed, 09:00 AM</Button>
            <Button variant="outline" className="h-14">Thu, 11:30 AM</Button>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => {
              setIsRescheduleModalOpen(false);
              toast("Reschedule cancelled");
            }}>Cancel</Button>
            <Button onClick={() => {
              setIsRescheduleModalOpen(false);
              toast.success("Appointment rescheduled successfully!");
            }}>Confirm New Time</Button>
          </div>
        </div>
      </Modal>

      {/* Past Visit Summary Modal */}
      <Modal 
        isOpen={!!selectedPastVisit} 
        onClose={() => setSelectedPastVisit(null)}
        title={`Visit with ${selectedPastVisit?.doctor}`}
      >
        {selectedPastVisit && (
          <div className="space-y-8">
            <div className="flex items-center text-sm font-medium text-slate-500 bg-slate-100 w-fit px-3 py-1 rounded-full">
              <Calendar className="mr-2 h-4 w-4" />
              {selectedPastVisit.date}
            </div>
            
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                <Activity className="mr-2 h-4 w-4" /> AI Summary Notes
              </h4>
              <p className="text-base text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                {selectedPastVisit.summary}
              </p>
            </div>

            {selectedPastVisit.medications.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                  <Pill className="mr-2 h-4 w-4" /> Prescriptions
                </h4>
                <ul className="space-y-3">
                  {selectedPastVisit.medications.map((med) => (
                    <li key={med.id} className="bg-teal-50 border border-teal-100 p-4 rounded-lg text-teal-900 flex flex-col">
                      <span className="font-bold text-base">{med.name}</span>
                      <span className="opacity-90 text-sm mt-1">{med.instructions}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedPastVisit.actionItems.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Follow-up Actions
                </h4>
                <ul className="list-disc list-inside space-y-2 text-base text-slate-700 pl-1">
                  {selectedPastVisit.actionItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button onClick={() => setSelectedPastVisit(null)}>Close Summary</Button>
            </div>
          </div>
        )}
      </Modal>

    </motion.div>
  );
}

// Reusable Empty State Component
function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
      <div className="mb-6 p-6 bg-teal-50 rounded-full">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      <Link href="/patient/search">
        <Button size="lg" className="font-semibold shadow-md">
          Book an Appointment
        </Button>
      </Link>
    </div>
  );
}
