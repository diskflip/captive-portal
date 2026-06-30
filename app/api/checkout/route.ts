import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function getStripe(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }

  return new Stripe(stripeKey);
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    const requestedPlan = url.searchParams.get("plan");
    const planKey: Plan = requestedPlan === "day" ? "day" : "hour";
    const plan = PLANS[planKey];

    const clientReferenceId = (
      url.searchParams.get("client_reference_id") ?? "demo-device"
    ).slice(0, 200);

    const stripe = getStripe();

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
        { status: 500 },
      );
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create Checkout Session";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
