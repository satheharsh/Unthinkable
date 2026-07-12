"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Save, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  dob: z.string().min(1, { message: "Date of birth is required." }),
  bloodType: z.string().min(1, { message: "Blood type is required." }),
  height: z.string().min(1, { message: "Height is required." }),
  weight: z.string().min(1, { message: "Weight is required." }),
  emergencyName: z.string().min(2, { message: "Emergency contact name is required." }),
  emergencyPhone: z.string().min(10, { message: "Emergency phone must be at least 10 digits." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// This can come from an API
const defaultValues: Partial<ProfileFormValues> = {
  name: "Jane Patient",
  dob: "1985-06-15",
  bloodType: "O+",
  height: "5'6\"",
  weight: "140 lbs",
  emergencyName: "John Doe",
  emergencyPhone: "(555) 123-4567",
};

export function ProfileForm() {
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { isDirty } = form.formState;

  function onSubmit(data: ProfileFormValues) {
    toast.success("Profile updated successfully!");
    // reset form with new values to clear isDirty state
    form.reset(data);
  }

  const handleAvatarUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success("Profile picture updated!");
    }, 1500);
  };

  return (
    <div className="space-y-8 relative pb-20">
      <div className="flex items-center space-x-6">
        <Avatar className="h-24 w-24 border-2 border-teal-100 cursor-pointer" onClick={handleAvatarUpload}>
          <AvatarImage src="" alt="Profile picture" />
          <AvatarFallback className="text-xl">JP</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-medium text-slate-800">Profile Picture</h3>
          <p className="text-sm text-slate-500 mb-2">Click your avatar to upload a new one.</p>
          <Button variant="outline" size="sm" onClick={handleAvatarUpload} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload New"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bloodType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. O+" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 5'6&quot;" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 140 lbs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-rose-500" />
              Emergency Contact
            </h3>
            <Card className="border-rose-100 bg-rose-50/30 shadow-sm">
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="emergencyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sticky Save Button that appears when dirty */}
          <div className={`fixed bottom-6 right-6 transition-all duration-300 ${isDirty ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <Button type="submit" size="lg" className="shadow-lg rounded-full px-6">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
