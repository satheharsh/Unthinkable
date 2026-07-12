"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Clock, Video } from "lucide-react";

const todaysAppointments = [
  { id: "appt_1", time: "09:00 AM", patientName: "Alice Wonderland", status: "BOOKED" },
  { id: "appt_2", time: "10:00 AM", patientName: "Bob Builder", status: "BOOKED" },
  { id: "appt_3", time: "11:30 AM", patientName: "Charlie Chaplin", status: "ON_HOLD" },
];

export default function DoctorDashboardPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8 max-w-7xl mx-auto"
    >
      <div className="flex items-center space-x-3 mb-10">
        <Calendar className="h-10 w-10 text-teal-600" aria-hidden="true" />
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">My Schedule - Today</h1>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {todaysAppointments.map((appt, index) => (
          <motion.div
            key={appt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`transition-all hover:shadow-lg hover:border-teal-500 ${appt.status === 'ON_HOLD' ? 'opacity-70 bg-slate-50' : ''}`}>
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg flex items-center space-x-2 text-slate-700">
                  <Clock className="h-5 w-5 text-teal-600" aria-hidden="true" />
                  <span>{appt.time}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="font-semibold text-2xl mb-8 text-slate-800">{appt.patientName}</div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                    <span className={`text-sm font-semibold ${appt.status === 'BOOKED' ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {appt.status}
                    </span>
                  </div>
                  {appt.status === 'BOOKED' && (
                    <Link href={`/doctor/appointment/${appt.id}`}>
                      <Button>
                        <Video className="mr-2 h-4 w-4" aria-hidden="true" />
                        View Details
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {todaysAppointments.length === 0 && (
          <div className="text-slate-500 col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-lg">
            No appointments scheduled for today. Enjoy your day!
          </div>
        )}
      </div>
    </motion.div>
  );
}
