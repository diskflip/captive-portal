import { GA_FIELDS, REQUIRED_GA_FIELDS } from "./lib/plans";

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
  const hasRequiredFields = REQUIRED_GA_FIELDS.every((key) => fields[key]);
  const checkoutFailed = Boolean(first(params.error));

  if (!hasRequiredFields) {
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

  const portalParams = new URLSearchParams(fields).toString();

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-neutral-950">
      <div className="mx-auto max-w-sm text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Event WiFi</h1>

        {checkoutFailed ? (
          <p className="mt-3 text-sm text-red-700">
            Payment could not be started. Please try again.
          </p>
        ) : (
          <p className="mt-3 text-sm text-neutral-600">
            Reconnect to {ssid} to continue.
          </p>
        )}

        <a
          href={`/api/portal?${portalParams}`}
          className="mt-8 block rounded-xl bg-neutral-950 px-5 py-4 font-medium text-white"
        >
          Continue
        </a>
      </div>
    </main>
  );
}
