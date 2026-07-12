"use client";

import { motion } from "framer-motion";
import { User, Shield, Bell, FileArchive } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { SecurityForm } from "@/components/settings/security-form";
import { NotificationsForm } from "@/components/settings/notifications-form";
import { HealthVault } from "@/components/settings/health-vault";

export default function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">My Account</h1>
          <p className="text-lg text-slate-500 mt-2">Manage your profile, security, and digital health records.</p>
        </div>

        <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <TabsList className="flex flex-col md:w-64 h-auto bg-transparent p-0 space-y-2 items-stretch justify-start shrink-0">
            <TabsTrigger 
              value="profile" 
              className="justify-start px-4 py-3 text-base data-[state=active]:bg-teal-50 data-[state=active]:text-teal-900 data-[state=active]:shadow-none rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <User className="w-5 h-5 mr-3" />
              Profile Details
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="justify-start px-4 py-3 text-base data-[state=active]:bg-teal-50 data-[state=active]:text-teal-900 data-[state=active]:shadow-none rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Shield className="w-5 h-5 mr-3" />
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="justify-start px-4 py-3 text-base data-[state=active]:bg-teal-50 data-[state=active]:text-teal-900 data-[state=active]:shadow-none rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5 mr-3" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="vault" 
              className="justify-start px-4 py-3 text-base data-[state=active]:bg-teal-50 data-[state=active]:text-teal-900 data-[state=active]:shadow-none rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <FileArchive className="w-5 h-5 mr-3" />
              Health Vault
            </TabsTrigger>
          </TabsList>

          {/* Main Content Area */}
          <div className="flex-1 bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-100 min-h-[600px]">
            <TabsContent value="profile" className="mt-0 outline-none">
              <ProfileForm />
            </TabsContent>
            <TabsContent value="security" className="mt-0 outline-none">
              <SecurityForm />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0 outline-none">
              <NotificationsForm />
            </TabsContent>
            <TabsContent value="vault" className="mt-0 outline-none">
              <HealthVault />
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </div>
  );
}
