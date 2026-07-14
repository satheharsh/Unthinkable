import { NextResponse } from "next/server";
import { generateAvailableSlots } from "@/utils/slots";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];
    
    const slots = await generateAvailableSlots(id, dateStr);
    
    return NextResponse.json({ slots });
  } catch (error: any) {
    console.error("Error fetching slots:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
