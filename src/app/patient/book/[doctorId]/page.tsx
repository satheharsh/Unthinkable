"use client";

import { use, useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, CheckCircle2, AlertCircle, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { finalizeBooking, holdSlot } from "@/actions/appointment";
import { processPaymentSimulation } from "@/actions/payment";

type Slot = {
  time: string;
  dateTime: string;
  status: "AVAILABLE" | "BOOKED";
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingWizardPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params);

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading booking wizard...</div>}>
      <BookingWizardContent doctorId={doctorId} />
    </Suspense>
  );
}

function BookingWizardContent({ doctorId }: { doctorId: string }) {
  const [step, setStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [heldAppointmentId, setHeldAppointmentId] = useState("");
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [isHolding, setIsHolding] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSymptoms = searchParams.get("symptoms") || "";
  const [symptoms, setSymptoms] = useState(initialSymptoms);

  useEffect(() => {
    let isActive = true;

    async function loadSlots() {
      setIsLoadingSlots(true);
      setSelectedSlot(null);

      try {
        const response = await fetch(`/api/doctors/${doctorId}/slots?date=${selectedDate}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load slots");
        }

        if (isActive) {
          setSlots(data.slots || []);
        }
      } catch (error: any) {
        if (isActive) {
          setSlots([]);
          toast.error(error.message || "Failed to load available slots");
        }
      } finally {
        if (isActive) {
          setIsLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      isActive = false;
    };
  }, [doctorId, selectedDate]);

  // Timer logic for Step 2
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleHoldSlot = async () => {
    console.log("handleHoldSlot triggered", { selectedSlot, symptoms, step });
    if (!selectedSlot) return;
    
    if (symptoms.trim().length === 0) {
      toast.error("Please describe your symptoms before confirming.");
      return;
    }

    setIsHolding(true);
    const result = await holdSlot({
      doctorId,
      slotTime: selectedSlot.dateTime,
    });

    if (result.success && result.appointmentId) {
      setHeldAppointmentId(result.appointmentId);
      if (result.holdExpiresAt) {
        const secondsLeft = Math.max(
          0,
          Math.floor((new Date(result.holdExpiresAt).getTime() - Date.now()) / 1000)
        );
        setCountdown(secondsLeft);
      } else {
        setCountdown(300);
      }
      setStep(2);
    } else {
      toast.error(result.error || "Unable to hold this slot");
      await refreshSlots();
    }

    setIsHolding(false);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleConfirm = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    // Move to payment step
    setStep(3);
  };

  const handlePaymentSuccess = async () => {
    if (!heldAppointmentId) {
      toast.error("Your slot hold is missing. Please select the slot again.");
      setStep(1);
      return;
    }

    setIsHolding(true);
    
    try {
      const paymentRes = await processPaymentSimulation(4500); // $45.00 copay
      if (!paymentRes.success) {
        toast.error(paymentRes.error || "Payment failed.");
        setIsHolding(false);
        return;
      }

      const res = await finalizeBooking({
        appointmentId: heldAppointmentId,
        symptoms: symptoms.trim(),
      });

      if (res.success) {
        toast.success("Payment successful! Appointment booked.");
        setTimeout(() => {
          router.push("/patient/dashboard");
        }, 1500);
      } else {
        toast.error(res.error || "Failed to finalize booking");
        setIsHolding(false);
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
      setIsHolding(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const refreshSlots = async () => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}/slots?date=${selectedDate}`);
      const data = await response.json();
      if (response.ok) setSlots(data.slots || []);
    } catch {
      // The primary action already shows user-facing feedback.
    }
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
          <span>&gt;</span>
          <span className={`${step >= 3 ? 'text-teal-600 font-bold' : ''}`}>3. Payment</span>
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
                    Available Slots
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                    <div className="space-y-2">
                      <label htmlFor="appointment-date" className="text-sm font-medium text-slate-700">
                        Date
                      </label>
                      <Input
                        id="appointment-date"
                        type="date"
                        min={todayKey()}
                        value={selectedDate}
                        onChange={(event) => setSelectedDate(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="symptoms" className="text-sm font-medium text-slate-700">
                        Symptoms
                      </label>
                      <Textarea
                        id="symptoms"
                        value={symptoms}
                        onChange={(event) => setSymptoms(event.target.value)}
                        placeholder="Describe what you are experiencing before confirming the appointment."
                        className="min-h-[96px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {isLoadingSlots ? (
                      <div className="col-span-full py-12 text-center text-slate-500">
                        Loading available slots...
                      </div>
                    ) : slots.length > 0 ? (
                      slots.map((slot) => (
                      <div key={slot.dateTime} className="flex flex-col space-y-3">
                        <Button
                          variant={selectedSlot?.dateTime === slot.dateTime ? "default" : "outline"}
                          className={`w-full ${slot.status === 'BOOKED' ? 'opacity-50' : ''}`}
                          disabled={slot.status === 'BOOKED'}
                          onClick={() => setSelectedSlot(slot)}
                          aria-pressed={selectedSlot?.dateTime === slot.dateTime}
                        >
                          <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
                          {slot.time}
                        </Button>
                      </div>
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center text-slate-500">
                        No available slots for this date.
                      </div>
                    )}
                  </div>
                  <div className="pt-8 flex justify-end">
                    <Button size="lg" onClick={handleHoldSlot} disabled={!selectedSlot || isHolding || symptoms.trim().length < 5}>
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
                      <div className="text-base text-slate-700 leading-relaxed">{symptoms.trim()}</div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" size="lg" onClick={handleBack}>Back to Edit</Button>
                    <Button type="button" size="lg" onClick={handleConfirm} disabled={countdown === 0 || symptoms.trim().length === 0}>
                      Proceed to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-teal-500 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CreditCard className="w-32 h-32" />
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Lock className="mr-3 h-6 w-6 text-teal-600" aria-hidden="true" />
                    Secure Copay Checkout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-4 text-amber-900 mb-6">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-600" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-sm">Slot Still Held</p>
                      <p className="text-amber-800 text-sm mt-1">Complete payment in <strong>{formatTime(countdown)}</strong>.</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
                      <span className="text-slate-600 font-medium">Consultation Copay</span>
                      <span className="text-xl font-bold text-slate-800">$45.00</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-teal-100 bg-white rounded-lg flex items-center justify-center space-x-2 text-slate-500">
                        <CreditCard className="h-5 w-5" />
                        <span>Secure copay checkout</span>
                      </div>
                      <Button size="lg" className="w-full bg-slate-800 hover:bg-slate-900" onClick={handlePaymentSuccess} disabled={countdown === 0 || isHolding}>
                        {isHolding ? "Processing..." : "Pay $45.00 securely"}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-center text-slate-500 mt-4 flex items-center justify-center">
                    <Lock className="w-3 h-3 mr-1" /> Payments processed securely by Stripe
                  </p>

                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
