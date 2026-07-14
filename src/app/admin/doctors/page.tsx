"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarOff, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import {
  createDoctorProfile,
  DoctorProfileInput,
  getAdminDoctors,
  markLeaveForDoctor,
  updateDoctorProfile,
} from "@/actions/admin";

type AdminDoctor = Awaited<ReturnType<typeof getAdminDoctors>>[number];

const emptyForm: DoctorProfileInput = {
  name: "",
  email: "",
  specialization: "",
  startTime: "09:00",
  endTime: "17:00",
  slotDurationMinutes: 30,
};

export default function DoctorManagementPage() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DoctorProfileInput>>({});
  const [leaveDrafts, setLeaveDrafts] = useState<Record<string, { date: string; reason: string }>>({});
  const [newDoctor, setNewDoctor] = useState<DoctorProfileInput>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadDoctors() {
    setIsLoading(true);
    try {
      const data = await getAdminDoctors();
      setDoctors(data);
      setDrafts(
        Object.fromEntries(
          data.map((doctor) => [
            doctor.id,
            {
              name: doctor.name,
              email: doctor.email,
              specialization: doctor.specialization,
              startTime: doctor.startTime,
              endTime: doctor.endTime,
              slotDurationMinutes: doctor.slotDurationMinutes,
            },
          ])
        )
      );
      setLeaveDrafts(
        Object.fromEntries(data.map((doctor) => [doctor.id, { date: "", reason: "" }]))
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to load doctors");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  const updateDraft = (doctorId: string, field: keyof DoctorProfileInput, value: string | number) => {
    setDrafts((current) => ({
      ...current,
      [doctorId]: {
        ...current[doctorId],
        [field]: value,
      },
    }));
  };

  const handleCreateDoctor = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusyId("new");

    try {
      await createDoctorProfile(newDoctor);
      toast.success("Doctor profile created.");
      setNewDoctor(emptyForm);
      await loadDoctors();
    } catch (error: any) {
      toast.error(error.message || "Unable to create doctor");
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveDoctor = async (doctorId: string) => {
    setBusyId(doctorId);

    try {
      await updateDoctorProfile(doctorId, drafts[doctorId]);
      toast.success("Doctor profile updated.");
      await loadDoctors();
    } catch (error: any) {
      toast.error(error.message || "Unable to update doctor");
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkLeave = async (doctorId: string) => {
    const leave = leaveDrafts[doctorId];
    setBusyId(`${doctorId}-leave`);

    try {
      const result = await markLeaveForDoctor(doctorId, leave.date, leave.reason);
      toast.success(`Leave saved. ${result.cancelledAppointments} appointment(s) cancelled.`);
      await loadDoctors();
    } catch (error: any) {
      toast.error(error.message || "Unable to mark leave");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctor Management</h1>
          <p className="text-slate-500 mt-2">Create profiles, manage working hours, slot duration, and leave days.</p>
        </div>
      </div>

      <form onSubmit={handleCreateDoctor} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-6">
        <Input
          required
          placeholder="Doctor name"
          value={newDoctor.name}
          onChange={(event) => setNewDoctor({ ...newDoctor, name: event.target.value })}
        />
        <Input
          required
          type="email"
          placeholder="Email"
          value={newDoctor.email}
          onChange={(event) => setNewDoctor({ ...newDoctor, email: event.target.value })}
        />
        <Input
          required
          placeholder="Specialization"
          value={newDoctor.specialization}
          onChange={(event) => setNewDoctor({ ...newDoctor, specialization: event.target.value })}
        />
        <Input
          type="time"
          value={newDoctor.startTime}
          onChange={(event) => setNewDoctor({ ...newDoctor, startTime: event.target.value })}
        />
        <Input
          type="time"
          value={newDoctor.endTime}
          onChange={(event) => setNewDoctor({ ...newDoctor, endTime: event.target.value })}
        />
        <div className="flex gap-2">
          <select
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={newDoctor.slotDurationMinutes}
            onChange={(event) => setNewDoctor({ ...newDoctor, slotDurationMinutes: Number(event.target.value) })}
          >
            {[15, 20, 30, 45, 60].map((duration) => (
              <option key={duration} value={duration}>{duration} min</option>
            ))}
          </select>
          <Button type="submit" disabled={busyId === "new"}>
            {busyId === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Leave</TableHead>
              <TableHead>Booked</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading doctors...
                </TableCell>
              </TableRow>
            ) : doctors.map((doctor) => {
              const draft = drafts[doctor.id];
              const leave = leaveDrafts[doctor.id] || { date: "", reason: "" };

              return (
                <TableRow key={doctor.id}>
                  <TableCell>
                    <Input value={draft?.name || ""} onChange={(event) => updateDraft(doctor.id, "name", event.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input type="email" value={draft?.email || ""} onChange={(event) => updateDraft(doctor.id, "email", event.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input value={draft?.specialization || ""} onChange={(event) => updateDraft(doctor.id, "specialization", event.target.value)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Input type="time" value={draft?.startTime || "09:00"} onChange={(event) => updateDraft(doctor.id, "startTime", event.target.value)} />
                      <Input type="time" value={draft?.endTime || "17:00"} onChange={(event) => updateDraft(doctor.id, "endTime", event.target.value)} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm"
                      value={draft?.slotDurationMinutes || 30}
                      onChange={(event) => updateDraft(doctor.id, "slotDurationMinutes", Number(event.target.value))}
                    >
                      {[15, 20, 30, 45, 60].map((duration) => (
                        <option key={duration} value={duration}>{duration} min</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-[260px] gap-2">
                      <Input
                        type="date"
                        value={leave.date}
                        onChange={(event) =>
                          setLeaveDrafts((current) => ({
                            ...current,
                            [doctor.id]: { ...leave, date: event.target.value },
                          }))
                        }
                      />
                      <Input
                        placeholder="Reason"
                        value={leave.reason}
                        onChange={(event) =>
                          setLeaveDrafts((current) => ({
                            ...current,
                            [doctor.id]: { ...leave, reason: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>{doctor.bookedAppointments}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleMarkLeave(doctor.id)} disabled={!leave.date || busyId === `${doctor.id}-leave`} aria-label="Mark leave">
                        {busyId === `${doctor.id}-leave` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarOff className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" onClick={() => handleSaveDoctor(doctor.id)} disabled={busyId === doctor.id} aria-label="Save doctor">
                        {busyId === doctor.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
