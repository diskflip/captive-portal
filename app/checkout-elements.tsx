"use client";

import { useEffect, useMemo, useState } from "react";

type CheckoutElementsClientProps = {
  checkoutData: Record<string, string>;
};

export default function CheckoutElementsClient({
  checkoutData,
}: CheckoutElementsClientProps) {
  const [loadError, setLoadError] =
    useState<string | null>(null);

  const checkoutPayload = useMemo(
    () => JSON.stringify(checkoutData),
    [checkoutData],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function createCheckoutSession() {
      try {
        setLoadError(null);

        const checkoutUrl = new URL(
          "/api/checkout",
          window.location.origin,
        );

        const response = await fetch(
          checkoutUrl.toString(),
          {
            method: "POST",
            cache: "no-store",
            signal: controller.signal,

            headers: {
              "Content-Type": "application/json",
            },

            body: checkoutPayload,
          },
        );

        const data = (await response.json()) as {
          url?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            data.error ??
              `Checkout request failed with status ${response.status}`,
          );
        }

        if (!data.url) {
          throw new Error(
            "Checkout API did not return a Stripe Checkout URL",
          );
        }

        window.location.assign(data.url);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to start checkout",
        );
      }
    }

    void createCheckoutSession();

    return () => {
      controller.abort();
    };
  }, [checkoutPayload]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-5 py-8 text-neutral-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-neutral-500">
          Events WiFi
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Redirecting to secure checkout
        </h1>

        {loadError ? (
          <>
            <p
              className="mt-4 break-words text-sm text-red-700"
              role="alert"
            >
              {loadError}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 w-full rounded-xl bg-neutral-950 px-4 py-4 font-medium text-white"
            >
              Try again
            </button>
          </>
        ) : (
          <p className="mt-3 text-sm text-neutral-600">
            Opening Stripe Checkout…
          </p>
        )}
      </div>
    </main>
  );
}
