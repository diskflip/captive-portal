type CambiumMetadata = {
  ga_ap_mac?: string | null;
  ga_cmac?: string | null;
  ga_Qv?: string | null;
};

type CambiumLoginResponse = {
  data?: {
    status?: number;
    Status?: number;
    expiry?: number;
    Expiry?: number;
    msg?: string;
    Msg?: string;
    extURL?: string;
  };
};

type CambiumLoginResult = {
  expiry?: number;
  redirectUrl?: string;
  message?: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is missing`);
  }

  return value;
}

function requiredValue(
  value: string | null | undefined,
  name: string,
): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`${name} is missing from the portal session`);
  }

  return trimmed;
}

// A leading "/" on the relative path would make `new URL()` discard the
// base URL's existing pathname, which breaks EasyPass Base URLs that
// already include a path prefix. Join relative to the base's directory
// instead so the prefix survives.
//
// joinUrl("https://us-e1.api.cloud.cambiumnetworks.com", "api/v1/easypass/external-portal/login")
//   -> "https://us-e1.api.cloud.cambiumnetworks.com/api/v1/easypass/external-portal/login"
// Checked by scripts/check-cambium-url.ts.
export function joinUrl(baseUrl: string, relativePath: string): string {
  const trimmedBase = baseUrl.trim();
  const base = trimmedBase.endsWith("/") ? trimmedBase : `${trimmedBase}/`;
  const path = relativePath.replace(/^\/+/, "");

  return new URL(path, base).toString();
}

export async function loginToCambiumEasyPass(
  metadata: CambiumMetadata,
): Promise<CambiumLoginResult> {
  const baseUrl = requiredEnv("CAMBIUM_EASYPASS_BASE_URL");
  const secretKey = requiredEnv("CAMBIUM_EASYPASS_SECRET_KEY");
  const gaUser = requiredEnv("CAMBIUM_EASYPASS_GA_USER");
  const gaPass = requiredEnv("CAMBIUM_EASYPASS_GA_PASS");

  const response = await fetch(
    joinUrl(baseUrl, "api/v1/easypass/external-portal/login"),
    {
      method: "POST",
      cache: "no-store",

      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        ga_ap_mac: requiredValue(metadata.ga_ap_mac, "ga_ap_mac"),
        ga_cmac: requiredValue(metadata.ga_cmac, "ga_cmac"),
        ga_Qv: requiredValue(metadata.ga_Qv, "ga_Qv"),
        ga_user: gaUser,
        ga_pass: gaPass,
      }),
    },
  );

  let payload: CambiumLoginResponse | undefined;

  try {
    payload = (await response.json()) as CambiumLoginResponse;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    throw new Error(`cnMaestro login failed with HTTP ${response.status}`);
  }

  const data = payload?.data;
  const status = data?.status ?? data?.Status;

  if (status !== 0) {
    const message = data?.msg ?? data?.Msg;

    throw new Error(
      message
        ? `cnMaestro login rejected: ${message}`
        : `cnMaestro login rejected with status ${status ?? "unknown"}`,
    );
  }

  const expiry = data?.expiry ?? data?.Expiry;

  console.log("cnMaestro login succeeded:", {
    httpStatus: response.status,
    dataStatus: status,
    expiry,
  });

  return {
    expiry,
    redirectUrl: data?.extURL || undefined,
    message: data?.msg ?? data?.Msg,
  };
}
