# Figma-paket: Nova IT:s automatiska ärendeguide

Det här paketet är underlaget för ett separat designpass av Nova IT:s ärendeguide. Det ska inte blandas ihop med `docs/figma-next-pass.md`, som avsiktligt lämnar assistenten utanför.

## Rekommenderad arbetsordning i Figma

1. Skapa en ny sida som heter `Assistant exploration`.
2. Importera bilderna i `assets/` och placera dem oförändrade i en sektion som heter `00 Current reference`.
3. Klistra in hela innehållet i `figma-prompt.md` i Figma Make eller använd det som designbrief.
4. Använd `design-spec.md` som kontrollista när komponenter, varianter och prototypkopplingar byggs.
5. Använd `copy-deck.md` ordagrant. Förkorta bara texter om innebörden och de juridiska avgränsningarna bevaras.
6. Skapa tre visuella riktningar, välj en och gör därefter samtliga obligatoriska tillstånd i den riktningen.

## Vad Figma ska lösa

- En mer självklar form än en stor rektangulär chattbubbla.
- Tydligare visuell hierarki i en kompakt panel.
- Ett lugnt, sakligt och Nova IT-anpassat uttryck.
- En begriplig händelsekedja där tidigare val inte ser ut att försvinna.
- En tydlig övergång från guide till låst kontaktorsak och kundens egen text.
- Mobil layout utan att panelen känns som en inklämd desktopdialog.

## Vad Figma inte ska ändra

- Guiden ska klassificera ärendet och samla underlag, inte lösa problemet åt kunden.
- Varje färdigt resultat ska leda vidare till kontakt med Nova IT.
- Säkerhetsläget får ge en försiktighetsåtgärd, men inte teknisk felsökning.
- Kontaktorsaken är låst i formuläret; kunden skriver sin beskrivning i ett separat fält under den.
- Tidigare val ska finnas kvar i kronologisk ordning även om kunden ändrar ett val.
- Ingen persona med namnet Nova, ingen mänsklig imitation och inga AI-löften.
- Ingen ChromeOS Flex-kategori.
- Ingen länk till stor vy.

## Referensbilder

- `01-desktop-launcher-closed.png` – stängd startknapp i sidkontext.
- `02-desktop-guide-start.png` – öppnad guide och första ämnesval.
- `03-desktop-guide-active-history.png` – aktiv frågekedja efter ett ändrat situationsval.
- `04-desktop-guide-summary-history.png` – bedömning, redo-läge och primär CTA; historikens krav beskrivs i `design-spec.md`.
- `05-desktop-contact-handoff.png` – låst kontaktorsak ovanför kundens tomma beskrivning.
- `06-desktop-security-priority.png` – prioriterat säkerhetsläge.
- `07-mobile-guide-start.png` – mobil panel med fast inmatningsyta.

## Godkännandekriterium

Figma-leveransen är inte klar när bara en snygg startvy finns. Den är klar först när komponentbibliotek, desktop, mobil, valhistorik, säkerhetsläge, sammanfattning och kontaktöverlämning finns och går att klicka igenom i en prototyp.
