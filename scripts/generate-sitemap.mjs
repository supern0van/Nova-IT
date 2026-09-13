#!/usr/bin/env bun
/**
 * Genererar public/sitemap.xml från de FAKTISKA routorna i src/routes/,
 * i stället för en handhållen fil - se docs/DECISIONS.md/förslaget som
 * motiverade detta: en handhållen sitemap glöms lätt bort när en ny sida
 * läggs till, vilket den gjorde här (`/assistent` saknades helt i den
 * gamla filen trots att sidan funnits i produktion sedan tidigare).
 *
 * Körs som första steget i `bun run build` (se package.json:s
 * `"build": "bun run sitemap && vite build"`) - varje build (lokalt och i
 * CI) skriver om sitemapen från grunden, så den kan aldrig hamna i otakt
 * med de riktiga routorna. Kör `bun run sitemap` för att bara regenerera
 * filen utan att bygga.
 *
 * Så här hålls den i synk automatiskt UTAN att gissa bort mänskligt
 * omdöme (priority/changefreq är en redaktionell bedömning, inte något
 * som går att räkna ut ur filnamnet):
 *
 *   1. Läs alla src/routes/*.tsx (utom __root.tsx) och extrahera den
 *      deklarerade routen ur `createFileRoute("...")`.
 *   2. Uteslut rena layoutroutor (innehållsdetektering av
 *      `component: () => <Outlet />`, t.ex. tjanster.tsx - INTE ett
 *      path-prefix-test, se kommentaren i las() för varför).
 *   3. Uteslut routor som bara omdirigerar (`throw redirect(...)` i
 *      filen, t.ex. /case-study -> /arbetssatt).
 *   4. Expandera kända dynamiska segment ($slug) mot den riktiga
 *      datakällan (tjänstelistan i lib/nova-data.ts).
 *   5. Slå upp priority/changefreq i ROUTE_META nedan. En route som
 *      saknar en post där får en konservativ standard OCH en
 *      konsolvarning (så den syns i CI-loggen) - filen saknar ALDRIG en
 *      URL, den kan bara sakna fin redaktionell prioritering tills någon
 *      lägger till en rad i ROUTE_META.
 *   6. lastmod per sida hämtas från `git log` på routefilen (senaste
 *      commit som rörde den) - äkta per-sida-datum, aldrig ett datum
 *      någon glömde uppdatera för hand.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROUTES_DIR = join(ROOT, "src/routes");
const BASE_URL = "https://nova-it.se";

/**
 * Redaktionell prioritering per URL. Nyckeln är den FÄRDIGA, normaliserade
 * webbadressens path (inte filnamnet eller createFileRoute-strängen).
 * Saknas en route här faller den tillbaka till DEFAULT_META nedan - se
 * konsolvarningen som då skrivs ut.
 */
const ROUTE_META = {
  "/": { changefreq: "weekly", priority: "1.0" },
  "/tjanster": { changefreq: "weekly", priority: "0.9" },
  "/privatpersoner": { changefreq: "monthly", priority: "0.9" },
  "/kontakt": { changefreq: "monthly", priority: "0.9" },
  "/foretag-foreningar": { changefreq: "monthly", priority: "0.8" },
  "/arbetssatt": { changefreq: "monthly", priority: "0.8" },
  "/arendestatus": { changefreq: "weekly", priority: "0.8" },
  "/assistent": { changefreq: "monthly", priority: "0.7" },
  "/faq": { changefreq: "monthly", priority: "0.7" },
  "/om-oss": { changefreq: "monthly", priority: "0.7" },
  "/projekt-aterbruk": { changefreq: "monthly", priority: "0.6" },
};

const SERVICE_META = { changefreq: "monthly", priority: "0.8" };
const DEFAULT_META = { changefreq: "monthly", priority: "0.5" };

/** Sista, explicita spärren för rena layoutfiler (filnamn i src/routes/),
 * ifall innehållsdetekteringen ovan någonsin skulle missa ett fall (t.ex.
 * en layout som skrivs på ett annat sätt än `() => <Outlet />`). */
const KANDA_LAYOUT_PATHS = new Set(["tjanster.tsx"]);

