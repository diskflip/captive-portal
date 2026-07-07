"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CheckoutElementsProvider,
  ContactDetailsElement,
  ExpressCheckoutElement,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";

const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripePromise = publishableKey
  ? loadStripe(publishableKey)
  : null;

type CheckoutElementsClientProps = {
  checkoutData: Record<string, string>;
};

function CheckoutForm() {
  const checkoutState = useCheckoutElements();

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [hasExpressMethods, setHasExpressMethods] =
    useState(false);

  if (checkoutState.type === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-5 py-8 text-neutral-950">
        <p className="text-sm text-neutral-600">
          Loading secure checkout…
        </p>
      </main>
    );
  }

  if (checkoutState.type === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-5 py-8 text-neutral-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">
            Checkout unavailable
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {checkoutState.error.message}
          </p>
        </div>
      </main>
    );
  }

  const { checkout } = checkoutState;

  const amount = checkout.total.total.amount;

  const passName =
    checkout.lineItems[0]?.name ?? "WiFi access";

  async function confirmPayment(
    options?: Parameters<typeof checkout.confirm>[0],
  ) {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await checkout.confirm(options);

      if (result.type === "error") {
        setMessage(result.error.message);
        setIsSubmitting(false);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Payment could not be completed.",
      );

      setIsSubmitting(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    await confirmPayment();
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-6 text-neutral-950 sm:py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-5 shadow-sm sm:p-7">
        <p className="text-sm font-medium text-neutral-500">
          Events WiFi
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Purchase internet access
        </h1>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-neutral-100 px-4 py-3">
          <span className="text-sm font-medium">
            {passName}
          </span>

          <span className="font-semibold">
            {amount}
          </span>
        </div>

        <div className="mt-6">
          <ExpressCheckoutElement
            options={{
              buttonHeight: undefined,
              buttonTheme: undefined,
              buttonType: undefined,
              layout: undefined,
              paymentMethodOrder: undefined,

              paymentMethods: {
                applePay: "always",
              },
            }}
            onAvailablePaymentMethodsChange={(event) => {
              setHasExpressMethods(
                Boolean(event.paymentMethods),
              );
            }}
            onConfirm={async (event) => {
              await confirmPayment({
                expressCheckoutConfirmEvent: event,
              });
            }}
          />
        </div>

        {hasExpressMethods && (
          <div
            className="my-6 flex items-center gap-3"
            aria-hidden="true"
          >
            <div className="h-px flex-1 bg-neutral-200" />

            <span className="text-xs uppercase tracking-wide text-neutral-400">
              Or pay another way
            </span>

            <div className="h-px flex-1 bg-neutral-200" />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <ContactDetailsElement />
          </div>

          <PaymentElement />

          {message && (
            <p
              className="mt-4 text-sm text-red-700"
              role="alert"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={
              !checkout.canConfirm || isSubmitting
            }
            className="mt-6 w-full rounded-xl bg-neutral-950 px-4 py-4 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Processing…"
              : `Pay ${amount}`}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Secure payment powered by Stripe
        </p>
      </div>
    </main>
  );
}

export default function CheckoutElementsClient({
  checkoutData,
}: CheckoutElementsClientProps) {
  const [clientSecret, setClientSecret] =
    useState<string | null>(null);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function createCheckoutSession() {
      try {
        setLoadError(null);

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

        if (!cancelled) {
          setClientSecret(data.clientSecret);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to start checkout",
          );
        }
      }
    }

    void createCheckoutSession();

    return () => {
      cancelled = true;
    };
  }, [checkoutData]);

  if (!stripePromise) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-5 py-8 text-neutral-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">
            Checkout unavailable
          </h1>

          <p className="mt-2 text-sm text-red-700">
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is
            missing.
          </p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-5 py-8 text-neutral-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">
            Checkout unavailable
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 w-full rounded-xl bg-neutral-950 px-4 py-3 font-medium text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!clientSecret) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-5 py-8 text-neutral-950">
        <p className="text-sm text-neutral-600">
          Loading secure checkout…
        </p>
      </main>
    );
  }

  return (
    <CheckoutElementsProvider
      stripe={stripePromise}
      options={{
        clientSecret,

        elementsOptions: {
          appearance: {
            theme: "stripe",

            variables: {
              borderRadius: "12px",
            },
          },
        },
      }}
    >
      <CheckoutForm />
    </CheckoutElementsProvider>
  );
}
