"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Activity } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    toast.success("Successfully logged in!");
    router.back(); // Redirect back to wherever they were
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <Activity className="h-8 w-8 text-teal-600" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-slate-800">Welcome Back</CardTitle>
          <p className="text-slate-500">Sign in to access your HealthSync account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <Input type="email" placeholder="you@example.com" required className="h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <Input type="password" placeholder="••••••••" required className="h-12" />
            </div>
            <Button type="submit" size="lg" className="w-full h-12 text-lg font-bold">
              Sign In
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              For this demo, any email/password will work.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
