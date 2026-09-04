# Captive Portal

Wi-Fi captive portal: Stripe Hosted Checkout for payment, cnMaestro EasyPass for network access.

## Flow

1. Client connects to the WLAN and is redirected by cnMaestro to `/api/portal` with Cambium guest-access parameters.
2. `/api/portal` creates a Stripe Checkout Session and redirects to it.
3. On payment, Stripe redirects to `/success`, which verifies the Checkout Session with Stripe and calls the cnMaestro EasyPass login API to grant access.

## Environment variables

See `.env.example`.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
