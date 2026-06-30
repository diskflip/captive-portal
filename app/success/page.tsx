import Stripe from "stripe";
import Link from "next/link";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;

  if (!params.session_id) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-neutral-950">
        <div className="mx-auto max-w-sm">
          <h1 className="text-2xl font-semibold">Missing session</h1>

          <Link href="/" className="mt-6 block underline">
            Start over
          </Link>
        </div>
      </main>
    );
  }

  const session = await stripe.checkout.sessions.retrieve(params.session_id);

  if (session.status !== "complete") {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-neutral-950">
        <div className="mx-auto max-w-sm">
          <h1 className="text-2xl font-semibold">Payment not complete</h1>

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
          Access granted
        </h1>

        <p className="mt-3 text-sm text-neutral-600">
          Payment complete. Your WiFi pass is active.
        </p>

        {session.customer_details?.email && (
          <p className="mt-4 text-sm text-neutral-500">
            Receipt sent to {session.customer_details.email}.
          </p>
        )}

        <p className="mt-4 text-sm text-neutral-500">
          Plan: {session.metadata?.plan}
        </p>

        <a
          href="https://google.com"
          className="mt-8 block rounded-xl bg-neutral-950 px-4 py-4 font-medium text-white"
        >
          Continue
        </a>
      </div>
    </main>
  );
}
