export const PLAN = {
  name: "Event WiFi Pass",
  description: "Fast internet access for the event",
  unitAmount: 500,
  priceLabel: "$5",
} as const;

export const GA_FIELDS = ["ga_cmac", "ga_ap_mac", "ga_Qv", "ga_ssid"] as const;

export const REQUIRED_GA_FIELDS = ["ga_cmac", "ga_ap_mac", "ga_Qv"] as const;
