/** Headers for authenticated public-site -> portal mutations. */
export function buildServerIntakeHeaders(secret: string, kind: "intag" | "statuskoll", json = true) {
  const prefix = kind === "intag" ? "intag" : "statuskoll";
  return {
    ...(json ? { "content-type": "application/json" } : {}),
    [`x-${prefix}-secret`]: secret,
    [`x-${prefix}-timestamp`]: String(Date.now()),
    [`x-${prefix}-nonce`]: crypto.randomUUID(),
  };
}
