"use client";

import { useEffect } from "react";

export default function CheckoutRedirect({
  href,
}: {
  href: string;
}) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <div>
        <p>Opening secure checkout…</p>

        <a href={href}>
          Continue to checkout
        </a>
      </div>
    </main>
  );
}
