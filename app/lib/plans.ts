export const PLAN = {
  name: "Event Wi-Fi Test — 1 Minute",
  description: "Fast internet access for the event",
  unitAmount: 100,
  priceLabel: "$1",
} as const;

export const GA_FIELDS = ["ga_cmac", "ga_ap_mac", "ga_Qv", "ga_ssid"] as const;

export const REQUIRED_GA_FIELDS = ["ga_cmac", "ga_ap_mac", "ga_Qv"] as const;
