import { db } from "@/utils/db";

export async function generateAvailableSlots(doctorId: string, dateStr: string) {
  // dateStr format: YYYY-MM-DD
  const doctor = await db.user.findUnique({
    where: { id: doctorId },
    select: { startTime: true, endTime: true, slotDurationMinutes: true }
  });

  if (!doctor) throw new Error("Doctor not found");

  const startHourStr = doctor.startTime || "09:00";
  const endHourStr = doctor.endTime || "17:00";
  const duration = doctor.slotDurationMinutes || 30;

  // Parse hours
  const [startHour, startMinute] = startHourStr.split(":").map(Number);
  const [endHour, endMinute] = endHourStr.split(":").map(Number);

  const startOfDay = new Date(`${dateStr}T00:00:00`);
  const startDateTime = new Date(startOfDay);
  startDateTime.setHours(startHour, startMinute, 0, 0);

  const endDateTime = new Date(startOfDay);
  endDateTime.setHours(endHour, endMinute, 0, 0);

  // Fetch appointments for this doctor on this day
  const nextDay = new Date(startOfDay);
  nextDay.setDate(nextDay.getDate() + 1);

  const appointments = await db.appointment.findMany({
    where: {
      doctorId,
      slotTime: {
        gte: startOfDay,
        lt: nextDay,
      },
      status: {
        in: ["BOOKED", "ON_HOLD"]
      }
    }
  });

  // Fetch leaves for this doctor that overlap with this day
  const leaves = await db.doctorLeave.findMany({
    where: {
      doctorId,
      startTime: { lt: nextDay },
      endTime: { gt: startOfDay }
    }
  });

  const slots = [];
  let currentSlot = new Date(startDateTime);

  while (currentSlot < endDateTime) {
    const slotEnd = new Date(currentSlot.getTime() + duration * 60000);
    
    // Check if slot overlaps with any leave
    const isLeave = leaves.some(leave => 
      (currentSlot >= leave.startTime && currentSlot < leave.endTime) ||
      (slotEnd > leave.startTime && slotEnd <= leave.endTime) ||
      (currentSlot <= leave.startTime && slotEnd >= leave.endTime)
    );

    // Check if slot is booked or on hold
    const isBooked = appointments.some(appt => 
      appt.slotTime.getTime() === currentSlot.getTime()
    );

    if (!isLeave) {
      slots.push({
        time: currentSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateTime: new Date(currentSlot),
        status: isBooked ? "BOOKED" : "AVAILABLE"
      });
    }

    // Move to next slot
    currentSlot = new Date(currentSlot.getTime() + duration * 60000);
  }

  return slots;
}
