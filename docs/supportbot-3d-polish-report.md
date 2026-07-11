# Supportbot 3D-polish

Den befintliga React-supportboten har fått ett visuellt lyft utan att byta arkitektur eller lägga in hemligheter i webbläsarkoden.

## Ändrat

- `RobotMascot.tsx` använder nu en CSS-byggd robot med lager för huvud, visor, ögon, antenn, öron, mun, ljus och skugga.
- `SupportBotLauncher.tsx` har fått en mer premiumkänsla med gradient, ljus, djupare skugga och större robotavatar.
- `SupportBot.tsx` har fått en mer integrerad glass/robot-panelkänsla och korrigerad svensk text.
- `src/styles.css` innehåller idle-rörelse, blinkning, mjuk skuggpuls och `prefers-reduced-motion`-stöd.

## Verifiering

- `bun install --frozen-lockfile`
- `bun test src/features/support/support-engine.test.ts`
- `bun run lint`
- `bunx tsc --noEmit --pretty false`
- `bun run build`
- Lokal route-kontroll för `/`, `/kontakt` och robotassistenten.

Lint passerar med befintliga fast-refresh-varningar från UI-komponenterna, men utan fel.
