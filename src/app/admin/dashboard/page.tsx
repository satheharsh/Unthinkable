"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { getAdminDashboardData } from "@/actions/admin";

type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData>({
    appointmentsToday: 0,
    activeDoctors: 0,
    waitlistSize: 0,
    chartData: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const dashboard = await getAdminDashboardData();
        setData(dashboard);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8 max-w-7xl mx-auto"
    >
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600">Appointments Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{isLoading ? "..." : data.appointmentsToday}</div>
              <p className="text-sm text-slate-500 mt-1">Booked visits scheduled today</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600">Active Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{isLoading ? "..." : data.activeDoctors}</div>
              <p className="text-sm text-slate-500 mt-1">Registered doctor profiles</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600">Waitlist Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{isLoading ? "..." : data.waitlistSize}</div>
              <p className="text-sm text-slate-500 mt-1">Patients waiting for slots</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-slate-800">Appointments (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="total" fill="currentColor" className="fill-teal-600" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
