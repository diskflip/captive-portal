import CheckoutRedirect from "./checkout-redirect";

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

  const checkoutParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        checkoutParams.append(key, item);
      }
    } else if (value !== undefined) {
      checkoutParams.set(key, value);
    }
  }

  const rawClientReferenceId =
    first(params.ga_cmac) ??
    first(params.client_mac) ??
    first(params.mac) ??
    first(params.clientMac) ??
    first(params.sta_mac) ??
    first(params.cid) ??
    "demo-device";

  const clientReferenceId = rawClientReferenceId
    .replace(/[^a-zA-Z0-9_.:-]/g, "_")
    .slice(0, 200);

  const plan = first(params.plan) ?? "hour";

  checkoutParams.set("plan", plan);
  checkoutParams.set("client_reference_id", clientReferenceId);

  return (
    <CheckoutRedirect
      href={`/api/checkout?${checkoutParams.toString()}`}
    />
  );
}
