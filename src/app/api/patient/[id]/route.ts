import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { getServerSession } from "next-auth/next";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    // In a real app we'd verify the session. For this prototype, we'll mock the doctor ID.
    const doctorId = "mock-doctor-id"; // session?.user?.id

    const patient = await db.user.findUnique({
      where: { id: id, role: "PATIENT" },
      select: {
        id: true,
        name: true,
        email: true,
        // Don't select password or sensitive auth fields
      }
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // HIPAA-style Audit Logging
    await db.auditLog.create({
      data: {
        userId: doctorId,
        action: "VIEW_PATIENT_RECORD",
        patientId: patient.id,
        details: `Doctor viewed patient records via API`
      }
    });

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("Error fetching patient:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
