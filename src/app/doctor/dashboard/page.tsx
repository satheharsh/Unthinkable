"use client";

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
    <div className="p-8 space-y-8">
      <div className="flex items-center space-x-2">
        <Calendar className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">My Schedule - Today</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {todaysAppointments.map((appt) => (
          <Card key={appt.id} className={\`transition-shadow hover:shadow-md \${appt.status === 'ON_HOLD' ? 'opacity-70' : ''}\`}>
            <CardHeader className="pb-2 border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{appt.time}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="font-medium text-xl mb-6">{appt.patientName}</div>
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Status</span>
                  <span className={\`text-sm font-medium \${appt.status === 'BOOKED' ? 'text-green-600' : 'text-yellow-600'}\`}>
                    {appt.status}
                  </span>
                </div>
                {appt.status === 'BOOKED' && (
                  <Link href={\`/doctor/appointment/\${appt.id}\`}>
                    <Button>
                      <Video className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {todaysAppointments.length === 0 && (
          <div className="text-muted-foreground col-span-full py-12 text-center border-2 border-dashed rounded-lg">
            No appointments scheduled for today. Enjoy your day!
          </div>
        )}
      </div>
    </div>
  );
}
