import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isCaptiveBrowser } from "./lib/captive";
import { createCheckoutSessionUrl } from "./lib/checkout-session";
import { GA_FIELDS, toPlanKey } from "./lib/plans";

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

  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!host) {
    throw new Error("Missing request host");
  }

  const captive = isCaptiveBrowser(
    requestHeaders.get("user-agent") ?? "",
  );

  redirect(
    await createCheckoutSessionUrl(
      toPlanKey(first(params.plan)),
      fields,
      `${protocol}://${host}`,
      captive,
    ),
  );
}
