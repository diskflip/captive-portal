import Link from "next/link";

export default function CanceledPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-neutral-950">
      <div className="mx-auto max-w-sm text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Checkout canceled
        </h1>

        <p className="mt-3 text-sm text-neutral-600">
          Your payment was not completed.
        </p>

        <Link
          href="/"
          className="mt-8 block rounded-xl bg-neutral-950 px-4 py-4 font-medium text-white"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
