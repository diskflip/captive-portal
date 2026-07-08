import { NextResponse } from "next/server";
import { createCheckoutSessionUrl } from "../../lib/checkout-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const origin = new URL(request.url).origin;
    const url = await createCheckoutSessionUrl(body, origin);

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create Checkout Session";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
