import { headers } from "next/headers";
import { createCheckoutSessionUrl } from "../../lib/checkout-session";
import { GA_FIELDS, REQUIRED_GA_FIELDS } from "../../lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorRedirect(
  request: Request,
  fields: Record<string, string>,
): Response {
  const target = new URL("/", request.url);

  for (const [key, value] of Object.entries(fields)) {
    target.searchParams.set(key, value);
  }

  target.searchParams.set("error", "checkout_failed");

  return Response.redirect(target, 303);
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();

  const fields: Record<string, string> = {};

  for (const key of GA_FIELDS) {
    const value = formData.get(key);

    if (typeof value === "string" && value) {
      fields[key] = value;
    }
  }

  if (REQUIRED_GA_FIELDS.some((key) => !fields[key])) {
    return errorRedirect(request, fields);
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  if (!host) {
    return errorRedirect(request, fields);
  }

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  try {
    const url = await createCheckoutSessionUrl(
      fields,
      `${protocol}://${host}`,
    );

    return Response.redirect(url, 303);
  } catch (error) {
    console.error(
      "Checkout session creation failed:",
      error instanceof Error ? error.message : "unknown error",
    );

    return errorRedirect(request, fields);
  }
}
