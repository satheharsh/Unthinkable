import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: 'HealthSync',
  description: 'Healthcare Appointment System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800">
        <Providers>
          <Header />
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
