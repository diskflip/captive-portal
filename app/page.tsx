import EmbeddedCheckoutClient from "./embedded-checkout";

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
  const checkoutData: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    const resolvedValue = first(value);

    if (resolvedValue !== undefined) {
      checkoutData[key] = resolvedValue;
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

  checkoutData.client_reference_id =
    rawClientReferenceId
      .replace(/[^a-zA-Z0-9_.:-]/g, "_")
      .slice(0, 200);

  checkoutData.plan =
    first(params.plan) === "day" ? "day" : "hour";

  return (
    <EmbeddedCheckoutClient checkoutData={checkoutData} />
  );
}
