"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Save, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

const notificationsFormSchema = z.object({
  appointmentEmails: z.boolean().default(false).optional(),
  appointmentSms: z.boolean().default(false).optional(),
  medicationReminders: z.boolean().default(false).optional(),
  marketingEmails: z.boolean().default(false).optional(),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

const defaultValues: Partial<NotificationsFormValues> = {
  appointmentEmails: true,
  appointmentSms: true,
  medicationReminders: true,
  marketingEmails: false,
};

export function NotificationsForm() {
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { isDirty } = form.formState;

  function onSubmit(data: NotificationsFormValues) {
    toast.success("Notification preferences updated!");
    form.reset(data);
  }

  return (
    <div className="space-y-8 relative pb-20">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-teal-100 p-2 rounded-full">
          <Bell className="w-6 h-6 text-teal-700" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-slate-800">Notifications</h3>
          <p className="text-sm text-slate-500">Configure how you receive alerts.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Appointments</h4>
            <FormField
              control={form.control}
              name="appointmentEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4 shadow-sm bg-white">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Email Reminders</FormLabel>
                    <FormDescription>
                      Receive an email 24 hours before your appointment.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Toggle appointment email reminders"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="appointmentSms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4 shadow-sm bg-white">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">SMS Reminders</FormLabel>
                    <FormDescription>
                      Receive a text message 2 hours before your appointment.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Toggle appointment SMS reminders"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 pt-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Health & Medication</h4>
            <FormField
              control={form.control}
              name="medicationReminders"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4 shadow-sm bg-white">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Medication Alerts</FormLabel>
                    <FormDescription>
                      Get push notifications when it's time to take your pills.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Toggle medication alerts"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className={`fixed bottom-6 right-6 transition-all duration-300 ${isDirty ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <Button type="submit" size="lg" className="shadow-lg rounded-full px-6">
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
