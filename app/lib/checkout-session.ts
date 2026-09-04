import Stripe from "stripe";
import { PLAN, REQUIRED_GA_FIELDS } from "./plans";

type CheckoutFields = Record<string, string>;

function getStripe(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }

  return new Stripe(stripeKey);
}

function sanitizeClientReferenceId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 200);
}

function portalUrl(origin: string, fields: CheckoutFields): string {
  const target = new URL("/", origin);

  for (const [key, value] of Object.entries(fields)) {
    target.searchParams.set(key, value);
  }

  return target.toString();
}

export async function createCheckoutSessionUrl(
  fields: CheckoutFields,
  requestOrigin: string,
): Promise<string> {
  for (const key of REQUIRED_GA_FIELDS) {
    if (!fields[key]?.trim()) {
      throw new Error(`${key} is missing from the portal session`);
    }
  }

  const appUrl = (process.env.APP_URL?.trim() || requestOrigin).replace(
    /\/+$/,
    "",
  );

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",

    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: PLAN.unitAmount,
          product_data: {
            name: PLAN.name,
          },
        },
        quantity: 1,
      },
    ],

    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: portalUrl(requestOrigin, fields),

    client_reference_id: sanitizeClientReferenceId(fields.ga_cmac),

    metadata: {
      ga_cmac: fields.ga_cmac,
      ga_ap_mac: fields.ga_ap_mac,
      ga_Qv: fields.ga_Qv,
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a hosted Checkout URL");
  }

  return session.url;
}
