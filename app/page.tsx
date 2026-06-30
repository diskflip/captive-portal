import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const rawClientReferenceId =
    params.client_mac ||
    params.mac ||
    params.clientMac ||
    params.sta_mac ||
    params.cid ||
    "demo-device";

  const clientReferenceId = String(
    Array.isArray(rawClientReferenceId)
      ? rawClientReferenceId[0]
      : rawClientReferenceId
  )
    .replace(/[^a-zA-Z0-9_.:-]/g, "_")
    .slice(0, 200);

  const rawPlan = params.plan;
  const plan = String(Array.isArray(rawPlan) ? rawPlan[0] : rawPlan || "hour");

  redirect(
    `/api/checkout?plan=${encodeURIComponent(
      plan
    )}&client_reference_id=${encodeURIComponent(clientReferenceId)}`
  );
}
