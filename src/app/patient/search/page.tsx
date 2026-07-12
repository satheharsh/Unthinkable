"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

const mockDoctors = [
  { id: "1", name: "Dr. Sarah Smith", specialization: "Cardiology", rating: 4.9, availableSlots: 3 },
  { id: "2", name: "Dr. James Jones", specialization: "Dermatology", rating: 4.7, availableSlots: 0 },
  { id: "3", name: "Dr. Emily Adams", specialization: "Pediatrics", rating: 4.8, availableSlots: 5 },
  { id: "4", name: "Dr. Michael Chen", specialization: "Cardiology", rating: 4.6, availableSlots: 2 },
];

export default function DoctorSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Mock network request delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredDoctors = mockDoctors.filter((doc) =>
    doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBookClick = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      router.push(`/patient/book/${docId}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-5xl mx-auto p-8 space-y-8"
    >
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">Find Your Specialist</h1>
        <p className="text-xl text-slate-500">Book appointments effortlessly with top healthcare professionals.</p>
      </div>

      <div className="relative max-w-2xl mx-auto mb-12 shadow-sm rounded-xl">
        <label htmlFor="search-doctors" className="sr-only">Search Doctors</label>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <Input
          id="search-doctors"
          className="pl-12 h-14 text-lg border-slate-200 rounded-xl"
          placeholder="Search by specialization (e.g. Cardiology) or Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {isLoading ? (
          // Loading Skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end mt-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-11 w-36 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            {filteredDoctors.map((doc, index) => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="transition-all hover:shadow-lg hover:border-teal-500">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <UserCircle className="h-12 w-12 text-slate-400" aria-hidden="true" />
                    <div>
                      <CardTitle className="text-xl text-slate-800">{doc.name}</CardTitle>
                      <p className="text-sm font-medium text-teal-600">{doc.specialization}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                      >
                        {doc.availableSlots > 0 ? "Book Appointment" : "View Schedule"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {!isLoading && filteredDoctors.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 text-lg">
                No doctors found matching "{searchTerm}".
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
