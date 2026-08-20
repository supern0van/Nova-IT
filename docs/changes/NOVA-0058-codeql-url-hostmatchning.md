---
id: NOVA-0058
date: 2026-08-20
date_precision: day
type: security
status: completed
systems:
  - public-site
  - ci-cd
---

# CodeQL: exakt hostmatchning i kontaktflödets fetch-mockar

## Vad ändrades?

`src/features/contact/contact-server.test.ts` använder nu en gemensam hjälpfunktion som parsar URL:er och kräver både `https:` och exakt hostname för externa Resend- och Turnstile-anrop. Samtliga 14 CodeQL-träffar som tidigare använde substring-matchning med `includes(...)` har ersatts.

## Varför?

CodeQL flaggade substring-matchning av hela URL-strängen som `Incomplete URL substring sanitization`. En sträng som innehåller ett förväntat domännamn i path, query eller som del av ett annat hostname kan annars ge en falsk positiv match i testmocken.

## Resultat

Testernas avsedda beteende är oförändrat för riktiga HTTPS-anrop till `api.resend.com` och `challenges.cloudflare.com`, samtidigt som hostmatchningen nu är entydig och defensiv mot ogiltiga URL:er. Ändringen ligger enbart i testkod och ändrar ingen produktionslogik.

## Dokumentationspåverkan

Ingen.
