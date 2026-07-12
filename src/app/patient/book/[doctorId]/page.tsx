"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Mock data
const mockSlots = [
  { id: "slot_1", time: "09:00 AM", status: "AVAILABLE" },
  { id: "slot_2", time: "10:00 AM", status: "BOOKED" },
  { id: "slot_3", time: "11:00 AM", status: "AVAILABLE" },
];

export default function BookingWizardPage({ params }: { params: { doctorId: string } }) {
  const [step, setStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [symptoms, setSymptoms] = useState("");
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [isHolding, setIsHolding] = useState(false);

  // Timer logic for Step 3
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 3 && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleHoldSlot = async () => {
    setIsHolding(true);
    // Simulate DB Slot Hold (Phase 1)
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsHolding(false);
    handleNext(); // Go to step 3
  };

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
    <div className="max-w-3xl mx-auto p-8 pt-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Book Appointment</h1>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span className={`${step >= 1 ? 'text-primary font-medium' : ''}`}>1. Select Time</span>
          <span>&gt;</span>
          <span className={`${step >= 2 ? 'text-primary font-medium' : ''}`}>2. Intake Form</span>
          <span>&gt;</span>
          <span className={`${step >= 3 ? 'text-primary font-medium' : ''}`}>3. Confirm</span>
        </div>
      </div>

      <div className="relative overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-primary" />
                    Available Slots Today
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {mockSlots.map((slot) => (
                      <div key={slot.id} className="flex flex-col space-y-2">
                        <Button
                          variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                          className={`w-full ${slot.status === 'BOOKED' ? 'opacity-50' : ''}`}
                          disabled={slot.status === 'BOOKED'}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {slot.time}
                        </Button>
                        {slot.status === 'BOOKED' && (
                          <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => toast.success("Joined Waitlist!")}>
                            Join Waitlist
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 flex justify-end">
                    <Button onClick={handleNext} disabled={!selectedSlot}>
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Symptom Intake</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Please describe the reason for your visit. This helps the doctor prepare beforehand.
                  </p>
                  <Textarea
                    placeholder="E.g., I have been experiencing a mild fever and headache for the past 2 days..."
                    className="min-h-[150px]"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                  <div className="pt-6 flex justify-between">
                    <Button variant="outline" onClick={handleBack}>Back</Button>
                    <Button onClick={handleHoldSlot} disabled={!symptoms.trim() || isHolding}>
                      {isHolding ? "Securing Slot..." : "Review & Book"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-primary/50 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center text-primary">
                    <CheckCircle2 className="mr-2 h-6 w-6" />
                    Review Your Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3 text-yellow-800">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Slot Held</p>
                      <p className="text-sm">We're holding this slot for you. Complete your booking in <strong>{formatTime(countdown)}</strong> or it will be released.</p>
                    </div>
                  </div>

                  <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Time Slot</div>
                      <div className="text-lg">{selectedSlot?.time}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Your Symptoms</div>
                      <div className="text-sm">{symptoms}</div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handleBack}>Back to Edit</Button>
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
    </div>
  );
}
