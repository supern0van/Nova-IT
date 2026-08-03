import { resolveTxt, resolveMx } from "node:dns/promises";

const targets = [
  "https://nova-it.se/",
  "https://www.nova-it.se/",
  "https://novait.se/",
  "https://admin.nova-it.se/logga-in",
  "https://kundportal.nova-it.se/logga-in",
  "https://portal.nova-it.se/logga-in",
  "https://portal.novait.se/logga-in",
];

const domains = ["nova-it.se", "novait.se"];

function header(headers, name) {
  return headers.get(name) ?? "";
}

function hasDirective(value, directive) {
  return value
    .split(";")
    .map((part) => part.trim().toLowerCase())
    .includes(directive.toLowerCase());
}

async function checkHttp(url) {
  const response = await fetch(url, { method: "HEAD", redirect: "manual" });
  const csp = header(response.headers, "content-security-policy");
  const cacheControl = header(response.headers, "cache-control");
  const isPortal =
    new URL(url).hostname.includes("portal") || new URL(url).hostname === "admin.nova-it.se";

  return {
    url,
    status: response.status,
    location: header(response.headers, "location") || null,
    server: header(response.headers, "server"),
    hsts: header(response.headers, "strict-transport-security"),
    xFrameOptions: header(response.headers, "x-frame-options"),
    frameAncestorsNone: hasDirective(csp, "frame-ancestors 'none'"),
    objectSrcNone: hasDirective(csp, "object-src 'none'"),
    cacheControl,
    portalNoStore: isPortal ? cacheControl.toLowerCase().includes("no-store") : undefined,
  };
}

async function resolveOptional(kind, name, resolver) {
  try {
    return await resolver(name);
  } catch (error) {
    if (error && ["ENODATA", "ENOTFOUND", "ETIMEOUT"].includes(error.code)) {
      return [];
    }
    throw error;
  }
}

async function checkDns(domain) {
  const txt = await resolveOptional("TXT", domain, resolveTxt);
  const dmarc = await resolveOptional("TXT", `_dmarc.${domain}`, resolveTxt);
  const mx = await resolveOptional("MX", domain, resolveMx);
  const resendDkim = await resolveOptional("TXT", `resend._domainkey.${domain}`, resolveTxt);
  const resend2Dkim = await resolveOptional("TXT", `resend2._domainkey.${domain}`, resolveTxt);
  const resend3Dkim = await resolveOptional("TXT", `resend3._domainkey.${domain}`, resolveTxt);

  const spf = txt.map((parts) => parts.join("")).filter((value) => value.startsWith("v=spf1"));
  const dmarcValues = dmarc.map((parts) => parts.join(""));

  return {
    domain,
    mx,
    spf,
    dmarc: dmarcValues,
    dmarcPolicy: dmarcValues.map((value) => value.match(/\bp=([^;\s]+)/)?.[1] ?? null),
    resendDkimRecordCount: resendDkim.length,
    resend2DkimRecordCount: resend2Dkim.length,
    resend3DkimRecordCount: resend3Dkim.length,
  };
}

const http = await Promise.all(targets.map(checkHttp));
const dns = await Promise.all(domains.map(checkDns));

const findings = [];
for (const result of http) {
  if (!result.hsts) findings.push(`${result.url}: saknar HSTS-header`);
  if (result.portalNoStore === false) findings.push(`${result.url}: portalvy saknar no-store`);
  if (!result.frameAncestorsNone) findings.push(`${result.url}: CSP saknar frame-ancestors 'none'`);
}
for (const result of dns) {
  if (result.spf.length !== 1) findings.push(`${result.domain}: ska ha exakt en SPF-post`);
  if (result.dmarc.length !== 1) findings.push(`${result.domain}: ska ha exakt en DMARC-post`);
  if (result.dmarcPolicy.includes("none")) {
    findings.push(`${result.domain}: DMARC är p=none och bör skärpas när leverans är verifierad`);
  }
  if (result.resendDkimRecordCount > 1) {
    findings.push(
      `${result.domain}: flera TXT-poster finns på resend._domainkey; DKIM-selector ska normalt vara unik`,
    );
  }
}

console.log(
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      http,
      dns,
      findings,
    },
    null,
    2,
  ),
);

if (findings.length > 0) {
  process.exitCode = 1;
}
