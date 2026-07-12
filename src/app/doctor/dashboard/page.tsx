"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";
import { Calendar, Clock, Video, Search, Pill, Check, Power } from "lucide-react";
import { toast } from "sonner";

const initialAppointments = [
  { id: "appt_1", time: "09:00 AM", patientName: "Alice Wonderland", status: "BOOKED" },
  { id: "appt_2", time: "10:00 AM", patientName: "Bob Builder", status: "BOOKED" },
  { id: "appt_3", time: "11:30 AM", patientName: "Charlie Chaplin", status: "ON_HOLD" },
];

export default function DoctorDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [acceptingWalkIns, setAcceptingWalkIns] = useState(false);
  
  const [isPrescribeModalOpen, setIsPrescribeModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string, name: string } | null>(null);

  // Filter appointments
  const filteredAppointments = initialAppointments.filter(appt => 
    appt.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenPrescribe = (id: string, name: string) => {
    setSelectedPatient({ id, name });
    setIsPrescribeModalOpen(true);
  };

  const handlePrescribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Prescription sent to pharmacy.");
    setIsPrescribeModalOpen(false);
    setSelectedPatient(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center space-x-3">
          <Calendar className="h-10 w-10 text-teal-600" aria-hidden="true" />
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">My Schedule - Today</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search patients..."
              className="pl-10 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-teal-500 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button
            onClick={() => setAcceptingWalkIns(!acceptingWalkIns)}
            variant={acceptingWalkIns ? "default" : "outline"}
            className={`rounded-full h-10 px-4 transition-colors ${
              acceptingWalkIns 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Power className="mr-2 h-4 w-4" />
            {acceptingWalkIns ? "Accepting Walk-ins" : "Not Accepting Walk-ins"}
          </Button>
        </div>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredAppointments.map((appt, index) => (
            <motion.div
              key={appt.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`transition-all hover:shadow-lg hover:border-teal-500 ${appt.status === 'ON_HOLD' ? 'opacity-70 bg-slate-50' : ''}`}>
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-lg flex items-center justify-between text-slate-700">
                    <span className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-teal-600" aria-hidden="true" />
                      <span>{appt.time}</span>
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${appt.status === 'BOOKED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {appt.status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="font-semibold text-2xl mb-8 text-slate-800">{appt.patientName}</div>
                  
                  {appt.status === 'BOOKED' && (
                    <div className="flex flex-col gap-3">
                      <Link href={`/doctor/appointment/${appt.id}`} className="w-full">
                        <Button className="w-full">
                          <Video className="mr-2 h-4 w-4" aria-hidden="true" />
                          View Details
                        </Button>
                      </Link>
                      <Button 
                        variant="secondary" 
                        className="w-full bg-teal-50 text-teal-700 hover:bg-teal-100"
                        onClick={() => handleOpenPrescribe(appt.id, appt.patientName)}
                      >
                        <Pill className="mr-2 h-4 w-4" />
                        Quick Prescribe
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredAppointments.length === 0 && (
          <div className="text-slate-500 col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-lg flex flex-col items-center">
            <Search className="h-12 w-12 text-slate-300 mb-4" />
            No appointments found for "{searchQuery}".
          </div>
        )}
      </div>

      <Modal 
        isOpen={isPrescribeModalOpen}
        onClose={() => setIsPrescribeModalOpen(false)}
        title={`Quick Prescribe: ${selectedPatient?.name}`}
      >
        <form onSubmit={handlePrescribeSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medication Name</label>
              <Input required placeholder="e.g. Amoxicillin 500mg" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dosage & Frequency</label>
              <Input required placeholder="e.g. Take 1 tablet twice daily for 7 days" className="w-full" />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => {
              setIsPrescribeModalOpen(false);
              toast("Prescription cancelled");
            }}>Cancel</Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
              <Check className="mr-2 h-4 w-4" />
              Send to Pharmacy
            </Button>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
}
