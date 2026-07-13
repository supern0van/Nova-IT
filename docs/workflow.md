# Arbetsflöde

GitHub är projektets källa. `C:\Users\stefa\Documents\Nova IT` är den lokala arbetsmappen och zip-filer är endast leveranser eller backup.

## Branchar

- `main` ska alltid motsvara den senast godkända produktionsversionen.
- Större ändringar görs på en arbetsbranch, till exempel `feature/site-polish`, `fix/contact-flow` eller `codex/premium-service-system`.
- En arbetsbranch får granskas i lokal drift eller en Cloudflare-preview, men får inte publiceras som `nova-it.se`.
- Infrastruktur, dokumentation och produktändringar förs in i `main` när verifieringen passerar och den visuella rundan är godkänd.
- Skriv aldrig om pushad Git-historik med force push, rebase eller amend eftersom Lovable är anslutet till repot.

## Publiceringsrutin

1. Arbeta på branch och kör `bun run ci`.
2. Granska den lokala sidan eller en Cloudflare-preview i desktop och mobil.
3. För in den godkända ändringen i `main`.
4. Kontrollera `main` igen och kör `bun run deploy:production`.
5. Verifiera `https://nova-it.se` och den berörda funktionen efter deploy.

Det gör att den publika sajten är stabil medan nästa hemsidepass kan utvecklas ostört.

## Lokal rutin

```bash
bun install --frozen-lockfile
bun run dev
```

Innan commit:

```bash
bun run test
bun run lint
bun run typecheck
bun run build
```

Eller allt i följd:

```bash
bun run ci
```

## Definition of done

En ändring är klar när:

- svensk text är naturlig och skarp utan obekräftade påståenden
- mobil och desktop är kontrollerade
- kontaktflöden och länkar fungerar
- supportboten fungerar globalt
- `bun run ci` passerar
- ändringen är commitad och pushad

## Det som inte ska in i Git

- `node_modules`
- `.output`
- `.wrangler`
- `.codex`
- `.agents`
- riktiga API-nycklar, tokens eller kunduppgifter

## Hitta i repot

- Börja alltid i [README](../README.md).
- Aktuell drift och tekniskt läge finns i [projektstatus](project-status.md).
- Beslut som förklarar varför projektet ser ut som det gör finns i [projekthistorik](project-history.md).
