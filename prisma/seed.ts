import { PrismaClient, Role, AppointmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting historical database seed...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Seed Admins (3)
  const admins = [];
  for (let i = 1; i <= 3; i++) {
    const email = `admin${i}@healthsync.com`;
    const admin = await prisma.user.upsert({
      where: { email },
      update: { password: passwordHash } as any,
      create: {
        email,
        name: `System Admin ${i}`,
        role: Role.ADMIN,
        password: passwordHash,
      },
    });
    admins.push(admin);
  }
  console.log(`✓ Seeded ${admins.length} Admins`);

  // 2. Seed Doctors (30)
  const specializations = [
    "Cardiology", "Neurology", "Pediatrics", "General Practice",
    "Dermatology", "Orthopedics", "Psychiatry", "Oncology",
    "Endocrinology", "Gastroenterology"
  ];
  const doctors = [];
  for (let i = 1; i <= 30; i++) {
    const spec = specializations[i % specializations.length];
    const email = `doctor${i}@healthsync.com`;
    const doctor = await prisma.user.upsert({
      where: { email },
      update: {
        password: passwordHash,
        specialization: spec,
        startTime: i % 2 === 0 ? "08:00" : "09:00",
        endTime: i % 2 === 0 ? "16:00" : "17:00",
        slotDurationMinutes: 30,
      } as any,
      create: {
        email,
        name: `Dr. Specialist ${i}`,
        role: Role.DOCTOR,
        password: passwordHash,
        specialization: spec,
        startTime: i % 2 === 0 ? "08:00" : "09:00",
        endTime: i % 2 === 0 ? "16:00" : "17:00",
        slotDurationMinutes: 30,
      },
    });
    doctors.push(doctor);
  }
  console.log(`✓ Seeded ${doctors.length} Doctors`);

  // 3. Seed Patients (50)
  const patients = [];
  for (let i = 1; i <= 50; i++) {
    const email = `patient${i}@example.com`;
    const patient = await prisma.user.upsert({
      where: { email },
      update: { password: passwordHash } as any,
      create: {
        email,
        name: `Patient Name ${i}`,
        role: Role.PATIENT,
        password: passwordHash,
      },
    });
    patients.push(patient);
  }
  console.log(`✓ Seeded ${patients.length} Patients`);

  console.log("Cleaning up old mock data...");
  await prisma.auditLog.deleteMany({});
  await prisma.waitlist.deleteMany({});
  await prisma.lLMSummary.deleteMany({});
  await prisma.appointment.deleteMany({});

  // 4. Seed Historical Appointments (Jan 2025 to July 2026)
  let pastCount = 0;
  
  // Starting Jan 1, 2025
  let currentDate = new Date('2025-01-01T09:00:00Z');
  const now = new Date(); 

  for (let i = 1; i <= 300; i++) {
    const doc = doctors[i % doctors.length];
    const pat = patients[i % patients.length];
    
    // Advance date by 1-2 days
    currentDate.setDate(currentDate.getDate() + (i % 3 === 0 ? 2 : 1));
    currentDate.setHours(9 + (i % 7), (i % 2) * 30, 0, 0); 
    
    if (currentDate > now) {
      break;
    }

    const apptId = `historic-appt-${i}`;
    
    const preVisitSummary = `Urgency level: Low\nChief complaint: Follow-up visit.\nQuestions for doctor:\n1. Is this normal?`;
    const docNotes = `Patient presented with mild symptoms. Vitals stable. Advised rest and hydration. Prescribed Amoxicillin 500mg: Take 1 tablet twice daily.`;
    const postVisitSummary = `Visit summary:\nPatient presented with mild symptoms. Vitals stable.\n\nMedication schedule:\nAmoxicillin 500mg: Take 1 tablet twice daily.\n\nFollow-up steps:\nRest and hydrate.`;
    const medSchedule = [
      { id: `med-${i}`, name: "Amoxicillin 500mg", instructions: "Take 1 tablet twice daily" }
    ];

    await prisma.appointment.upsert({
      where: { id: apptId },
      update: {},
      create: {
        id: apptId,
        doctorId: doc.id,
        patientId: pat.id,
        slotTime: currentDate,
        status: AppointmentStatus.BOOKED,
        symptoms: "Mild symptoms",
        preVisitSummary,
        doctorNotes: docNotes,
        postVisitSummary,
        aiSummaryFailed: false,
        createdAt: currentDate, // Time travel mapping
        updatedAt: currentDate,
      },
    });

    await prisma.lLMSummary.upsert({
      where: { appointmentId: apptId },
      update: {},
      create: {
        appointmentId: apptId,
        summaryText: postVisitSummary,
        medicationSchedule: medSchedule,
        createdAt: currentDate, 
        updatedAt: currentDate,
      }
    });

    await prisma.auditLog.create({
      data: {
        id: `audit-${apptId}`,
        userId: doc.id,
        patientId: pat.id,
        action: "COMPLETED_APPOINTMENT_SUMMARY",
        details: `Doctor completed visit for patient ${pat.id}`,
        createdAt: currentDate,
      }
    });

    pastCount++;
  }
  console.log(`✓ Seeded ${pastCount} Historical Appointments (2025 - 2026) with LLMSummaries and AuditLogs`);

  // --- 20 Future Appointments (Clustered Today and Tomorrow) ---
  for (let i = 0; i < 20; i++) {
    const doc = doctors[i % 5];
    const pat = patients[(i + 15) % patients.length];
    
    const futureDate = new Date(now);
    const daysAhead = i < 10 ? 0 : 1;
    futureDate.setDate(now.getDate() + daysAhead);
    const hour = 9 + (Math.floor(i / 2) % 7);
    const minute = (i % 2) * 30;
    futureDate.setHours(hour, minute, 0, 0);

    if (daysAhead === 0 && futureDate < now) {
      futureDate.setDate(futureDate.getDate() + 2);
    }

    const apptId = `future-appt-${i}`;

    await prisma.appointment.upsert({
      where: { id: apptId },
      update: {},
      create: {
        id: apptId,
        doctorId: doc.id,
        patientId: pat.id,
        slotTime: futureDate,
        status: AppointmentStatus.BOOKED,
        symptoms: "Routine checkup.",
        preVisitSummary: "Urgency level: Low\nChief complaint: Routine check.",
        meetLink: `https://meet.google.com/mock-${i}`,
      },
    });
  }
  console.log("✓ Seeded 20 Future Appointments");

  console.log("Historical Database Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
