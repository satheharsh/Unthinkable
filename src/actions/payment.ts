"use server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2023-10-16" as any,
});

export async function processPaymentSimulation(amount: number) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log(`[Stripe Mock] Simulating payment of $${amount / 100}`);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, mock: true };
    }

    // In a real application, you'd create a PaymentIntent and confirm it on the client.
    // For this prototype, we simulate a successful backend charge if keys are present.
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method: "pm_card_visa", // Test card
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never"
      }
    });

    return { success: true, paymentIntentId: paymentIntent.id };
  } catch (error: any) {
    console.error("Stripe payment error:", error);
    return { success: false, error: error.message };
  }
}
