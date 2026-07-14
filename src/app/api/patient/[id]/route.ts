import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as { id: string; role: string } | undefined;

    if (!user || (user.role !== "DOCTOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await db.user.findFirst({
      where: { id, role: "PATIENT" },
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
        userId: user.id,
        action: "VIEW_PATIENT_RECORD",
        patientId: patient.id,
        details: `${user.role} viewed patient records via API`
      }
    });

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("Error fetching patient:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
