export const PLANS = {
  hour: {
    name: "1 Hour WiFi Pass",
    description: "Internet access for 1 hour",
    unitAmount: 200,
    accessMinutes: 60,
    label: "1 hour",
    price: "$2",
  },
  day: {
    name: "1 Day WiFi Pass",
    description: "Internet access for 24 hours",
    unitAmount: 500,
    accessMinutes: 1440,
    label: "1 day",
    price: "$5",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

export const GA_FIELDS = [
  "ga_cmac",
  "ga_ap_mac",
  "ga_Qv",
  "ga_ssid",
  "ga_nas_id",
  "ga_srvr",
  "ga_orig_url",
  "ga_cip",
  "s",
] as const;

export function toPlanKey(value: unknown): PlanKey {
  return value === "day" ? "day" : "hour";
}
