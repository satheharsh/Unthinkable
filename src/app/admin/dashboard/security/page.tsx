"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app we'd fetch this from an API endpoint like /api/admin/logs
    // For this prototype, we'll mock some data since we don't have a dedicated API yet
    const mockLogs = [
      {
        id: "1",
        userId: "doctor-1",
        action: "VIEW_PATIENT_RECORD",
        patientId: "patient-1",
        details: "Doctor viewed patient records via API",
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        userId: "admin-1",
        action: "SYSTEM_LOGIN",
        patientId: null,
        details: "Admin logged into the system",
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }
    ];
    
    setLogs(mockLogs);
    setIsLoading(false);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8 max-w-6xl mx-auto"
    >
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 flex items-center">
          <Shield className="mr-4 h-10 w-10 text-teal-600" />
          Security & Audit Logs
        </h1>
        <p className="text-xl text-slate-500">HIPAA-compliant tracking of system access and actions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading logs...</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                      {log.action.includes("VIEW") ? <FileText className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5 text-teal-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{log.action}</p>
                      <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                      <div className="flex space-x-4 mt-2 text-xs text-slate-500">
                        <span>User ID: {log.userId}</span>
                        {log.patientId && <span>Patient ID: {log.patientId}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="mr-1 h-3 w-3" />
                    {format(new Date(log.createdAt), "MMM d, h:mm a")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
