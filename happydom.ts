import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Registrerar en DOM (happy-dom) globalt innan testfilerna körs, så att
// @testing-library/react kan rendera riktiga komponenter under `bun test`.
// Bun har ingen inbyggd DOM - detta är standardmönstret för Bun + React
// Testing Library. Se bunfig.toml ([test].preload).
GlobalRegistrator.register();
