import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2023-10-16" as any,
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.redirect(new URL("/register?error=missing_session", req.url));
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify payment was successful
    if (session.payment_status !== "paid") {
      return NextResponse.redirect(new URL("/register?error=payment_failed", req.url));
    }

    // Extract user details from metadata
    const { name, email, hashedPassword, role } = session.metadata || {};

    if (!name || !email || !hashedPassword || !role) {
      // If metadata is missing, we must refund since we can't create the user
      await refundPayment(session.payment_intent as string);
      return NextResponse.redirect(new URL("/register?error=missing_metadata", req.url));
    }

    try {
      // Check if user already exists (maybe they hit the callback twice)
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!existingUser) {
        // Create the user in the database
        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: role as any,
          } as any,
        });
      }

      // Redirect to login on success
      return NextResponse.redirect(new URL("/login?registered=true", req.url));
    } catch (dbError) {
      console.error("Database error during callback:", dbError);
      
      // Safety mechanism: Refund the payment if database save fails
      await refundPayment(session.payment_intent as string);
      
      return NextResponse.redirect(new URL("/register?error=database_failure", req.url));
    }
  } catch (error) {
    console.error("Stripe callback error:", error);
    return NextResponse.redirect(new URL("/register?error=server_error", req.url));
  }
}

// Helper to reliably refund
async function refundPayment(paymentIntentId?: string) {
  if (!paymentIntentId) return;
  try {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
    console.log(`Refund issued for payment intent: ${paymentIntentId}`);
  } catch (refundError) {
    console.error("Failed to issue refund:", refundError);
  }
}
