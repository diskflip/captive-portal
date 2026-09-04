import { headers } from "next/headers";
import { createCheckoutSessionUrl } from "../../lib/checkout-session";
import { GA_FIELDS, REQUIRED_GA_FIELDS } from "../../lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function paramsFromRequest(request: Request): Promise<URLSearchParams> {
  if (request.method === "GET") {
    return new URL(request.url).searchParams;
  }

  const contentType = request.headers.get("content-type") ?? "";
  const params = new URLSearchParams();

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;

    for (const [key, value] of Object.entries(body)) {
      if (value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    }
  } else {
    const formData = await request.formData();

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        params.set(key, value);
      }
    }
  }

  return params;
}

function extractFields(params: URLSearchParams): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const key of GA_FIELDS) {
    const value = params.get(key);

    if (value) {
      fields[key] = value;
    }
  }

  return fields;
}

function toPortal(
  request: Request,
  fields: Record<string, string>,
  error?: string,
): Response {
  const target = new URL("/", request.url);

  for (const [key, value] of Object.entries(fields)) {
    target.searchParams.set(key, value);
  }

  if (error) {
    target.searchParams.set("error", error);
  }

  return Response.redirect(target, 303);
}

async function handlePortalRequest(request: Request): Promise<Response> {
  const params = await paramsFromRequest(request);
  const fields = extractFields(params);

  if (REQUIRED_GA_FIELDS.some((key) => !fields[key])) {
    return toPortal(request, fields);
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  if (!host) {
    return toPortal(request, fields, "checkout_failed");
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

    return toPortal(request, fields, "checkout_failed");
  }
}

export async function GET(request: Request): Promise<Response> {
  return handlePortalRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handlePortalRequest(request);
}
