import { headers } from "next/headers";
import { isCaptiveBrowser } from "../../lib/captive";
import { createCheckoutSessionUrl } from "../../lib/checkout-session";
import { GA_FIELDS, toPlanKey } from "../../lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const requestHeaders = await headers();

    const host = requestHeaders.get("host");

    if (!host) {
      throw new Error("Missing request host");
    }

    const protocol =
      requestHeaders.get("x-forwarded-proto") ?? "https";

    const fields: Record<string, string> = {};

    for (const key of GA_FIELDS) {
      const value = formData.get(key);

      if (typeof value === "string" && value) {
        fields[key] = value;
      }
    }

    const url = await createCheckoutSessionUrl(
      toPlanKey(formData.get("plan")),
      fields,
      `${protocol}://${host}`,
      isCaptiveBrowser(
        requestHeaders.get("user-agent") ?? "",
      ),
    );

    return Response.redirect(url, 303);
  } catch {
    return new Response(
      "Payment could not be started. Reconnect to the WiFi network and try again.",
      {
        status: 500,
        headers: { "content-type": "text/plain" },
      },
    );
  }
}
