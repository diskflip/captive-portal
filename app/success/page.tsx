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
    console.error(
      "cnMaestro authorization failed:",
      error instanceof Error ? error.message : "unknown error",
    );

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
              Payment received
            </h1>

            <p className="mt-3 text-sm text-neutral-600">
              Activation failed
            </p>

            <Link
              href={`/success?session_id=${encodeURIComponent(sessionId)}`}
              className="mt-8 block rounded-xl bg-neutral-950 px-4 py-4 font-medium text-white"
            >
              Try again
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">
              ✓ You&apos;re online
            </h1>

            <p className="mt-3 text-sm text-neutral-600">
              Internet access is active.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
