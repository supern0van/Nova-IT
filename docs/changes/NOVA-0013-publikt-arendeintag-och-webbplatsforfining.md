---
id: NOVA-0013
date: 2026-07-29
date_precision: day
type: added
status: completed
systems:
  - Publik webbplats
  - Adminportal
  - Cloudflare Workers
---

# Publik webbplats: gemensamt ärendeintag, spamskydd och SEO/tillgänglighetsfixar

## Vad ändrades?

Kontaktformuläret och supportassistenten på nova-it.se skickade tidigare bara e-post via Resend
utan någon databaslagring - ett misslyckat mejl betydde att förfrågan inte fanns registrerad
någonstans. En ny, skyddad server-till-server-endpoint (`portal/app/api/public/intag/route.ts`,
skyddad med en delad hemlighet `INTAG_SECRET`) låter den publika webbplatsen skapa riktiga
ärenden i adminportalens databas, med idempotensnyckel mot dubbletter och en separat
`bekraftelse_status` så ett misslyckat bekräftelsemejl aldrig kan se ut som ett misslyckat
ärende. Kontaktformuläret fick honeypot, en tidskontroll och Cloudflare Turnstile-stöd (soft-fail
tills Turnstile är konfigurerat), samt ett tidigare saknat "Verksamhetens namn"-fält som annars
hade gjort att alla företags-/skol-/föreningsförfrågningar avvisades.

Utöver detta: `/tjanster/datorservice` synlig i katalogen igen, utökad serviceområdestext
(Järfälla/Jakobsberg, Sundbyberg, Solna), fyra sidor fick canonical- och OG-metadata de saknade,
`/assistent` tillagd i sitemap och länkad från sidfoten, tre ställen med för låg textkontrast
höjda till WCAG AA, samt hero- och presentationsbilderna komprimerade till WebP (93-96 % mindre).

## Varför?

Uppdraget var att göra den publika webbplatsen till en pålitlig kundresa och ärendeintagningsväg
inför att adminportalen tas i skarp drift, utan att bygga en kundportal eller andra funktioner
som är planerade till ett senare, separat spår. Ärendeintaget var den kritiska bristen; resten är
verifierade, konkreta fynd från en grundad genomgång (inte antaganden) av navigation, metadata,
kontrast och prestanda.

## Resultat

Ett misslyckat bekräftelsemejl gör inte längre att en förfrågan försvinner spårlöst - ärendet
finns alltid i adminportalen om intaget lyckades, och kunden ser en ärlig, olika text beroende på
om bekräftelsen faktiskt gick fram. Kontaktformuläret har grundläggande bot-/spamskydd. Fyra
tidigare metadata-lösa sidor delas nu korrekt på sociala medier, och tre ställen med
otillräcklig textkontrast är åtgärdade. Databasmigrationen är applicerad i produktion
(`admin_arenden.idempotensnyckel`, `admin_arenden.bekraftelse_status`).

Kvarstår innan Turnstile och rate limiting är skarpt: `INTAG_SECRET` måste sättas till samma
värde på båda Workers, Turnstile-nycklar måste skapas i Cloudflare Dashboard, och en
rate-limiting-regel bör läggas på zonnivå - alla tre är manuella Cloudflare Dashboard-steg som
inte kan utföras från kodbasen, se `docs/contact-form-activation.md`.

## Dokumentationspåverkan

`docs/contact-form-activation.md` har den fullständiga körordern för de tre kvarvarande manuella
Cloudflare-stegen. `docs/public-site-ux-audit.md` och `docs/public-site-grind6-audit.md`
dokumenterar den fullständiga granskningen och vad som återstår (fältmätning av LCP/CLS/INP,
riktigt skärmläsartest).
