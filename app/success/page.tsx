import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { loginToCambiumEasyPass } from "../lib/cambium-easypass";

export const runtime = "nodejs";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
}) {
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

  let accessResult:
    | Awaited<ReturnType<typeof loginToCambiumEasyPass>>
    | undefined;
  let accessError: string | undefined;

  try {
    accessResult = await loginToCambiumEasyPass(session.metadata ?? {});
  } catch (error) {
    accessError =
      error instanceof Error
        ? error.message
        : "Unable to activate WiFi access.";
  }

  if (accessResult?.redirectUrl) {
    redirect(accessResult.redirectUrl);
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-neutral-950">
      <div className="mx-auto max-w-sm text-center">
        {accessError ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              Payment complete
            </h1>

            <p className="mt-3 text-sm text-red-700">
              {accessError}
            </p>

            <Link
              href={`/success?session_id=${encodeURIComponent(sessionId)}`}
              className="mt-8 block rounded-xl bg-neutral-950 px-4 py-4 font-medium text-white"
            >
              Try activating again
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">
              WiFi access active
            </h1>

            <p className="mt-3 text-sm text-neutral-600">
              Your payment is complete and your device has been authorized.
            </p>

            {accessResult?.expiry && (
              <p className="mt-4 text-sm text-neutral-500">
                Session: {Math.round(accessResult.expiry / 60)} minutes
              </p>
            )}

            <a
              href="https://google.com"
              className="mt-8 block rounded-xl bg-neutral-950 px-4 py-4 font-medium text-white"
            >
              Continue to internet
            </a>
          </>
        )}
      </div>
    </main>
  );
}
