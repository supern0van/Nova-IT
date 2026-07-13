# Arbetsflöde

GitHub är projektets källa. `C:\Users\stefa\Documents\Nova IT` är den lokala arbetsmappen och zip-filer är endast leveranser eller backup.

## Branchar

- `main` ska vara senaste stabila versionen.
- Större ändringar görs på en arbetsbranch, till exempel `feature/site-polish`, `fix/contact-flow` eller `codex/premium-service-system`.
- Infrastruktur som CI, dokumentation och projektregler kan mergas till `main` när verifieringen passerar.
- Skriv aldrig om pushad Git-historik med force push, rebase eller amend eftersom Lovable är anslutet till repot.

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
