export const PLAN = {
  name: "WiFi",
  unitAmount: 400,
  priceLabel: "$4",
} as const;

export const GA_FIELDS = ["ga_cmac", "ga_ap_mac", "ga_Qv", "ga_ssid"] as const;

export const REQUIRED_GA_FIELDS = ["ga_cmac", "ga_ap_mac", "ga_Qv"] as const;
