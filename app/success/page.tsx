import Link from "next/link";
import { connection } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
}) {
  // Stop Next from evaluating the Stripe-dependent code during prerendering.
  await connection();

  const params = await searchParams;

  const sessionId = Array.isArray(params.session_id)
    ? params.session_id[0]
    : params.session_id;

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-neutral-950">
        <div className="mx-auto max-w-sm text-center">
          <h1 className="text-2xl font-semibold">Missing payment session</h1>

          <Link href="/" className="mt-6 block underline">
            Start over
          </Link>
        </div>
      </main>
    );
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }

  const stripe = new Stripe(stripeKey);

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-neutral-950">
        <div className="mx-auto max-w-sm text-center">
          <h1 className="text-2xl font-semibold">
            Payment not complete
          </h1>

          <Link href="/" className="mt-6 block underline">
            Try again
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-neutral-950">
      <div className="mx-auto max-w-sm text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Payment complete
        </h1>

        <p className="mt-3 text-sm text-neutral-600">
          Your WiFi pass has been purchased successfully.
        </p>

        {session.metadata?.plan && (
          <p className="mt-4 text-sm text-neutral-500">
            Plan: {session.metadata.plan}
          </p>
        )}

        <a
          href="https://google.com"
          className="mt-8 block rounded-xl bg-neutral-950 px-4 py-4 font-medium text-white"
        >
          Continue to internet
        </a>
      </div>
    </main>
  );
}
