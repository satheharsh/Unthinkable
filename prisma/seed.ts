import { PrismaClient, Role, AppointmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Generate a standard password hash for all users
  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Seed Admins (3)
  const admins = [];
  for (let i = 1; i <= 3; i++) {
    const email = `admin${i}@healthsync.com`;
    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        password: passwordHash,
      },
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
      },
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
      update: {
        password: passwordHash,
      },
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

  const now = new Date();
  
  // Clean up existing appointments to avoid cluttering unique constraints during rapid seeding
  // Using deleteMany because appointments are unique per doctor/time and don't have a reliable upsert key without querying
  console.log("Cleaning up old mock appointments...");
  await prisma.waitlist.deleteMany({});
  await prisma.lLMSummary.deleteMany({});
  await prisma.appointment.deleteMany({});

  // 4. Seed Appointments
  
  // --- 15 Past Appointments ---
  for (let i = 0; i < 15; i++) {
    const doc = doctors[i % doctors.length];
    const pat = patients[i % patients.length];
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - (i % 5 + 1)); // 1-5 days ago
    pastDate.setHours(9 + (i % 7), 0, 0, 0); // between 09:00 and 15:00

    const preVisitSummary = `Urgency level: Low\nChief complaint: Checkup for mild symptoms\nQuestions for doctor:\n1. Is this normal?`;
    const docNotes = `Patient presented with mild symptoms. Vitals stable. Advised rest and hydration. Prescribed Amoxicillin 500mg: Take 1 tablet twice daily.`;
    const postVisitSummary = `Visit summary:\nPatient presented with mild symptoms. Vitals stable.\n\nMedication schedule:\nAmoxicillin 500mg: Take 1 tablet twice daily.\n\nFollow-up steps:\nRest and hydrate.`;
    const medSchedule = [
      { id: `med-${i}`, name: "Amoxicillin 500mg", instructions: "Take 1 tablet twice daily" }
    ];

    await prisma.appointment.create({
      data: {
        doctorId: doc.id,
        patientId: pat.id,
        slotTime: pastDate,
        status: AppointmentStatus.BOOKED,
        symptoms: "Mild symptoms",
        preVisitSummary,
        doctorNotes: docNotes,
        postVisitSummary,
        aiSummaryFailed: false,
        llmSummary: {
          create: {
            summaryText: postVisitSummary,
            medicationSchedule: medSchedule,
          }
        }
      },
    });
  }
  console.log("✓ Seeded 15 Past Appointments with LLM Summaries");

  // --- 20 Future Appointments (Clustered Today and Tomorrow) ---
  for (let i = 0; i < 20; i++) {
    const doc = doctors[i % 5]; // Cluster them around the first 5 doctors to make their schedules look busy
    const pat = patients[(i + 15) % patients.length];
    
    const futureDate = new Date(now);
    // 0 = today, 1 = tomorrow
    const daysAhead = i < 10 ? 0 : 1;
    futureDate.setDate(now.getDate() + daysAhead);
    // Times between 09:00 and 16:30
    const hour = 9 + (Math.floor(i / 2) % 7);
    const minute = (i % 2) * 30;
    futureDate.setHours(hour, minute, 0, 0);

    // Skip if it's today and the time has already passed
    if (daysAhead === 0 && futureDate < now) {
      futureDate.setDate(futureDate.getDate() + 2); // Push to day after tomorrow
    }

    await prisma.appointment.create({
      data: {
        doctorId: doc.id,
        patientId: pat.id,
        slotTime: futureDate,
        status: AppointmentStatus.BOOKED,
        symptoms: "Routine follow-up or specific complaint.",
        preVisitSummary: "Urgency level: Low\nChief complaint: Routine check.",
        meetLink: `https://meet.google.com/mock-${i}`,
      },
    });
  }
  console.log("✓ Seeded 20 Future Appointments");

  // --- 5 ON_HOLD Appointments ---
  for (let i = 0; i < 5; i++) {
    const doc = doctors[(i + 5) % doctors.length];
    
    const holdDate = new Date(now);
    holdDate.setDate(now.getDate() + 3); // 3 days ahead
    holdDate.setHours(10 + i, 30, 0, 0);

    const expiresAt = new Date(now);
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await prisma.appointment.create({
      data: {
        doctorId: doc.id,
        slotTime: holdDate,
        status: AppointmentStatus.ON_HOLD,
        holdExpiresAt: expiresAt,
      },
    });
  }
  console.log("✓ Seeded 5 ON_HOLD Appointments");

  console.log("Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
