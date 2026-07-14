import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Name, email, and password are required" }, { status: 400 });
    }

    const assignedRole = role === "DOCTOR" ? "DOCTOR" : "PATIENT";

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (assignedRole === "DOCTOR") {
      // Defer user creation for doctors. Store details in Stripe session metadata.
      const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "HealthSync Doctor Setup Fee",
                description: "One-time registration and verification fee.",
              },
              unit_amount: 9900, // $99.00
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/api/stripe/callback?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/register?canceled=true`,
        metadata: {
          name,
          email: email.toLowerCase(),
          hashedPassword,
          role: assignedRole,
        },
      });

      return NextResponse.json({ 
        message: "Redirecting to payment.", 
        checkoutUrl: session.url 
      }, { status: 201 });
    }

    // Immediately create user for PATIENT role
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: assignedRole,
      } as any,
    });

    return NextResponse.json({ message: "User created successfully", user: { id: user.id, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 });
  }
}
