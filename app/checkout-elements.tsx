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
    const timeout = window.setTimeout(() => {
      controller.abort();
    }, 15000);

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
          setLoadError(
            "Checkout took too long to start. Please try again.",
          );
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
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [checkoutPayload]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-8 text-neutral-950">
      <div className="w-full max-w-xs text-center">
        {loadError ? (
          <>
            <p
              className="break-words text-sm text-red-700"
              role="alert"
            >
              {loadError}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 w-full rounded-xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white"
            >
              Try again
            </button>
          </>
        ) : (
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950"
            aria-label="Opening checkout"
          />
        )}
      </div>
    </main>
  );
}
