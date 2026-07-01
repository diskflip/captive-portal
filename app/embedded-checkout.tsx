"use client";

import { useCallback, useMemo } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing",
  );
}

const stripePromise = loadStripe(publishableKey);

export default function EmbeddedCheckoutClient({
  checkoutData,
}: {
  checkoutData: Record<string, string>;
}) {
  const fetchClientSecret = useCallback(async () => {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutData),
    });

    const data = (await response.json()) as {
      clientSecret?: string;
      error?: string;
    };

    if (!response.ok || !data.clientSecret) {
      throw new Error(
        data.error ?? "Unable to start checkout",
      );
    }

    return data.clientSecret;
  }, [checkoutData]);

  const options = useMemo(
    () => ({
      fetchClientSecret,
    }),
    [fetchClientSecret],
  );

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl py-4">
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={options}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </main>
  );
}