function normaliseraPath(rått) {
  // createFileRoute("/tjanster/") -> "/tjanster" (utom roten "/" själv).
  if (rått === "/") return "/";
  return rått.replace(/\/$/, "");
}

function lastmodForFil(absolutPath) {
  try {
    const datum = execFileSync("git", ["log", "-1", "--format=%cs", "--", absolutPath], {
      cwd: ROOT,
      encoding: "utf-8",
    }).trim();
    return datum || new Date().toISOString().slice(0, 10);
  } catch {
    // Ingen git-historik tillgänglig (t.ex. en färsk fil som ännu inte
    // committats) - dagens datum är ett rimligt, ofarligt fallback.
    return new Date().toISOString().slice(0, 10);
  }
}

function las() {
  const filer = readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".tsx") && f !== "__root.tsx");

  const routor = [];
  for (const fil of filer) {
    const absolutPath = join(ROUTES_DIR, fil);
    const innehall = readFileSync(absolutPath, "utf-8");

    const match = innehall.match(/createFileRoute\(\s*["']([^"']+)["']\s*\)/);
    if (!match) {
      console.warn(`⚠️  ${fil}: ingen createFileRoute(...)-deklaration hittad, hoppar över.`);
      continue;
    }

    const ärOmdirigering = /throw\s+redirect\(/.test(innehall);
    if (ärOmdirigering) continue;

    // Ren layoutroute (t.ex. tjanster.tsx: `component: () => <Outlet />`,
    // ingen egen sida) - INTE ett path-prefix-test mot andra routor, för
    // "/tjanster" (layoutens egen normaliserade path) och "/tjanster/"
    // (tjanster.index.tsx, normaliseras till SAMMA "/tjanster") kolliderar
    // annars till exakt samma sträng och ett prefix-test kan inte skilja
    // dem åt - den riktiga katalogsidan riskerar då att uteslutas
    // tillsammans med sin egen layout. Innehållsbaserad kontroll är
    // entydig oavsett path-kollisioner.
    const ärRenLayoutroute = /component:\s*\(\)\s*=>\s*<Outlet\s*\/?>/.test(innehall);
    if (ärRenLayoutroute || KANDA_LAYOUT_PATHS.has(fil)) continue;

    routor.push({
      fil,
      absolutPath,
      path: normaliseraPath(match[1]),
    });
  }

  return routor;
}

async function expandera(routor) {
  const { services } = await import("../src/lib/nova-data.ts");
  const resultat = [];

  for (const route of routor) {
    if (route.path === "/tjanster/$slug") {
      for (const service of services) {
        resultat.push({
          path: `/tjanster/${service.slug}`,
          lastmod: lastmodForFil(route.absolutPath),
          meta: SERVICE_META,
        });
      }
      continue;
    }

    if (route.path.includes("$")) {
      console.warn(
        `⚠️  ${route.fil}: dynamisk route "${route.path}" utan känd expansion - utesluten ur sitemapen. Lägg till en expansionsregel i scripts/generate-sitemap.mjs.`,
      );
      continue;
    }

    const meta = ROUTE_META[route.path];
    if (!meta) {
      console.warn(
        `⚠️  ${route.path}: ingen post i ROUTE_META - använder standardvärden (${DEFAULT_META.changefreq}, ${DEFAULT_META.priority}). Lägg till en rad i scripts/generate-sitemap.mjs för korrekt prioritering.`,
      );
    }

    resultat.push({
      path: route.path,
      lastmod: lastmodForFil(route.absolutPath),
      meta: meta ?? DEFAULT_META,
    });
  }

  return resultat.sort((a, b) => Number(b.meta.priority) - Number(a.meta.priority));
}

function byggXml(sidor) {
  const rader = sidor.map(
    (sida) =>
      `  <url>\n    <loc>${BASE_URL}${sida.path}</loc>\n    <lastmod>${sida.lastmod}</lastmod>\n    <changefreq>${sida.meta.changefreq}</changefreq>\n    <priority>${sida.meta.priority}</priority>\n  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rader.join("\n")}\n</urlset>\n`;
}

const routor = las();
const sidor = await expandera(routor);
const xml = byggXml(sidor);

writeFileSync(join(ROOT, "public/sitemap.xml"), xml, "utf-8");
console.log(`✓ public/sitemap.xml genererad med ${sidor.length} URL:er.`);
