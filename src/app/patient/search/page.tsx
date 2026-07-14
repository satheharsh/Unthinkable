"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search, UserCircle, Star, X, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { analyzeSymptoms, TriageResult } from "@/actions/triage";

const mockDoctors = [
  { id: "1", name: "Dr. Sarah Smith", specialization: "Cardiology", rating: 4.9, availableSlots: 3 },
  { id: "2", name: "Dr. James Jones", specialization: "Dermatology", rating: 4.7, availableSlots: 0 },
  { id: "3", name: "Dr. Emily Adams", specialization: "Pediatrics", rating: 4.8, availableSlots: 5 },
  { id: "4", name: "Dr. Michael Chen", specialization: "Neurology", rating: 4.6, availableSlots: 2 },
  { id: "5", name: "Dr. William Taylor", specialization: "General Practice", rating: 4.9, availableSlots: 4 },
  { id: "6", name: "Dr. Jessica Davis", specialization: "Orthopedics", rating: 4.8, availableSlots: 1 },
];

export default function DoctorSearchPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  
  // Doctor search state (Step 2)
  const [searchTerm, setSearchTerm] = useState("");
  const [recommendedSpecialty, setRecommendedSpecialty] = useState<string | null>(null);
  
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const router = useRouter();

  const handleAnalyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeSymptoms(symptoms);
      setTriageResult(result);
      setRecommendedSpecialty(result.recommendedSpecialty);
      setStep(2);
    } catch (error) {
      console.error("Failed to analyze symptoms", error);
      // Fallback
      setRecommendedSpecialty("General Practice");
      setStep(2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSkipToSearch = () => {
    setRecommendedSpecialty(null);
    setStep(2);
  };

  const clearSpecialtyFilter = () => {
    setRecommendedSpecialty(null);
  };

  const filteredDoctors = mockDoctors.filter((doc) => {
    const matchesSearch = 
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (recommendedSpecialty) {
      return matchesSearch && doc.specialization.toLowerCase() === recommendedSpecialty.toLowerCase();
    }
    
    return matchesSearch;
  });

  const handleBookClick = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    const query = symptoms ? `?symptoms=${encodeURIComponent(symptoms)}` : '';
    router.push(`/patient/book/${docId}${query}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-5xl mx-auto p-8 space-y-8"
    >
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">
          {step === 1 ? "What brings you in today?" : "Find Your Specialist"}
        </h1>
        <p className="text-xl text-slate-500">
          {step === 1 
            ? "Describe your symptoms and we'll match you with the right specialist." 
            : "Book appointments effortlessly with top healthcare professionals."}
        </p>
      </div>

      <div className="relative overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="shadow-lg border-teal-100">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                  <CardTitle className="text-xl text-slate-800">Symptom Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <label htmlFor="symptoms" className="text-sm font-medium text-slate-700">
                      Describe your symptoms in detail:
                    </label>
                    <Textarea 
                      id="symptoms"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="e.g., I've been experiencing a severe headache and mild dizziness for the past 2 days..."
                      className="min-h-[160px] text-base resize-none focus-visible:ring-teal-500"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={handleSkipToSearch}
                      className="flex-1"
                    >
                      Skip & Browse Doctors
                    </Button>
                    <Button 
                      size="lg" 
                      onClick={handleAnalyzeSymptoms} 
                      disabled={!symptoms.trim() || isAnalyzing}
                      className="flex-1 bg-teal-600 hover:bg-teal-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Find Specialists
                        </>
                      )}
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
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {recommendedSpecialty && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center text-teal-800">
                    <Sparkles className="h-5 w-5 mr-3 text-teal-600" />
                    <span>
                      We've matched you with <strong className="font-bold">{recommendedSpecialty}</strong> specialists based on your symptoms.
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearSpecialtyFilter} className="text-teal-700 hover:text-teal-900 hover:bg-teal-100">
                    <X className="h-4 w-4 mr-1" />
                    Clear Filter
                  </Button>
                </div>
              )}

              <div className="relative max-w-2xl mx-auto shadow-sm rounded-xl">
                <label htmlFor="search-doctors" className="sr-only">Search Doctors</label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <Input
                  id="search-doctors"
                  className="pl-12 h-14 text-lg border-slate-200 rounded-xl focus-visible:ring-teal-500"
                  placeholder="Search by specialization or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                {filteredDoctors.map((doc, index) => (
                  <motion.div 
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="transition-all hover:shadow-lg hover:border-teal-500 h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <UserCircle className="h-12 w-12 text-slate-400" aria-hidden="true" />
                        <div>
                          <CardTitle className="text-xl text-slate-800">{doc.name}</CardTitle>
                          <p className="text-sm font-medium text-teal-600">{doc.specialization}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-end">
                        <div className="flex justify-between items-end mt-6">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-amber-600 font-medium">
                              <Star className="h-4 w-4 mr-1 fill-current" aria-hidden="true" />
                              {doc.rating} Ratings
                            </div>
                            <div className="text-sm">
                              {doc.availableSlots > 0 
                                ? <span className="text-emerald-600 font-medium">{doc.availableSlots} slots available today</span>
                                : <span className="text-amber-500 font-medium">Waitlist available</span>}
                            </div>
                          </div>
                          <Button 
                            size="lg"
                            variant={doc.availableSlots > 0 ? "default" : "secondary"}
                            onClick={(e) => handleBookClick(e, doc.id)}
                            className={doc.availableSlots > 0 ? "bg-teal-600 hover:bg-teal-700" : ""}
                          >
                            {doc.availableSlots > 0 ? "Book Appointment" : "View Schedule"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {filteredDoctors.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-500 text-lg">
                    No {recommendedSpecialty ? recommendedSpecialty : ''} doctors found matching "{searchTerm}".
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
