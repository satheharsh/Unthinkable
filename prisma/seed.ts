import { PrismaClient, Role, AppointmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.lLMSummary.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Database...');

  // 1. Admin
  await prisma.user.create({
    data: {
      email: 'admin@healthsync.com',
      name: 'System Admin',
      role: Role.ADMIN,
    }
  });

  // 2. Doctors
  const doc1 = await prisma.user.create({
    data: {
      email: 'sarah.smith@healthsync.com',
      name: 'Dr. Sarah Smith',
      role: Role.DOCTOR,
      specialization: 'Cardiology',
    }
  });

  const doc2 = await prisma.user.create({
    data: {
      email: 'james.jones@healthsync.com',
      name: 'Dr. James Jones',
      role: Role.DOCTOR,
      specialization: 'Dermatology',
    }
  });

  const doc3 = await prisma.user.create({
    data: {
      email: 'emily.adams@healthsync.com',
      name: 'Dr. Emily Adams',
      role: Role.DOCTOR,
      specialization: 'Pediatrics',
    }
  });

  const doctors = [doc1, doc2, doc3];

  // 3. Patients
  const patient1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Wonderland',
      role: Role.PATIENT,
    }
  });

  const patient2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Builder',
      role: Role.PATIENT,
    }
  });

  // 4. Generate 30-min slots for today
  const now = new Date();
  now.setMinutes(0, 0, 0); // Start of current hour

  const allAppointments = [];

  for (const doc of doctors) {
    for (let i = 0; i < 8; i++) { // 4 hours of slots
      const slotTime = new Date(now.getTime() + i * 30 * 60000);
      
      const appt = await prisma.appointment.create({
        data: {
          doctorId: doc.id,
          slotTime: slotTime,
          status: AppointmentStatus.AVAILABLE,
        }
      });
      allAppointments.push(appt);
    }
  }

  // 5. Mock Appointments (Booking existing slots)
  // Two Past appointments
  const pastSlot1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const pastAppt1 = await prisma.appointment.create({
    data: {
      doctorId: doc1.id,
      patientId: patient1.id,
      slotTime: pastSlot1,
      status: AppointmentStatus.BOOKED,
      symptoms: 'Mild chest pain after exercise.',
      meetLink: 'https://meet.google.com/xyz-123',
    }
  });

  await prisma.lLMSummary.create({
    data: {
      appointmentId: pastAppt1.id,
      summaryText: 'Patient reported mild angina post-exertion. Advised rest and ordered stress test.',
      medicationSchedule: [{ medicationName: 'Aspirin', instructions: '81mg daily' }]
    }
  });

  const pastSlot2 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  await prisma.appointment.create({
    data: {
      doctorId: doc2.id,
      patientId: patient2.id,
      slotTime: pastSlot2,
      status: AppointmentStatus.BOOKED,
      symptoms: 'Rash on left arm.',
    }
  });

  // Three Future appointments (Modify existing available slots to BOOKED)
  await prisma.appointment.update({
    where: { id: allAppointments[0].id },
    data: {
      patientId: patient1.id,
      status: AppointmentStatus.BOOKED,
      symptoms: 'Follow-up for chest pain.',
    }
  });

  await prisma.appointment.update({
    where: { id: allAppointments[1].id },
    data: {
      patientId: patient2.id,
      status: AppointmentStatus.BOOKED,
      symptoms: 'Routine checkup.',
    }
  });

  await prisma.appointment.update({
    where: { id: allAppointments[8].id },
    data: {
      patientId: patient1.id,
      status: AppointmentStatus.BOOKED,
      symptoms: 'Child has a fever.',
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
