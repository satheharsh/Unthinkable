"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

// Mock data
const mockSlots = [
  { id: "slot_1", time: "09:00 AM", status: "AVAILABLE" },
  { id: "slot_2", time: "10:00 AM", status: "BOOKED" },
  { id: "slot_3", time: "11:00 AM", status: "AVAILABLE" },
];

export default function BookingWizardPage({ params }: { params: { doctorId: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading booking wizard...</div>}>
      <BookingWizardContent doctorId={params.doctorId} />
    </Suspense>
  );
}

function BookingWizardContent({ doctorId }: { doctorId: string }) {
  const [step, setStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [isHolding, setIsHolding] = useState(false);
  
  const searchParams = useSearchParams();
  const symptoms = searchParams.get("symptoms") || "No symptoms provided.";

  // Timer logic for Step 2
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleHoldSlot = async () => {
    setIsHolding(true);
    // Simulate DB Slot Hold
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsHolding(false);
    setStep(2);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleConfirm = async () => {
    toast.success("Appointment successfully booked!");
    // Simulate navigation delay for toast to be visible
    setTimeout(() => {
      window.location.href = "/patient/dashboard";
    }, 1500);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-8 pt-16 space-y-8"
    >
      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">Book Appointment</h1>
        <div className="flex items-center space-x-3 text-sm text-slate-500">
          <span className={`${step >= 1 ? 'text-teal-600 font-bold' : ''}`}>1. Select Time</span>
          <span>&gt;</span>
          <span className={`${step >= 2 ? 'text-teal-600 font-bold' : ''}`}>2. Confirm</span>
        </div>
      </div>

      <div className="relative overflow-hidden min-h-[450px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Calendar className="mr-3 h-6 w-6 text-teal-600" aria-hidden="true" />
                    Available Slots Today
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {mockSlots.map((slot) => (
                      <div key={slot.id} className="flex flex-col space-y-3">
                        <Button
                          variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                          className={`w-full ${slot.status === 'BOOKED' ? 'opacity-50' : ''}`}
                          disabled={slot.status === 'BOOKED'}
                          onClick={() => setSelectedSlot(slot)}
                          aria-pressed={selectedSlot?.id === slot.id}
                        >
                          <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
                          {slot.time}
                        </Button>
                        {slot.status === 'BOOKED' && (
                          <Button variant="secondary" size="sm" className="w-full text-xs text-slate-600" onClick={() => toast.success("Joined Waitlist!")}>
                            Join Waitlist
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="pt-8 flex justify-end">
                    <Button size="lg" onClick={handleHoldSlot} disabled={!selectedSlot || isHolding}>
                      {isHolding ? "Securing Slot..." : "Continue"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-teal-500 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-teal-700">
                    <CheckCircle2 className="mr-3 h-6 w-6" aria-hidden="true" />
                    Review Your Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start space-x-4 text-amber-900">
                    <AlertCircle className="h-6 w-6 mt-0.5 flex-shrink-0 text-amber-600" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-lg">Slot Held</p>
                      <p className="text-amber-800 mt-1">We're holding this slot for you. Complete your booking in <strong>{formatTime(countdown)}</strong> or it will be released.</p>
                    </div>
                  </div>

                  <div className="space-y-6 bg-slate-50 border border-slate-100 p-6 rounded-xl">
                    <div>
                      <div className="text-sm font-medium text-slate-500 mb-1">Time Slot</div>
                      <div className="text-xl font-semibold text-slate-800">{selectedSlot?.time}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500 mb-1">Your Symptoms</div>
                      <div className="text-base text-slate-700 leading-relaxed">{symptoms}</div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" size="lg" onClick={handleBack}>Back to Edit</Button>
                    <Button size="lg" onClick={handleConfirm} disabled={countdown === 0}>
                      Confirm Booking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
