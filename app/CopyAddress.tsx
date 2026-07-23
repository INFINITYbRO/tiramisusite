"use client";

import { useState } from "react";

export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="server-address" type="button" onClick={copyAddress}>
      <strong>{address}</strong>
      <span>{copied ? "СКОПИРОВАНО" : "КОПИРОВАТЬ"}</span>
    </button>
  );
}
