// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.
//
// KNOWN LIMITATION (review 2026-08-25, finding #3): `lastCapturedError` is
// module-scoped, not per-request. Cloudflare Workers can serve multiple
// concurrent requests in the same isolate, so two near-simultaneous
// throwing requests could race and `consumeLastCapturedError()` could
// return the WRONG request's error - misleading, not incorrect (the TTL
// still bounds how stale a mismatched error can be). Full per-request
// isolation (e.g. via `AsyncLocalStorage`, which TanStack Start already
// uses internally for `getRequest()`) was judged overkill for what is only
// a best-effort log enrichment, not something correctness depends on -
// if this ever needs to be trustworthy for automated alerting, revisit.
let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
