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
type CheckoutBody = Record<string, unknown>;

function getStripe(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }

  return new Stripe(stripeKey);
}

function getPublishableKey(): string {
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();

  if (
    !publishableKey ||
    !(
      publishableKey.startsWith("pk_test_") ||
      publishableKey.startsWith("pk_live_")
    )
  ) {
    throw new Error(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing or invalid",
    );
  }

  return publishableKey;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function sanitizeClientReferenceId(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_.:-]/g, "_")
    .slice(0, 200);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as CheckoutBody;

    const planKey: Plan =
      getString(body.plan) === "day" ? "day" : "hour";

    const plan = PLANS[planKey];

    const rawClientReferenceId =
      getString(body.client_reference_id) ??
      getString(body.ga_cmac) ??
      "demo-device";

    const clientReferenceId = sanitizeClientReferenceId(
      rawClientReferenceId,
    );

    const metadata: Record<string, string> = {
      source: "wifi_portal",
      plan: planKey,
      access_minutes: String(plan.accessMinutes),
      client_reference_id: clientReferenceId,
    };

    const cambiumFields = [
      "ga_cmac",
      "ga_ssid",
      "ga_ap_mac",
      "ga_nas_id",
      "ga_srvr",
      "ga_orig_url",
      "ga_cip",
      "ga_Qv",
      "s",
    ];

    for (const key of cambiumFields) {
      const value = getString(body[key]);

      if (value) {
        metadata[key] = value.slice(0, 500);
      }
    }

    const stripe = getStripe();
    const publishableKey = getPublishableKey();
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      ui_mode: "elements",
      mode: "payment",

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

      return_url:
        `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,

      client_reference_id: clientReferenceId,
      metadata,
    });

    if (!session.client_secret) {
      throw new Error(
        "Stripe did not return a Checkout Session client secret",
      );
    }

    return NextResponse.json({
      clientSecret: session.client_secret,
      publishableKey,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create Checkout Session";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}
