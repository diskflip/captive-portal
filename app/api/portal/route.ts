function redirectWithParams(
  request: Request,
  params: URLSearchParams,
): Response {
  const target = new URL("/", request.url);

  for (const [key, value] of params) {
    target.searchParams.append(key, value);
  }

  return Response.redirect(target, 303);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);

  return redirectWithParams(request, url.searchParams);
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  const params = new URLSearchParams();

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;

    for (const [key, value] of Object.entries(body)) {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    }
  } else {
    const formData = await request.formData();

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        params.append(key, value);
      }
    }
  }

  return redirectWithParams(request, params);
}
