import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLANS = {
  hour: {
    name: "1 Hour WiFi Pass",
    description: "Internet access for 1 hour",
    unitAmount: 200,
    accessMinutes: 60,
  },
  day: {
    name: "1 Day WiFi Pass",
    description: "Internet access for 24 hours",
    unitAmount: 500,
    accessMinutes: 1440,
  },
} as const;

type Plan = keyof typeof PLANS;

export async function GET(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);

    const requestedPlan = url.searchParams.get("plan") || "hour";
    const planKey: Plan = requestedPlan === "day" ? "day" : "hour";
    const plan = PLANS[planKey];

    const clientReferenceId = (
      url.searchParams.get("client_reference_id") || "demo-device"
    ).slice(0, 200);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan.unitAmount,
            product_data: {
              name: plan.name,
              description: plan.description,
            },
          },
          quantity: 1,
        },
      ],

      success_url: `${url.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/canceled`,

      client_reference_id: clientReferenceId,

      metadata: {
        source: "wifi_portal",
        plan: planKey,
        access_minutes: String(plan.accessMinutes),
        client_reference_id: clientReferenceId,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a Checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create Checkout Session";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
