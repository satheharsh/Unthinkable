"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, LogOut, Settings, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back" className="text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2">
          <div className="bg-teal-100 p-1.5 rounded-md">
            <Activity className="h-5 w-5 text-teal-700" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">HealthSync</span>
        </Link>
        </div>

        {status === "loading" ? (
          <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-md"></div>
        ) : session ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-700">{session.user?.name}</span>
              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                {session.user?.role}
              </span>
            </div>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800" aria-label="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })} className="text-slate-500 hover:text-slate-800">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-medium">Sign In</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
