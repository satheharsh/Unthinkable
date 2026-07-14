"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Activity, Loader2 } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials");
      } else {
        toast.success("Successfully logged in!");
        
        if (callbackUrl && callbackUrl.startsWith("/")) {
          router.push(callbackUrl);
        } else {
          // Redirect based on role (mock implementation for routing)
          if (email.toLowerCase() === "patient@example.com") router.push("/patient/dashboard");
          else if (email.toLowerCase() === "doctor@example.com") router.push("/doctor/dashboard");
          else if (email.toLowerCase() === "admin@example.com") router.push("/admin/dashboard");
          else router.push("/patient/dashboard");
        }
      }
    } catch (error) {
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (mockEmail: string) => {
    setEmail(mockEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <Activity className="h-8 w-8 text-teal-600" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-slate-800">Welcome Back</CardTitle>
          <p className="text-slate-500">Sign in to access your HealthSync account</p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium text-center">
              <strong>Demo Mode:</strong> Please click one of the buttons below to load a prototype account, then click "Sign In".
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <Input 
                type="email" 
                placeholder="you@example.com" 
                required 
                className="h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                required 
                className="h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full h-12 text-lg font-bold bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-4">
              1. Click a role to load credentials
            </p>
            <div className="grid gap-3">
              <Button type="button" variant="outline" className="border-teal-200 hover:bg-teal-50 hover:text-teal-700" onClick={() => fillCredentials("patient@example.com")}>
                Load Patient Demo
              </Button>
              <Button type="button" variant="outline" className="border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => fillCredentials("doctor@example.com")}>
                Load Doctor Demo
              </Button>
              <Button type="button" variant="outline" className="border-amber-200 hover:bg-amber-50 hover:text-amber-700" onClick={() => fillCredentials("admin@example.com")}>
                Load Admin Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
