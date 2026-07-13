# Portalens startlage

`portal.nova-it.se` är reserverad för en framtida kund- och adminportal. Ingen portalapp eller DNS-koppling ska delas med den publika webbplatsen innan projektet startar.

## Avgransning

- Publik webbplats: `nova-it.se`, Worker `supern0van-nova-it`.
- Portal: separat GitHub-repo, separat Cloudflare Worker, separat databas och separata hemligheter.
- Portalens release får aldrig kunna ändra eller avbryta den publika webbplatsen.

## Nar portalprojektet startar

1. Skapa separat repo, exempelvis `Nova-IT-portal`.
2. Skapa separat Cloudflare Worker och D1-databas för portaldata.
3. Koppla `portal.nova-it.se` som Cloudflare Custom Domain till portal-Workern. Cloudflare skapar då DNS-post och certifikat.
4. Skapa separat lokal-, preview- och produktionsmiljö.
5. Bygg inloggning med engångskod eller magisk länk för kund och MFA för admin.
6. Sätt integritetspolicy, gallring, biträdesavtal, backup och incidentrutin innan kunddata lagras.

## Visuell princip

Portalen ska använda samma fastställda färger, typografi, komponenter och ton som huvudwebbplatsen, men inte dela runtime, databas eller deploy med den.
