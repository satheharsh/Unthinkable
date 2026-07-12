"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Activity, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
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
        
        // Redirect based on role (mock implementation for routing)
        if (email.toLowerCase() === "patient@example.com") router.push("/patient/dashboard");
        else if (email.toLowerCase() === "doctor@example.com") router.push("/doctor/dashboard");
        else if (email.toLowerCase() === "admin@example.com") router.push("/admin/dashboard");
        else router.push("/patient/dashboard");
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-4">
              Prototype Test Accounts
            </p>
            <div className="grid gap-2">
              <Button variant="outline" size="sm" onClick={() => fillCredentials("patient@example.com")}>
                Load Patient Demo
              </Button>
              <Button variant="outline" size="sm" onClick={() => fillCredentials("doctor@example.com")}>
                Load Doctor Demo
              </Button>
              <Button variant="outline" size="sm" onClick={() => fillCredentials("admin@example.com")}>
                Load Admin Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
