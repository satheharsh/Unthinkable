"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserCircle, Star } from "lucide-react";
import Link from "next/link";

const mockDoctors = [
  { id: "1", name: "Dr. Sarah Smith", specialization: "Cardiology", rating: 4.9, availableSlots: 3 },
  { id: "2", name: "Dr. James Jones", specialization: "Dermatology", rating: 4.7, availableSlots: 0 },
  { id: "3", name: "Dr. Emily Adams", specialization: "Pediatrics", rating: 4.8, availableSlots: 5 },
  { id: "4", name: "Dr. Michael Chen", specialization: "Cardiology", rating: 4.6, availableSlots: 2 },
];

export default function DoctorSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDoctors = mockDoctors.filter((doc) =>
    doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight">Find Your Specialist</h1>
        <p className="text-xl text-muted-foreground">Book appointments effortlessly with top healthcare professionals.</p>
      </div>

      <div className="relative max-w-2xl mx-auto mb-12 shadow-sm rounded-lg">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          className="pl-10 h-14 text-lg border-2"
          placeholder="Search by specialization (e.g. Cardiology, Dermatology) or Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredDoctors.map((doc) => (
          <Card key={doc.id} className="transition-all hover:shadow-md hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <UserCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <CardTitle className="text-xl">{doc.name}</CardTitle>
                <p className="text-sm font-medium text-primary">{doc.specialization}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mt-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-yellow-600 font-medium">
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    {doc.rating} Ratings
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {doc.availableSlots > 0 
                      ? <span className="text-green-600 font-medium">{doc.availableSlots} slots available today</span>
                      : <span className="text-orange-500 font-medium">Waitlist available</span>}
                  </div>
                </div>
                <Link href={\`/patient/book/\${doc.id}\`}>
                  <Button variant={doc.availableSlots > 0 ? "default" : "secondary"}>
                    {doc.availableSlots > 0 ? "Book Appointment" : "View Schedule"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDoctors.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground text-lg">
            No doctors found matching "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
}
