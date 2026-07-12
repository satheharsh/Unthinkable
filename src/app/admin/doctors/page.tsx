"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

const doctors = [
  { id: "1", name: "Dr. Smith", email: "smith@clinic.com", hours: "09:00 - 17:00" },
  { id: "2", name: "Dr. Jones", email: "jones@clinic.com", hours: "10:00 - 18:00" },
  { id: "3", name: "Dr. Adams", email: "adams@clinic.com", hours: "08:00 - 14:00" },
];

export default function DoctorManagementPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Doctor Management</h1>
        <Button><Plus className="mr-2 h-4 w-4" /> Add Doctor</Button>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Working Hours</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell>{doc.email}</TableCell>
                <TableCell>{doc.hours}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
