"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Search, Stethoscope, BarChart3, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const portals = [
    {
      title: "Patient Portal",
      description: "Search for specialists and book your appointments effortlessly.",
      icon: <Search className="h-8 w-8 text-teal-600" />,
      href: "/patient/search",
      color: "bg-teal-50 border-teal-100",
    },
    {
      title: "Doctor Dashboard",
      description: "Manage your daily schedule, prescribe medications, and use AI to summarize notes.",
      icon: <Stethoscope className="h-8 w-8 text-emerald-600" />,
      href: "/doctor/dashboard",
      color: "bg-emerald-50 border-emerald-100",
    },
    {
      title: "Admin Dashboard",
      description: "Oversee operations, manage doctors, and view platform analytics.",
      icon: <BarChart3 className="h-8 w-8 text-amber-600" />,
      href: "/admin/dashboard",
      color: "bg-amber-50 border-amber-100",
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl space-y-12 py-12"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-teal-200">
            <Activity className="h-10 w-10 text-teal-600" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-800">
            Welcome to HealthSync
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            A modern, intelligent healthcare appointment and management system. Select your portal to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 px-4">
          {portals.map((portal, index) => (
            <motion.div
              key={portal.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link href={portal.href} className="block group h-full">
                <Card className={`h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 ${portal.color}`}>
                  <CardContent className="p-8 flex flex-col items-center text-center space-y-4 h-full">
                    <div className="p-4 bg-white rounded-full shadow-sm">
                      {portal.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">{portal.title}</h2>
                    <p className="text-slate-600 flex-1 leading-relaxed">
                      {portal.description}
                    </p>
                    <div className="w-full pt-4">
                      <Button variant="outline" className="w-full bg-white group-hover:bg-slate-50 transition-colors">
                        Enter Portal
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
