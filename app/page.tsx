import { headers } from "next/headers";
import { isCaptiveBrowser } from "./lib/captive";
import { GA_FIELDS, PLANS, PLAN_KEYS } from "./lib/plans";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Promise<Record<string, SearchParamValue>>;

export const dynamic = "force-dynamic";

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();

  const captive = isCaptiveBrowser(
    requestHeaders.get("user-agent") ?? "",
  );

  const fields: Record<string, string> = {};

  for (const key of GA_FIELDS) {
    const value = first(params[key]);

    if (value) {
      fields[key] = value;
    }
  }

  const ssid = fields.ga_ssid ?? "the WiFi network";

  if (!fields.ga_cmac) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-neutral-950">
        <div className="mx-auto max-w-sm text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Join the WiFi first
          </h1>

          <p className="mt-3 text-sm text-neutral-600">
            Open your WiFi settings, connect to {ssid}, then
            return to this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-neutral-950">
      <div className="mx-auto flex max-w-sm flex-col">
        <h1 className="text-3xl font-semibold tracking-tight">
          Get online
        </h1>

        <p className="mt-2 text-sm text-neutral-600">
          Choose a pass. Your device is connected once payment
          completes.
        </p>

        <form
          method="POST"
          action="/api/checkout"
          className="mt-8 flex flex-col gap-3"
        >
          {GA_FIELDS.map((key) =>
            fields[key] ? (
              <input
                key={key}
                type="hidden"
                name={key}
                value={fields[key]}
              />
            ) : null,
          )}

          {PLAN_KEYS.map((key) => (
            <button
              key={key}
              type="submit"
              name="plan"
              value={key}
              className="flex items-center justify-between rounded-xl bg-neutral-950 px-5 py-5 text-left text-white"
            >
              <span className="font-medium">
                {PLANS[key].label}
              </span>

              <span className="text-lg font-semibold">
                {PLANS[key].price}
              </span>
            </button>
          ))}
        </form>

        {captive ? (
          <p className="mt-6 text-xs leading-relaxed text-neutral-500">
            Card payment only on this screen. Saved cards
            autofill from your keyboard. To pay with Apple Pay,
            close this window and open this page in Safari.
          </p>
        ) : null}

        <p className="mt-6 text-xs text-neutral-400">
          One device per pass. No refunds after your session
          starts.
        </p>
      </div>
    </main>
  );
}
