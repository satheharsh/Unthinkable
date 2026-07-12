"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UploadCloud, FileText, Download, FileArchive, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface HealthDocument {
  id: string;
  name: string;
  date: string;
  type: string;
  size: string;
}

const initialDocuments: HealthDocument[] = [
  { id: "1", name: "Complete Blood Count", date: "2026-06-15", type: "Lab Report", size: "1.2 MB" },
  { id: "2", name: "Chest X-Ray", date: "2026-05-20", type: "Imaging", size: "4.5 MB" },
  { id: "3", name: "Amoxicillin Prescription", date: "2026-04-10", type: "Prescription", size: "0.5 MB" },
];

export function HealthVault() {
  const [documents, setDocuments] = useState<HealthDocument[]>(initialDocuments);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Mock upload
    simulateUpload();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const newDoc: HealthDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Uploaded_Document_${new Date().getTime()}.pdf`,
        date: new Date().toISOString().split('T')[0],
        type: "Patient Upload",
        size: "2.1 MB",
      };
      setDocuments([newDoc, ...documents]);
      setIsUploading(false);
      toast.success("Document uploaded securely to your Health Vault.");
    }, 1500);
  };

  const handleDownload = (docName: string) => {
    toast.success(`Downloading ${docName}...`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-teal-100 p-2 rounded-full">
          <FileArchive className="w-6 h-6 text-teal-700" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-slate-800">Digital Health Vault</h3>
          <p className="text-sm text-slate-500">Securely store and manage your medical records and lab reports.</p>
        </div>
      </div>

      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          isDragging ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-teal-500' : 'text-slate-400'}`} />
        <h4 className="text-lg font-semibold text-slate-800 mb-2">Drag and drop your files here</h4>
        <p className="text-sm text-slate-500 mb-6">Support for PDF, JPG, PNG up to 10MB</p>
        
        <input 
          type="file" 
          id="file-upload" 
          className="hidden" 
          onChange={handleFileSelect}
          aria-label="Upload document"
        />
        <Button asChild variant="outline" className="cursor-pointer" disabled={isUploading}>
          <label htmlFor="file-upload">
            {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {isUploading ? "Uploading..." : "Browse Files"}
          </label>
        </Button>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-slate-800 mb-4">Your Documents</h4>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium text-slate-800 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-teal-600" />
                      {doc.name}
                    </TableCell>
                    <TableCell className="text-slate-500">{doc.date}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {doc.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">{doc.size}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.name)} aria-label={`Download ${doc.name}`}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
