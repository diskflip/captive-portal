import Stripe from "stripe";
import { PLANS, type PlanKey } from "./plans";

type CheckoutFields = Record<string, string>;

function getStripe(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }

  return new Stripe(stripeKey);
}

function sanitizeClientReferenceId(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_.:-]/g, "_")
    .slice(0, 200);
}

function paymentMethodConfiguration(
  captive: boolean,
): string | undefined {
  const value = captive
    ? process.env.STRIPE_PMC_CAPTIVE
    : process.env.STRIPE_PMC_BROWSER;

  return value?.trim() || undefined;
}

function cancelUrl(
  origin: string,
  fields: CheckoutFields,
): string {
  const target = new URL("/", origin);

  for (const [key, value] of Object.entries(fields)) {
    target.searchParams.set(key, value);
  }

  return target.toString();
}

export async function createCheckoutSessionUrl(
  planKey: PlanKey,
  fields: CheckoutFields,
  origin: string,
  captive: boolean,
): Promise<string> {
  const plan = PLANS[planKey];
  const clientMac = fields.ga_cmac?.trim();

  if (!clientMac) {
    throw new Error("ga_cmac is missing from the portal session");
  }

  const configuration = paymentMethodConfiguration(captive);

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",

    ...(configuration
      ? { payment_method_configuration: configuration }
      : {}),

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
    cancel_url: cancelUrl(origin, fields),

    client_reference_id: sanitizeClientReferenceId(clientMac),

    metadata: {
      plan: planKey,
      access_minutes: String(plan.accessMinutes),
      ga_cmac: clientMac,
      ga_ap_mac: fields.ga_ap_mac?.slice(0, 500) ?? "",
      ga_Qv: fields.ga_Qv?.slice(0, 500) ?? "",
      ga_orig_url: fields.ga_orig_url?.slice(0, 400) ?? "",
    },
  });

  if (!session.url) {
    throw new Error(
      "Stripe did not return a hosted Checkout URL",
    );
  }

  return session.url;
}
