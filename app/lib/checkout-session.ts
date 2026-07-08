import Stripe from "stripe";

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
type CheckoutData = Record<string, unknown>;

function getStripe(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }

  return new Stripe(stripeKey);
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function sanitizeClientReferenceId(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_.:-]/g, "_")
    .slice(0, 200);
}

export async function createCheckoutSessionUrl(
  checkoutData: CheckoutData,
  origin: string,
): Promise<string> {
  const planKey: Plan =
    getString(checkoutData.plan) === "day" ? "day" : "hour";

  const plan = PLANS[planKey];

  const rawClientReferenceId =
    getString(checkoutData.client_reference_id) ??
    getString(checkoutData.ga_cmac) ??
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
    const value = getString(checkoutData[key]);

    if (value) {
      metadata[key] = value.slice(0, 500);
    }
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
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

    success_url:
      `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/canceled`,

    client_reference_id: clientReferenceId,
    metadata,
  });

  if (!session.url) {
    throw new Error(
      "Stripe did not return a hosted Checkout URL",
    );
  }

  return session.url;
}
