import { GA_FIELDS, PLAN, REQUIRED_GA_FIELDS } from "./lib/plans";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Promise<Record<string, SearchParamValue>>;

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const fields: Record<string, string> = {};

  for (const key of GA_FIELDS) {
    const value = first(params[key]);

    if (value) {
      fields[key] = value;
    }
  }

  const ssid = fields.ga_ssid ?? "the event WiFi";
  const missingRequired = REQUIRED_GA_FIELDS.some((key) => !fields[key]);
  const checkoutFailed = Boolean(first(params.error));

  if (missingRequired) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-neutral-950">
        <div className="mx-auto max-w-sm text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Join {ssid} first
          </h1>

          <p className="mt-3 text-sm text-neutral-600">
            This page didn&apos;t open through the WiFi portal. Reconnect to{" "}
            {ssid} and try again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-neutral-950">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Event WiFi</h1>

        <p className="mt-2 text-sm text-neutral-600">Fast Internet Access</p>

        <p className="mt-6 text-3xl font-semibold">{PLAN.priceLabel}</p>
        <p className="text-sm text-neutral-500">Event Pass</p>

        {checkoutFailed && (
          <p className="mt-6 text-sm text-red-700">
            Payment could not be started. Please try again.
          </p>
        )}

        <form method="POST" action="/api/checkout" className="mt-8 w-full">
          {GA_FIELDS.map((key) =>
            fields[key] ? (
              <input key={key} type="hidden" name={key} value={fields[key]} />
            ) : null,
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-neutral-950 px-5 py-4 font-medium text-white"
          >
            Get Online
          </button>
        </form>
      </div>
    </main>
  );
}
